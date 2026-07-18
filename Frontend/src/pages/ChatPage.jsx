import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../api";
import { createSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function ChatPage() {
    const { userId } = useParams();
    const location = useLocation();
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [uploadError, setUploadError] = useState("");
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    const otherName = location.state?.name || "Chat";

    useEffect(() => {
        async function loadHistory() {
            const res = await api.get(`/api/messages/${userId}`);
            setMessages(res.data);
        }
        loadHistory();

        const socket = createSocket(token);
        socketRef.current = socket;
        socket.connect();

        socket.on("connect", () => {
            socket.emit("join_conversation", { with_user_id: userId });
        });

        socket.on("new_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function sendMessage() {
        const trimmed = text.trim();
        if (!trimmed || !socketRef.current) return;

        socketRef.current.emit("send_message", { to: userId, message: trimmed });
        setText("");
    }

    async function handleFileSelected(e) {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;

        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("to", userId);

        try {
            await api.post("/api/messages/upload", formData);
        } catch (err) {
            setUploadError(err.response?.data?.message || "Upload failed");
        }
    }

    return (
        <div>
            <div className="welcome-bar">
                <p>Chat with {otherName}</p>
                <Link to="/dashboard"><button>Back</button></Link>
            </div>

            {uploadError && <p className="error-text">{uploadError}</p>}

            <div className="chat-box">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-bubble ${msg.sender_id === user?.id ? "chat-bubble-mine" : "chat-bubble-theirs"}`}
                    >
                        {msg.message_type === "file" ? (
                            <a href={`${API_BASE_URL}${msg.file_url}`} target="_blank" rel="noreferrer" className="file-bubble-link">
                                📎 {msg.file_name}
                            </a>
                        ) : (
                            msg.message
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="inline-form">
                <button onClick={() => fileInputRef.current?.click()} className="attach-btn" title="Attach a file">📎</button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: "none" }} />
                <input
                    type="text"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}
