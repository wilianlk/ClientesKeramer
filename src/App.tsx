// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ClientsPage from "./ClientsPage";
import PendingReviewsPage from "./PendingReviewsPage";

const App: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Router>
                {/* Barra de navegación */}
                <nav className="p-4 bg-gray-200">
                    <Link to="/" className="mr-4">
                        Clientes
                    </Link>
                    <Link to="/pendientes">Revisiones Pendientes</Link>
                </nav>

                {/* Contenedor principal */}
                <div className="flex-1 p-4">
                    <Routes>
                        <Route path="/" element={<ClientsPage />} />
                        <Route path="/pendientes" element={<PendingReviewsPage />} />
                    </Routes>
                </div>
            </Router>
        </div>
    );
};

export default App;
