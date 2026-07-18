import { io } from "socket.io-client";

export function createSocket(token) {
    return io(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000", {
        auth: { token },
        autoConnect: false
    });
}
