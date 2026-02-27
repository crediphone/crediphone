"use client";

/**
 * FASE 20: PayjoyPanel
 * Panel para vincular/desvincular un crédito con una orden de Payjoy
 * y ver el historial de pagos sincronizados.
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Credito } from "@/types";
import {
    Zap,
    Link2,
    Unlink,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface PayjoyPanelProps {
    credito: Credito;
    onRefresh: () => void;
}

export function PayjoyPanel({ credito, onRefresh }: PayjoyPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [financeOrderId, setFinanceOrderId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [syncData, setSyncData] = useState<{
        pagos: any[];
        webhooks: number;
        lastSyncAt: string;
    } | null>(null);

    const isLinked = !!credito.payjoyFinanceOrderId;

    const showMsg = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleLink = async () => {
        if (!financeOrderId.trim() || !customerId.trim()) {
            showMsg("error", "Finance Order ID y Customer ID son requeridos");
            return;
        }
        setLinking(true);
        try {
            const res = await fetch("/api/payjoy/link-credit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creditoId: credito.id,
                    financeOrderId: financeOrderId.trim(),
                    customerId: customerId.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                showMsg("success", "Crédito vinculado con Payjoy");
                setShowLinkForm(false);
                setFinanceOrderId("");
                setCustomerId("");
                onRefresh();
            } else {
                showMsg("error", data.error || "Error al vincular");
            }
        } catch {
            showMsg("error", "Error de conexión");
        } finally {
            setLinking(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirm("¿Desvincular este crédito de Payjoy? Los pagos ya registrados no se eliminarán.")) return;
        setUnlinking(true);
        try {
            const res = await fetch("/api/payjoy/unlink-credit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creditoId: credito.id }),
            });
            const data = await res.json();
            if (data.success) {
                showMsg("success", "Crédito desvinculado");
                setSyncData(null);
                onRefresh();
            } else {
                showMsg("error", data.error || "Error al desvincular");
            }
        } catch {
            showMsg("error", "Error de conexión");
        } finally {
            setUnlinking(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/payjoy/sync-payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creditoId: credito.id }),
            });
            const data = await res.json();
            if (data.success) {
                setSyncData({
                    pagos: data.pagos || [],
                    webhooks: data.webhooks || 0,
                    lastSyncAt: data.lastSyncAt,
                });
                showMsg("success", `Sincronizado: ${data.pagos?.length || 0} pagos registrados`);
            } else {
                showMsg("error", data.error || "Error al sincronizar");
            }
        } catch {
            showMsg("error", "Error de conexión");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Header toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Payjoy
                    </span>
                    <span
                        className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            isLinked
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        )}
                    >
                        {isLinked ? "Vinculado" : "Sin vincular"}
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Panel content */}
            {expanded && (
                <div className="p-4 space-y-4">
                    {/* Mensaje de estado */}
                    {message && (
                        <div
                            className={cn(
                                "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                                message.type === "success"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                            )}
                        >
                            {message.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                            )}
                            {message.text}
                        </div>
                    )}

                    {isLinked ? (
                        <>
                            {/* Datos de vinculación */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Finance Order ID</span>
                                    <span className="font-mono text-gray-900 dark:text-white text-xs">
                                        {credito.payjoyFinanceOrderId}
                                    </span>
                                </div>
                                {credito.payjoyCustomerId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Customer ID</span>
                                        <span className="font-mono text-gray-900 dark:text-white text-xs">
                                            {credito.payjoyCustomerId}
                                        </span>
                                    </div>
                                )}
                                {credito.payjoyLastSyncAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Última sync</span>
                                        <span className="text-gray-900 dark:text-white text-xs">
                                            {new Date(credito.payjoyLastSyncAt).toLocaleString("es-MX")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700"
                                >
                                    {syncing ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                    )}
                                    Sincronizar
                                </Button>
                                <Button
                                    onClick={handleUnlink}
                                    disabled={unlinking}
                                    className="text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700"
                                >
                                    {unlinking ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                        <Unlink className="w-3 h-3 mr-1" />
                                    )}
                                    Desvincular
                                </Button>
                            </div>

                            {/* Resultado de sincronización */}
                            {syncData && (
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {syncData.pagos.length} pagos Payjoy · {syncData.webhooks} webhooks recibidos
                                    </p>
                                    {syncData.pagos.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                                        <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">Fecha</th>
                                                        <th className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">Monto</th>
                                                        <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">Cliente</th>
                                                        <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-300">Método</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {syncData.pagos.map((pago: any) => (
                                                        <tr key={pago.id} className="border-t border-gray-200 dark:border-gray-700">
                                                            <td className="px-2 py-1 text-gray-700 dark:text-gray-300">
                                                                {new Date(pago.fecha_pago).toLocaleDateString("es-MX")}
                                                            </td>
                                                            <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">
                                                                ${parseFloat(pago.monto).toLocaleString("es-MX")}
                                                            </td>
                                                            <td className="px-2 py-1 text-gray-700 dark:text-gray-300">
                                                                {pago.payjoy_customer_name || "—"}
                                                            </td>
                                                            <td className="px-2 py-1 text-gray-500 dark:text-gray-400">
                                                                {pago.payjoy_payment_method || "—"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Formulario de vinculación */}
                            {showLinkForm ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Finance Order ID *
                                        </label>
                                        <Input
                                            value={financeOrderId}
                                            onChange={(e) => setFinanceOrderId(e.target.value)}
                                            placeholder="PJ-ORD-12345"
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Customer ID *
                                        </label>
                                        <Input
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            placeholder="PJ-CUST-67890"
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleLink}
                                            disabled={linking}
                                            className="text-xs py-1.5 px-3 bg-yellow-500 hover:bg-yellow-600"
                                        >
                                            {linking ? (
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <Link2 className="w-3 h-3 mr-1" />
                                            )}
                                            Confirmar
                                        </Button>
                                        <Button
                                            onClick={() => setShowLinkForm(false)}
                                            className="text-xs py-1.5 px-3 bg-gray-500 hover:bg-gray-600"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setShowLinkForm(true)}
                                    className="text-xs py-1.5 px-3 bg-yellow-500 hover:bg-yellow-600"
                                >
                                    <Link2 className="w-3 h-3 mr-1" />
                                    Vincular con Payjoy
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
