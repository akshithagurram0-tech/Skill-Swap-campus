import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext";

export default function NotificationBanner() {
    const { notifications, dismissNotification } = useSocketContext();
    const navigate = useNavigate();

    if (!notifications || notifications.length === 0) return null;

    function handleClick(n) {
        dismissNotification(n.id);
        const path = n.type === "call" ? `/call/${n.userId}` : `/chat/${n.userId}`;
        navigate(path, { state: { name: n.fromName } });
    }

    return (
        <div className="notification-stack">
            {notifications.map((n) => (
                <div key={n.id} className="notification-toast">
                    <span onClick={() => handleClick(n)}>
                        {n.type === "call" ? "📹 " : "💬 "}{n.text}
                    </span>
                    <button onClick={() => dismissNotification(n.id)}>x</button>
                </div>
            ))}
        </div>
    );
}
