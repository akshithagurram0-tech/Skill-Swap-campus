import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext";

// Public STUN only (no TURN) - works on the same network / localhost demo,
// may fail to connect across restrictive NATs in a real deployment.
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function CallPage() {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { socketRef, clearNotificationsFor } = useSocketContext();

    const [callStatus, setCallStatus] = useState("connecting");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const otherName = location.state?.name || "Call";

    useEffect(() => {
        let cancelled = false;
        const socket = socketRef.current;

        clearNotificationsFor(userId);

        if (!socket) return undefined;

        let joinConversation;
        let handlePeerJoined;
        let handleCallOffer;
        let handleCallAnswer;
        let handleIceCandidate;
        let handlePeerLeft;

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

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice_candidate", { to: userId, candidate: event.candidate });
                }
            };

            joinConversation = () => socket.emit("join_call", { with_user_id: userId });

            handlePeerJoined = async () => {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("call_offer", { to: userId, offer });
            };

            handleCallOffer = async ({ offer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("call_answer", { to: userId, answer });
            };

            handleCallAnswer = async ({ answer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            };

            handleIceCandidate = async ({ candidate }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch {
                    // ignore late/duplicate candidates
                }
            };

            handlePeerLeft = () => {
                setCallStatus("peer left");
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            };

            socket.on("connect", joinConversation);
            socket.on("peer_joined", handlePeerJoined);
            socket.on("call_offer", handleCallOffer);
            socket.on("call_answer", handleCallAnswer);
            socket.on("ice_candidate", handleIceCandidate);
            socket.on("peer_left", handlePeerLeft);

            if (socket.connected) joinConversation();
        }

        init();

        return () => {
            cancelled = true;
            socket.emit("leave_call", { with_user_id: userId });
            if (joinConversation) socket.off("connect", joinConversation);
            if (handlePeerJoined) socket.off("peer_joined", handlePeerJoined);
            if (handleCallOffer) socket.off("call_offer", handleCallOffer);
            if (handleCallAnswer) socket.off("call_answer", handleCallAnswer);
            if (handleIceCandidate) socket.off("ice_candidate", handleIceCandidate);
            if (handlePeerLeft) socket.off("peer_left", handlePeerLeft);
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
