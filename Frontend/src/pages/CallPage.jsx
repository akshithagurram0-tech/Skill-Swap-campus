import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

// Public STUN only (no TURN) - works on the same network / localhost demo,
// may fail to connect across restrictive NATs in a real deployment.
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function CallPage() {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [callStatus, setCallStatus] = useState("connecting");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);

    const otherName = location.state?.name || "Call";

    useEffect(() => {
        let cancelled = false;

        async function init() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (cancelled) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnectionRef.current = pc;
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
                setCallStatus("connected");
            };

            const socket = createSocket(token);
            socketRef.current = socket;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice_candidate", { to: userId, candidate: event.candidate });
                }
            };

            socket.on("connect", () => {
                socket.emit("join_call", { with_user_id: userId });
            });

            socket.on("peer_joined", async () => {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("call_offer", { to: userId, offer });
            });

            socket.on("call_offer", async ({ offer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("call_answer", { to: userId, answer });
            });

            socket.on("call_answer", async ({ answer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("ice_candidate", async ({ candidate }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch {
                    // ignore late/duplicate candidates
                }
            });

            socket.on("peer_left", () => {
                setCallStatus("peer left");
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            });

            socket.connect();
        }

        init();

        return () => {
            cancelled = true;
            socketRef.current?.emit("leave_call", { with_user_id: userId });
            socketRef.current?.disconnect();
            peerConnectionRef.current?.close();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    function hangUp() {
        navigate("/dashboard");
    }

    return (
        <div>
            <div className="welcome-bar">
                <p>Call with {otherName} - {callStatus}</p>
                <Link to="/dashboard"><button onClick={hangUp}>Hang Up</button></Link>
            </div>

            <div className="call-grid">
                <div className="video-tile">
                    <p className="muted-text">You</p>
                    <video ref={localVideoRef} autoPlay playsInline muted />
                </div>
                <div className="video-tile">
                    <p className="muted-text">{otherName}</p>
                    <video ref={remoteVideoRef} autoPlay playsInline />
                </div>
            </div>
        </div>
    );
}
