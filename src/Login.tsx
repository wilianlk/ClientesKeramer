import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import ClientsPage from "./ClientsPage";
import PendingReviewsPage from "./PendingReviewsPage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<"client" | "admin" | null>(null);
    const [authenticated, setAuthenticated] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
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
                <nav className="p-4 bg-black">
                    <Link to="/" className="mr-4 text-white hover:underline">
                        Clientes Keramer Corp.
                    </Link>
                    {role === "admin" && (
                        <Link to="/pendientes" className="mr-4 text-white hover:underline">
                            Revisiones Pendientes
                        </Link>
                    )}
                </nav>
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
        <div className="min-h-screen flex flex-col items-center bg-white text-black px-4 pt-12">
            {/* Logo */}
            <img
                src="/keramer.png"
                alt="Keramer Corp Logo"
                className="w-48 sm:w-60 md:w-72 h-auto mb-4"
            />

            {/* Título */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center tracking-wide">
                Sistema de actualización de BD clientes
            </h1>

            {/* Formulario */}
            <form
                onSubmit={handleLogin}
                className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
            >
                <h2 className="text-xl font-medium mb-4 text-center">Inicio de Sesión</h2>

                <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border p-2 w-full mb-3 bg-white text-black rounded"
                />

                {/* Campo contraseña con ícono alineado */}
                <div className="relative mb-5">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 w-full bg-white text-black rounded pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-black p-1"
                    >
                        {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition"
                >
                    Ingresar
                </button>
            </form>

            <ToastContainer />
        </div>
    );
};

export default Login;
