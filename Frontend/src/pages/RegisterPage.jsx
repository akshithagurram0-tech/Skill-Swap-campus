import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            await register(name, email, password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    }

    return (
        <div className="auth-card">
            <h2>Register</h2>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
                <input
                    type="text"
                    placeholder="Student Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
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
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    );
}
