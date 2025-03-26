import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface HistorialEdicionDto {
    cust: string;
    fechaEdicion: string;
    name: string;
    addr: string;
    addr2: string;
    tele: string;
    email: string;
    teri: string;
    zip: string;
    resal: string;
    estado: string;
    enter: string;
    actualName: string;
    actualAddr: string;
    actualAddr2: string;
    actualTele: string;
    actualEmail: string;
    actualTeri: string;
    actualZip: string;
    actualResal: string;
}

const PendingReviewsPage: React.FC = () => {
    const [historial, setHistorial] = useState<HistorialEdicionDto[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [filtro, setFiltro] = useState("");

    // Determina la clase de borde lateral (borde izquierdo) según el estado
    const getStatusBorderClass = (estado: string): string => {
        switch (estado) {
            case "Aprobado":
                return "border-l-green-500";
            case "Rechazado":
                return "border-l-red-500";
            default:
                return "border-l-yellow-500"; // Pendiente
        }
    };

    // Crea una etiqueta (badge) en la esquina superior derecha con color según el estado
    const getStatusBadge = (estado: string): JSX.Element => {
        let badgeClass = "";
        let text = estado;
        switch (estado) {
            case "Aprobado":
                badgeClass = "bg-green-500 text-white";
                break;
            case "Rechazado":
                badgeClass = "bg-red-500 text-white";
                break;
            default:
                badgeClass = "bg-yellow-400 text-black"; // Pendiente
                text = "Pendiente";
                break;
        }
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                {text}
            </span>
        );
    };

    useEffect(() => {
        const cargarHistorial = async () => {
            setCargando(true);
            setError("");
            try {
                const respuesta = await fetch("https://localhost:7198/api/ClientesKeramer/historial-ediciones");
                if (!respuesta.ok) {
                    throw new Error("Error al obtener historial_ediciones");
                }
                const datos: HistorialEdicionDto[] = await respuesta.json();
                setHistorial(datos);
            } catch (err: any) {
                setError(err.message || "Error desconocido");
                toast.error(err.message || "Error desconocido");
            } finally {
                setCargando(false);
            }
        };

        cargarHistorial();
    }, []);

    const restaurar = async (registro: HistorialEdicionDto) => {
        try {
            const payload = {
                cust: registro.cust,
                fechaEdicion: registro.fechaEdicion,
            };
            const respuesta = await fetch("https://localhost:7198/api/ClientesKeramer/restaurar-historial", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                throw new Error(errorData.message || "Error al restaurar");
            }
            const resultado = await respuesta.json();
            toast.success(resultado.message || "Restauración exitosa");
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        }
    };

    /**
     * Cambiar el estado (Pendiente, Aprobado, Rechazado).
     * Si se selecciona "Aprobado", invoca la restauración.
     */
    const cambiarEstado = async (registro: HistorialEdicionDto, nuevoEstado: string) => {
        setHistorial((prev) =>
            prev.map((item) =>
                item.cust === registro.cust && item.fechaEdicion === registro.fechaEdicion
                    ? { ...item, estado: nuevoEstado }
                    : item
            )
        );

        if (nuevoEstado === "Aprobado") {
            await restaurar(registro);
        } else if (nuevoEstado === "Rechazado") {
            toast.info("Estado cambiado a Rechazado");
        }
    };

    // Filtrado básico por `cust`
    const registrosFiltrados = historial.filter((reg) =>
        reg.cust.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="p-4 min-h-screen bg-gray-50">
            <ToastContainer />
            <h1 className="text-2xl font-bold mb-4">Historial de Ediciones</h1>

            {/* Barra de búsqueda / filtro */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Buscar por Cliente (cust):</label>
                <input
                    type="text"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Ej: 123456"
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full sm:w-64"
                />
            </div>

            {cargando && <p className="text-blue-500">Cargando...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!cargando && registrosFiltrados.length === 0 ? (
                <p className="text-gray-600">No se encontraron registros.</p>
            ) : (
                <div className="space-y-6">
                    {registrosFiltrados.map((reg, idx) => (
                        <div
                            key={`${reg.cust}-${reg.fechaEdicion}`}
                            className={`border rounded shadow-sm bg-white p-4 relative ${getStatusBorderClass(
                                reg.estado
                            )} border-l-4`}
                        >
                            {/* Encabezado con Título y Badge de Estado */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Registro {idx + 1} - Cliente: {reg.cust}
                                </h2>
                                {getStatusBadge(reg.estado)}
                            </div>

                            {/* Contenido dividido en 2 columnas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-2">
                                {/* Columna Izquierda: Información Actual */}
                                <div>
                                    <h3 className="font-bold mb-2 text-gray-700">Información Actual</h3>
                                    <table className="table-fixed w-full text-sm border-collapse">
                                        <colgroup>
                                            <col className="w-24" />
                                            <col className="w-auto" />
                                        </colgroup>
                                        <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Nombre:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualName}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Dirección:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualAddr}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Dirección 2:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualAddr2}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Teléfono:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualTele}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Correo:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualEmail}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Territorio:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualTeri}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Código Postal:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualZip}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Resal:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.actualResal}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Columna Derecha: Información a Editar */}
                                <div>
                                    <h3 className="font-bold mb-2 text-gray-700">Información a Editar</h3>
                                    <table className="table-fixed w-full text-sm border-collapse">
                                        <colgroup>
                                            <col className="w-24" />
                                            <col className="w-auto" />
                                        </colgroup>
                                        <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Cliente:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.cust}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Fecha Edición:
                                            </th>
                                            <td className="py-1 text-gray-800">
                                                {new Date(reg.fechaEdicion).toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Nombre:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.name}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Dirección:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.addr}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Dirección 2:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.addr2}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Teléfono:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.tele}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Correo:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.email}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Territorio:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.teri}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Código Postal:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.zip}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Resal:
                                            </th>
                                            <td className="py-1 text-gray-800">{reg.resal}</td>
                                        </tr>
                                        <tr>
                                            <th className="text-right pr-1 py-1 font-semibold text-gray-700 whitespace-nowrap">
                                                Estado:
                                            </th>
                                            <td className="py-1 text-gray-800">
                                                <select
                                                    value={reg.estado}
                                                    onChange={(e) => cambiarEstado(reg, e.target.value)}
                                                    className="border rounded px-2 py-1"
                                                    disabled={reg.estado !== "Pendiente"}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="Aprobado">Aprobado</option>
                                                    <option value="Rechazado">Rechazado</option>
                                                </select>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingReviewsPage;
