import React, { useEffect, useState } from "react";

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
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const cargarHistorial = async () => {
            setCargando(true);
            setError("");
            setMensaje("");
            try {
                const respuesta = await fetch("https://localhost:7198/api/ClientesKeramer/historial-ediciones");
                if (!respuesta.ok) {
                    throw new Error("Error al obtener historial_ediciones");
                }
                const datos: HistorialEdicionDto[] = await respuesta.json();
                setHistorial(datos);
            } catch (err: any) {
                setError(err.message || "Error desconocido");
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
            setMensaje(resultado.message || "Restauración exitosa");
        } catch (err: any) {
            setError(err.message);
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
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Historial de Ediciones</h1>
            {cargando && <p>Cargando...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {mensaje && <p className="text-green-600">{mensaje}</p>}

            {!cargando && historial.length === 0 ? (
                <p>No hay registros en historial_ediciones.</p>
            ) : (
                <div className="space-y-6">
                    {historial.map((reg, idx) => (
                        <div key={idx} className="border rounded p-4 bg-white shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">
                                Registro {idx + 1} - Cliente: {reg.cust}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Columna Izquierda: Información Actual */}
                                <div>
                                    <h3 className="font-bold mb-2 text-gray-700">Información Actual</h3>
                                    <table className="min-w-full text-sm">
                                        <tbody>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Nombre:</th>
                                            <td>{reg.actualName}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Dirección:</th>
                                            <td>{reg.actualAddr}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Dirección 2:</th>
                                            <td>{reg.actualAddr2}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Teléfono:</th>
                                            <td>{reg.actualTele}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Correo:</th>
                                            <td>{reg.actualEmail}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Territorio:</th>
                                            <td>{reg.actualTeri}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Código Postal:</th>
                                            <td>{reg.actualZip}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Resal:</th>
                                            <td>{reg.actualResal}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Columna Derecha: Información a Editar */}
                                <div>
                                    <h3 className="font-bold mb-2 text-gray-700">Información a Editar</h3>
                                    <table className="min-w-full text-sm">
                                        <tbody>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Cliente:</th>
                                            <td>{reg.cust}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Fecha Edición:</th>
                                            <td>{new Date(reg.fechaEdicion).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Nombre:</th>
                                            <td>{reg.name}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Dirección:</th>
                                            <td>{reg.addr}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Dirección 2:</th>
                                            <td>{reg.addr2}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Teléfono:</th>
                                            <td>{reg.tele}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Correo:</th>
                                            <td>{reg.email}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Territorio:</th>
                                            <td>{reg.teri}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Código Postal:</th>
                                            <td>{reg.zip}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Resal:</th>
                                            <td>{reg.resal}</td>
                                        </tr>
                                        <tr>
                                            <th className="pr-2 text-right font-semibold">Estado:</th>
                                            <td>
                                                <select
                                                    value={reg.estado}
                                                    onChange={(e) => cambiarEstado(reg, e.target.value)}
                                                    className="border rounded px-2 py-1"
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
