// Login.tsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import ClientsPage from "./ClientsPage";
import PendingReviewsPage from "./PendingReviewsPage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // role: "client" solo puede ver clientes, "admin" ve clientes y pendientes.
    const [role, setRole] = useState<"client" | "admin" | null>(null);
    const [authenticated, setAuthenticated] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Credenciales quemadas:
        // Usuario "client" (contraseña "client123") solo ve ClientsPage.
        // Usuario "admin" (contraseña "admin123") ve PendingReviewsPage y ClientsPage.
        if (username === "client" && password === "client123") {
            setRole("client");
            setAuthenticated(true);
        } else if (username === "admin" && password === "admin123") {
            setRole("admin");
            setAuthenticated(true);
        } else {
            toast.error("Credenciales inválidas");
        }
    };

    if (authenticated && role) {
        return (
            <Router>
                {/* Barra de navegación */}
                <nav className="p-4 bg-gray-200">
                    <Link to="/" className="mr-4">
                        Clientes
                    </Link>
                    {role === "admin" && (
                        <Link to="/pendientes" className="mr-4">
                            Revisiones Pendientes
                        </Link>
                    )}
                </nav>
                {/* Contenedor principal */}
                <div className="flex-1 p-4">
                    <Routes>
                        <Route path="/" element={<ClientsPage />} />
                        {role === "admin" && (
                            <Route path="/pendientes" element={<PendingReviewsPage />} />
                        )}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
                <ToastContainer />
            </Router>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md">
                <h2 className="text-xl mb-4">Inicio de Sesión</h2>
                <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border p-2 w-full mb-2"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 w-full mb-4"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Ingresar
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;
