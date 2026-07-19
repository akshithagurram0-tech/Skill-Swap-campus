import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createSocket } from "../socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { token } = useAuth();
    const socketRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!token) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socket = createSocket(token);
        socketRef.current = socket;
        socket.connect();

        socket.on("message_notification", (data) => {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `msg-${data.from}-${Date.now()}`,
                    type: "message",
                    userId: data.from,
                    fromName: data.from_name,
                    text: `New message from ${data.from_name}: ${data.preview}`
                }
            ]);
        });

        socket.on("incoming_call_notification", (data) => {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `call-${data.from}-${Date.now()}`,
                    type: "call",
                    userId: data.from,
                    fromName: data.from_name,
                    text: `${data.from_name} started a video call with you`
                }
            ]);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    function dismissNotification(id) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }

    function clearNotificationsFor(userId) {
        setNotifications((prev) => prev.filter((n) => n.userId !== userId));
    }

    return (
        <SocketContext.Provider value={{ socketRef, notifications, dismissNotification, clearNotificationsFor }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext() {
    return useContext(SocketContext);
}
