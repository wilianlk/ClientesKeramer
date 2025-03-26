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

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

// Tipos

interface Canal {
    id: string;
    nombre: string;
}

interface Address {
    id: string;
    csName: string;
    csAddr: string;
    csAddr2: string;
    csTele: string;
    csEmail: string;
    csTeri: string;
    csZip: string;
    resal: string;
    // Nueva propiedad para indicar si la dirección está en estado pendiente
    isPending?: boolean;
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
    direccionEnvio: {
        id: string;
        ciudad: string;
        coordX: number;
        coordY: number;
        csName: string;
        csAddr: string;
        csAddr2: string;
        csTele: string;
        csEmail: string;
        csTeri: string;
        csZip: string;
        resal: string;
        // Se espera que el backend ahora envíe esta propiedad
        isPending?: boolean;
    };
}

interface Client {
    id: string;
    name: string;
    city: string;
    channel: string;
    addresses: Address[];
}

interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

// Componente AddressTable
const AddressTable: React.FC<{
    addresses: Address[];
    onEdit: (addr: Address) => void;
}> = ({ addresses, onEdit }) => {
    const addressColumns = useMemo<ColumnDef<Address, any>[]>(() => [
        { header: "ID", accessorKey: "id" },
        { header: "Calle", accessorKey: "csAddr" },
        {
            header: "Acciones",
            cell: ({ row }) => {
                const address = row.original;
                // Si la dirección está pendiente, mostrar un indicador
                if (address.isPending) {
                    return (
                        <div className="bg-yellow-400 font-bold">
                            Pendiente
                        </div>
                    );
                }
                return (
                    <button
                        onClick={() => onEdit(address)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                        Editar
                    </button>
                );
            },
        },
    ], [onEdit]);

    const addressTable = useReactTable<Address>({
        data: addresses,
        columns: addressColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="overflow-x-auto w-full">
            <table className="table-auto w-full border border-gray-200 mt-2">
                <thead className="bg-green-100">
                {addressTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-2 border text-center">
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
                            <td key={cell.id} className="px-4 py-2 border text-center">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

// Componente MobileClientList (vista móvil)
const MobileClientList: React.FC<{
    clients: Client[];
    onEditAddress: (addr: Address) => void;
}> = ({ clients, onEditAddress }) => {
    return (
        <div className="space-y-4">
            {clients.map((client) => (
                <div key={client.id} className="bg-white shadow rounded p-3">
                    <div className="text-sm">
                        <p><strong>ID:</strong> {client.id}</p>
                        <p><strong>Nombre:</strong> {client.name}</p>
                        <p><strong>Ciudad:</strong> {client.city}</p>
                        <p><strong>Canal:</strong> {client.channel}</p>
                    </div>
                    {client.addresses && client.addresses.length > 0 && (
                        <div className="mt-2 border-t pt-2">
                            <p className="font-semibold">Direcciones:</p>
                            {client.addresses.map((addr) => (
                                <div key={addr.id} className="mt-2 text-sm border p-2 rounded">
                                    <p><strong>ID:</strong> {addr.id}</p>
                                    <p><strong>Nombre:</strong> {addr.csName}</p>
                                    <p><strong>Calle:</strong> {addr.csAddr}</p>
                                    {addr.isPending ? (
                                        <div className="text-red-600 font-bold">Pendiente</div>
                                    ) : (
                                        <button
                                            onClick={() => onEditAddress(addr)}
                                            className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                        >
                                            Editar Dirección
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Función para POST en historial de edición utilizando toast en lugar de alert
const postHistorialEdicion = async (data: any) => {
    try {
        const response = await fetch("https://localhost:7198/api/ClientesKeramer/historial-edicion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Error al guardar: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Guardado con éxito en historial:", result);
        toast.success("Datos guardados en el historial correctamente.");
    } catch (error) {
        console.error(error);
        toast.error("Ocurrió un error al guardar en el historial.");
    }
};

const App: React.FC = () => {
    const [channels, setChannels] = useState<Canal[]>([]);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [columnFilters, setColumnFilters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [editType, setEditType] = useState<"address" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<Address | null>(null);

    const [mobileSearchId, setMobileSearchId] = useState("");
    const [mobileSearchName, setMobileSearchName] = useState("");

    // Obtener canales
    useEffect(() => {
        fetch("https://localhost:7198/api/ClientesKeramer/canales")
            .then((res) => res.json())
            .then((data: Canal[]) => setChannels(data))
            .catch((error) => console.error("Error al obtener canales:", error));
    }, []);

    // Obtener clientes al cambiar de canal o paginación
    useEffect(() => {
        if (!selectedChannel) {
            setClients([]);
            return;
        }

        setIsLoading(true);

        const url = `https://localhost:7198/api/ClientesKeramer/clientesCanalEnvioSimpleAsync?canalId=${selectedChannel}&page=${
            pageIndex + 1
        }&pageSize=${pageSize}`;

        fetch(url)
            .then((res) => res.json())
            .then((result: PagedResult<ClienteAPI>) => {
                const transformed = result.items.map((item) => {
                    const direccion: Address = {
                        id: item.direccionEnvio?.id.trim() || "",
                        csName: item.direccionEnvio?.csName || "",
                        csAddr: item.direccionEnvio?.csAddr || "",
                        csAddr2: item.direccionEnvio?.csAddr2 || "",
                        csTele: item.direccionEnvio?.csTele || "",
                        csEmail: item.direccionEnvio?.csEmail || "",
                        csTeri: item.direccionEnvio?.csTeri || "",
                        csZip: item.direccionEnvio?.csZip || "",
                        resal: item.direccionEnvio?.resal || "",
                        isPending: item.direccionEnvio?.isPending || false,
                    };
                    return {
                        id: item.id,
                        name: item.nombre,
                        city: item.direccion,
                        channel: item.canalId,
                        addresses: [direccion],
                    } as Client;
                });
                setClients(transformed);
                setTotalCount(result.totalCount);
            })
            .catch((err) => console.error("Error al obtener clientes:", err))
            .finally(() => setIsLoading(false));
    }, [selectedChannel, pageIndex, pageSize]);

    // Actualizar filtros para móvil
    useEffect(() => {
        const filters = [];
        if (mobileSearchId.trim() !== "") {
            filters.push({ id: "id", value: mobileSearchId });
        }
        if (mobileSearchName.trim() !== "") {
            filters.push({ id: "name", value: mobileSearchName });
        }
        setColumnFilters(filters);
    }, [mobileSearchId, mobileSearchName]);

    // Definición de columnas para la tabla (escritorio)
    const columns = useMemo<ColumnDef<Client, any>[]>(() => [
        {
            id: "expander",
            header: () => null,
            cell: ({ row }) => (
                <button onClick={() => row.toggleExpanded()} className="focus:outline-none text-sm">
                    {row.getIsExpanded() ? "▼" : "►"}
                </button>
            ),
        },
        {
            header: ({ column }) => (
                <div className="flex flex-col items-start">
                    <div className="font-semibold">ID</div>
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
                <div className="flex flex-col items-start">
                    <div className="font-semibold">Nombre</div>
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
        {
            header: "Ciudad",
            accessorKey: "city",
            cell: (info) => <div className="text-center">{info.getValue()}</div>,
        },
        {
            header: "Canal",
            accessorKey: "channel",
            cell: (info) => <div className="text-center">{info.getValue()}</div>,
        },
    ], []);

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
            const newState =
                typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
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

    const filteredRows = table.getRowModel().rows;
    const filteredClients = filteredRows.map((row) => row.original);

    const handleEditAddress = (address: Address) => {
        setSelectedRecord(address);
        setEditType("address");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedRecord(null);
        setEditType(null);
    };

    const handleSave = async () => {
        console.log("Guardado", editType, selectedRecord);
        if (editType === "address" && selectedRecord) {
            const payload = {
                cust: selectedRecord.id,
                fechaEdicion: new Date().toISOString(),
                name: selectedRecord.csName,
                addr: selectedRecord.csAddr,
                addr2: selectedRecord.csAddr2,
                tele: selectedRecord.csTele,
                email: selectedRecord.csEmail,
                teri: selectedRecord.csTeri,
                zip: selectedRecord.csZip,
                resal: selectedRecord.resal,
                estado: "Pendiente",
                enter: "UsuarioActual",
            };
            await postHistorialEdicion(payload);
        }
        closeModal();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-start justify-center">
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
                <div className="w-full md:w-auto">
                    <label className="block text-gray-700 text-sm mb-2">
                        Seleccionar Canal:
                    </label>
                    <select
                        value={selectedChannel}
                        onChange={(e) => {
                            setSelectedChannel(e.target.value);
                            setPageIndex(0);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                    >
                        <option value="">-- Todos / Ninguno --</option>
                        {channels.map((canal) => (
                            <option key={canal.id} value={canal.id}>
                                {canal.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="block md:hidden w-full">
                    <div className="my-2 space-y-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Filtrar por ID:
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 123"
                                value={mobileSearchId}
                                onChange={(e) => setMobileSearchId(e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Filtrar por Nombre:
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Juan"
                                value={mobileSearchName}
                                onChange={(e) => setMobileSearchName(e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm"
                            />
                        </div>
                    </div>

                    <MobileClientList
                        clients={filteredClients}
                        onEditAddress={handleEditAddress}
                    />

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
                    {isLoading && (
                        <div className="mt-2 text-center text-blue-600">Cargando...</div>
                    )}
                </div>

                <div className="relative hidden md:block flex-1 bg-white shadow-lg rounded-lg p-6 sm:p-4">
                    <div className="overflow-x-auto w-full">
                        <table className="table-auto w-full border border-gray-200">
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
                                    <tr className="hover:bg-gray-50">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-2 border align-top">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                    {row.getIsExpanded() && (
                                        <tr>
                                            <td colSpan={row.getVisibleCells().length} className="bg-gray-50 border">
                                                <div className="p-4 text-left">
                                                    <strong>Direcciones:</strong>
                                                    <AddressTable
                                                        addresses={row.original.addresses}
                                                        onEdit={handleEditAddress}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            </tbody>
                        </table>
                    </div>
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

            {modalOpen && selectedRecord && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-left">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Editar Dirección
                        </h2>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">ID:</label>
                            <input
                                type="text"
                                value={selectedRecord.id || ""}
                                disabled
                                className="flex-1 px-2 py-1 border rounded text-sm bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Nombre:</label>
                            <input
                                type="text"
                                value={selectedRecord.csName || ""}
                                disabled
                                className="flex-1 px-2 py-1 border rounded text-sm bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Calle:</label>
                            <input
                                type="text"
                                value={selectedRecord.csAddr || ""}
                                onChange={(e) =>
                                    setSelectedRecord({ ...selectedRecord, csAddr: e.target.value })
                                }
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Dirección 2:</label>
                            <input
                                type="text"
                                value={selectedRecord.csAddr2 || ""}
                                onChange={(e) =>
                                    setSelectedRecord({ ...selectedRecord, csAddr2: e.target.value })
                                }
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Teléfono:</label>
                            <input
                                type="text"
                                value={selectedRecord.csTele || ""}
                                onChange={(e) =>
                                    setSelectedRecord({ ...selectedRecord, csTele: e.target.value })
                                }
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Correo:</label>
                            <input
                                type="text"
                                value={selectedRecord.csEmail || ""}
                                onChange={(e) =>
                                    setSelectedRecord({ ...selectedRecord, csEmail: e.target.value })
                                }
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Territorio:</label>
                            <input
                                type="text"
                                value={selectedRecord.csTeri || ""}
                                disabled
                                className="flex-1 px-2 py-1 border rounded text-sm bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Código Postal:</label>
                            <input
                                type="text"
                                value={selectedRecord.csZip || ""}
                                disabled
                                className="flex-1 px-2 py-1 border rounded text-sm bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center mb-2">
                            <label className="w-24 text-sm text-gray-700 text-right mr-2">Resal:</label>
                            <input
                                type="text"
                                value={selectedRecord.resal || ""}
                                disabled
                                className="flex-1 px-2 py-1 border rounded text-sm bg-gray-100"
                            />
                        </div>

                        <div className="mt-4 flex justify-center space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    );
};

export default App;
