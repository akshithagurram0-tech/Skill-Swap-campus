import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    }

    return (
        <div className="auth-card">
            <h2>Login</h2>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p>New here? <Link to="/register">Create an account</Link></p>
        </div>
    );
}
