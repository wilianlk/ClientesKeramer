import React, { useState, useEffect, useMemo } from "react";
import {
    useReactTable,
    ColumnDef,
    getCoreRowModel,
    getExpandedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";

// Tipos

interface Canal {
    id: string;
    nombre: string;
}

interface DireccionEnvio {
    id: string;
    ciudad: string;
    coordX: number;
    coordY: number;
    csName: string;
    csAddr: string;
    csTele: string;
}

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

interface Address {
    id: string | number;
    street: string;
    city: string;
}

interface Client {
    id: string;
    name: string;
    city: string;
    channel: string;
    addresses: Address[];
}

// Interfaz para la respuesta paginada (opcional pero recomendable)
interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

const App: React.FC = () => {
    // Estado para canales
    const [channels, setChannels] = useState<Canal[]>([]);
    // Estado para el canal seleccionado
    const [selectedChannel, setSelectedChannel] = useState("");
    // Estado para los clientes (ya transformados)
    const [clients, setClients] = useState<Client[]>([]);
    // Estado para los filtros de columnas
    const [columnFilters, setColumnFilters] = useState([]);
    // Estado para controlar el spinner de carga
    const [isLoading, setIsLoading] = useState(false);

    // Estados para paginación
    const [pageIndex, setPageIndex] = useState(0); // base 0 para TanStack Table
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    // Estados para el modal y edición
    const [modalOpen, setModalOpen] = useState(false);
    const [editType, setEditType] = useState<"client" | "address" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);

    // 1. Obtener canales
    useEffect(() => {
        fetch("https://localhost:7198/api/ClientesKeramer/canales")
            .then((res) => res.json())
            .then((data: Canal[]) => {
                setChannels(data);
            })
            .catch((error) => console.error("Error al obtener canales:", error));
    }, []);

    // 2. Obtener clientes al cambiar de canal o paginación
    useEffect(() => {
        if (!selectedChannel) {
            setClients([]);
            return;
        }

        setIsLoading(true);

        // El backend espera page (base 1) y pageSize
        const url = `https://localhost:7198/api/ClientesKeramer/clientesCanalEnvioSimpleAsync?canalId=${selectedChannel}&page=${
            pageIndex + 1
        }&pageSize=${pageSize}`;

        fetch(url)
            .then((res) => res.json())
            .then((result: PagedResult<ClienteAPI>) => {
                // El API devuelve { items, totalCount, page, pageSize }
                // Transformamos cada elemento del array items a nuestro tipo Client
                const transformed = result.items.map(transformCliente);
                setClients(transformed);
                setTotalCount(result.totalCount);
            })
            .catch((err) => console.error("Error al obtener clientes:", err))
            .finally(() => setIsLoading(false));
    }, [selectedChannel, pageIndex, pageSize]);

    // Transformar la respuesta del endpoint (ClienteAPI) a nuestro tipo Client
    const transformCliente = (item: ClienteAPI): Client => {
        return {
            id: item.id,
            name: item.nombre,
            city: item.direccion,
            channel: item.canalId,
            addresses: [
                {
                    id: item.direccionEnvio?.id || "",
                    street: item.direccionEnvio?.csAddr || "",
                    city: item.direccionEnvio?.ciudad || "",
                },
            ],
        };
    };

    // Definición de columnas (con filtros en ID y Nombre)
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
        {
            header: ({ column }) => (
                <div>
                    <div>ID</div>
                    <input
                        type="text"
                        value={(column.getFilterValue() as string) || ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        placeholder="Filtrar..."
                        className="border rounded px-2 py-1 text-sm mt-1"
                    />
                </div>
            ),
            accessorKey: "id",
            filterFn: "includesString",
        },
        {
            header: ({ column }) => (
                <div>
                    <div>Nombre</div>
                    <input
                        type="text"
                        value={(column.getFilterValue() as string) || ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        placeholder="Filtrar..."
                        className="border rounded px-2 py-1 text-sm mt-1"
                    />
                </div>
            ),
            accessorKey: "name",
            filterFn: "includesString",
        },
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

    // Configuración de la tabla con paginación manual
    const table = useReactTable<Client>({
        data: clients,
        columns,
        manualPagination: true,
        pageCount: Math.ceil(totalCount / pageSize),
        state: {
            pagination: { pageIndex, pageSize },
            columnFilters,
        },
        onPaginationChange: (updater) => {
            const newState = updater({ pageIndex, pageSize });
            setPageIndex(newState.pageIndex);
            setPageSize(newState.pageSize);
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSubRows: () => undefined,
        getRowCanExpand: () => true,
    });

    // Tabla de direcciones
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

    // Cerrar modal
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
        <div className="min-h-screen bg-gray-50 p-4 flex items-start justify-center">
            {/* Contenedor principal en flex para ubicar el selector a la izquierda y la tabla a la derecha */}
            <div className="flex gap-4 w-full max-w-6xl">
                {/* Selector de canal */}
                <div>
                    <label className="block text-gray-700 text-sm mb-2">
                        Seleccionar Canal:
                    </label>
                    <select
                        value={selectedChannel}
                        onChange={(e) => {
                            setSelectedChannel(e.target.value);
                            // Reinicia la página al cambiar de canal
                            setPageIndex(0);
                        }}
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

                {/* Contenedor de la tabla (con overlay para el spinner) */}
                <div className="relative flex-1 bg-white shadow-lg rounded-lg p-6">
                    {/* Tabla principal de clientes */}
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
                                        <td
                                            colSpan={row.getVisibleCells().length}
                                            className="bg-gray-50 border"
                                        >
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

                    {/* Overlay del spinner si isLoading es true */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
                            <svg
                                className="animate-spin h-8 w-8 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                            </svg>
                        </div>
                    )}
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
                                            setSelectedRecord({
                                                ...selectedRecord,
                                                name: e.target.value,
                                            })
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
                                            setSelectedRecord({
                                                ...selectedRecord,
                                                city: e.target.value,
                                            })
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
                                            setSelectedRecord({
                                                ...selectedRecord,
                                                channel: e.target.value,
                                            })
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
                                            setSelectedRecord({
                                                ...selectedRecord,
                                                street: e.target.value,
                                            })
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
                                            setSelectedRecord({
                                                ...selectedRecord,
                                                city: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
                                    />
                                </label>
                                {/* Se ha eliminado el iframe de Google Maps */}
                                <div className="mt-4">
                                    <p className="text-gray-600 text-sm">
                                        Vista de mapa eliminada.
                                    </p>
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
