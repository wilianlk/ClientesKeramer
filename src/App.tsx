import React, { useState, useEffect, useMemo } from "react";
import {
    useReactTable,
    ColumnDef,
    getCoreRowModel,
    getExpandedRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";

// Tipos

interface Canal {
    id: string;
    nombre: string;
}

// Estructura interna de la API para la dirección de envío
interface DireccionEnvio {
    id: string;
    ciudad: string;
    coordX: number;
    coordY: number;
    csName: string;
    csAddr: string;
    csTele: string;
}

// Estructura tal cual la retorna la API de clientesCanalEnvioSimpleAsync
interface ClienteAPI {
    compania: string;
    id: string;
    codigoReferencia: string;
    nombre: string;
    telefono: string;
    direccion: string;
    canalId: string;
    canalNombre: string;
    direccionEnvio: DireccionEnvio;
}

// Tipos para la tabla
interface Address {
    id: string | number; // ID puede ser string si viene así de la API
    street: string;
    city: string;
}

interface Client {
    id: string;
    name: string;
    city: string;
    channel: string;
    addresses: Address[];
    // Opcional si quieres manejar "age", "telefono", etc.
    // age?: number;
    // phone?: string;
}

const App: React.FC = () => {
    // Estado para canales
    const [channels, setChannels] = useState<Canal[]>([]);
    // Estado para el canal seleccionado en el <select>
    const [selectedChannel, setSelectedChannel] = useState("");
    // Estado para los clientes que retorna la API
    const [clients, setClients] = useState<Client[]>([]);

    // Estados para el modal y el registro seleccionado
    const [modalOpen, setModalOpen] = useState(false);
    const [editType, setEditType] = useState<"client" | "address" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);

    // 1. Efecto para obtener canales
    useEffect(() => {
        fetch("https://localhost:7198/api/ClientesKeramer/canales")
            .then((res) => res.json())
            .then((data: Canal[]) => {
                setChannels(data);
            })
            .catch((error) => console.error("Error al obtener canales:", error));
    }, []);

    // 2. Efecto para obtener clientes al cambiar de canal
    useEffect(() => {
        if (!selectedChannel) {
            // Si no hay canal seleccionado, limpiamos o podríamos dejar vacío
            setClients([]);
            return;
        }

        const url = `https://localhost:7198/api/ClientesKeramer/clientesCanalEnvioSimpleAsync?canalId=${selectedChannel}`;
        fetch(url)
            .then((res) => res.json())
            .then((data: ClienteAPI[]) => {
                // Transformamos los datos para ajustarlos a la estructura de nuestro Client
                const transformed = data.map(transformCliente);
                setClients(transformed);
            })
            .catch((err) => console.error("Error al obtener clientes:", err));
    }, [selectedChannel]);

    // Función que transforma la respuesta del endpoint (ClienteAPI) en nuestro tipo Client
    const transformCliente = (item: ClienteAPI): Client => {
        return {
            id: item.id, // string
            name: item.nombre,
            city: item.direccion,  // Asumes que "direccion" es la "city" principal
            channel: item.canalId,
            // Creamos un array de addresses con la información de direccionEnvio
            addresses: [
                {
                    id: item.direccionEnvio?.id || "",
                    street: item.direccionEnvio?.csAddr || "",
                    city: item.direccionEnvio?.ciudad || "",
                },
            ],
        };
    };

    // Columnas para la tabla principal
    const columns = useMemo<ColumnDef<Client, any>[]>(() => [
        {
            id: "expander",
            header: () => null,
            cell: ({ row }) => (
                <button
                    onClick={() => row.toggleExpanded()}
                    className="focus:outline-none text-sm"
                >
                    {row.getIsExpanded() ? "▼" : "►"}
                </button>
            ),
        },
        { header: "ID", accessorKey: "id" },
        { header: "Nombre", accessorKey: "name" },
        { header: "Ciudad", accessorKey: "city" },
        { header: "Canal", accessorKey: "channel" },
        {
            header: "Acciones",
            cell: ({ row }) => (
                <button
                    onClick={() => {
                        setSelectedRecord(row.original);
                        setEditType("client");
                        setModalOpen(true);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                    Editar Cliente
                </button>
            ),
        },
    ], []);

    // Tabla con TanStack Table
    const table = useReactTable<Client>({
        data: clients,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSubRows: () => undefined,       // No usamos subfilas "reales"
        getRowCanExpand: () => true,       // Forzamos expansión manual
    });

    // Componente para tabla de direcciones
    const AddressTable = ({ addresses }: { addresses: Address[] }) => {
        const addressColumns = useMemo<ColumnDef<Address, any>[]>(() => [
            { header: "ID", accessorKey: "id" },
            { header: "Calle", accessorKey: "street" },
            { header: "Ciudad", accessorKey: "city" },
            {
                header: "Acciones",
                cell: ({ row }) => (
                    <button
                        onClick={() => {
                            setSelectedRecord(row.original);
                            setEditType("address");
                            setModalOpen(true);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                        Editar
                    </button>
                ),
            },
        ], []);

        const addressTable = useReactTable<Address>({
            data: addresses,
            columns: addressColumns,
            getCoreRowModel: getCoreRowModel(),
        });

        return (
            <table className="min-w-full text-center border border-gray-200 mt-2">
                <thead className="bg-green-100">
                {addressTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-2 border">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {addressTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-2 border">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    // Cierra modal
    const closeModal = () => {
        setModalOpen(false);
        setSelectedRecord(null);
        setEditType(null);
    };

    // Guardar (ficticio)
    const handleSave = () => {
        console.log("Guardado", editType, selectedRecord);
        closeModal();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Clientes por Canal</h1>

            {/* Select de canales */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">Seleccionar Canal:</label>
                <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    <option value="">-- Todos / Ninguno --</option>
                    {channels.map((canal) => (
                        <option key={canal.id} value={canal.id}>
                            {canal.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabla principal de clientes */}
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
                <table className="min-w-full text-center border border-gray-200">
                    <thead className="bg-blue-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="px-4 py-2 border">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <React.Fragment key={row.id}>
                            {/* Fila principal del cliente */}
                            <tr className="hover:bg-gray-50">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-2 border">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                            {/* Fila expandida: tabla anidada de direcciones */}
                            {row.getIsExpanded() && (
                                <tr>
                                    <td colSpan={row.getVisibleCells().length} className="bg-gray-50 border">
                                        <div className="p-4 text-left">
                                            <strong>Direcciones:</strong>
                                            <AddressTable addresses={row.original.addresses} />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>
                {/* Paginación */}
                <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Modal de edición */}
            {modalOpen && selectedRecord && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            {editType === "client" ? "Editar Cliente" : "Editar Dirección"}
                        </h2>
                        {editType === "client" ? (
                            <>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Nombre:
                                    <input
                                        type="text"
                                        value={selectedRecord.name}
                                        onChange={(e) =>
                                            setSelectedRecord({ ...selectedRecord, name: e.target.value })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Ciudad:
                                    <input
                                        type="text"
                                        value={selectedRecord.city}
                                        onChange={(e) =>
                                            setSelectedRecord({ ...selectedRecord, city: e.target.value })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Canal:
                                    <input
                                        type="text"
                                        value={selectedRecord.channel}
                                        onChange={(e) =>
                                            setSelectedRecord({ ...selectedRecord, channel: e.target.value })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Calle:
                                    <input
                                        type="text"
                                        value={selectedRecord.street}
                                        onChange={(e) =>
                                            setSelectedRecord({ ...selectedRecord, street: e.target.value })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Ciudad:
                                    <input
                                        type="text"
                                        value={selectedRecord.city}
                                        onChange={(e) =>
                                            setSelectedRecord({ ...selectedRecord, city: e.target.value })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                                <div className="mt-4">
                                    <iframe
                                        title="Google Maps"
                                        width="100%"
                                        height="200"
                                        loading="lazy"
                                        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(
                                            selectedRecord.street + ", " + selectedRecord.city
                                        )}`}
                                        className="rounded"
                                    ></iframe>
                                </div>
                            </>
                        )}
                        <div className="mt-4 flex justify-center space-x-3">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setSelectedRecord(null);
                                    setEditType(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    handleSave();
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
