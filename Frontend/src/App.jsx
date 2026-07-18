import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import CallPage from "./pages/CallPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
    return (
        <div className="container">
            <h1>🎓 SkillSwap Exchange</h1>
            <p>Connect students through skill exchange.</p>

            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/:userId"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/call/:userId"
                    element={
                        <ProtectedRoute>
                            <CallPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </div>
    );
}
