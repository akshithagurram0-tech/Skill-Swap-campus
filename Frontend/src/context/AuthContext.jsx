import { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    function saveSession(newToken, newUser) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }

    async function register(name, email, password) {
        const res = await api.post("/api/auth/register", { name, email, password });
        saveSession(res.data.token, res.data.user);
        return res.data;
    }

    async function login(email, password) {
        const res = await api.post("/api/auth/login", { email, password });
        saveSession(res.data.token, res.data.user);
        return res.data;
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }

    function updateUser(updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    }

    return (
        <AuthContext.Provider value={{ token, user, register, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
