"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BarcodeScanner } from "@/components/inventario/BarcodeScanner";
import { LocationSelector } from "@/components/inventario/LocationSelector";
import { ProductLocationCard } from "@/components/inventario/ProductLocationCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle,
  AlertCircle,
  Package,
  XCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import type {
  VerificacionInventarioDetallada,
  VerificacionItemDetallado,
  Producto,
} from "@/types";

export default function VerificarInventarioPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [verificacion, setVerificacion] =
    useState<VerificacionInventarioDetallada | null>(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<
    string | undefined
  >();
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{
    codigo: string;
    producto?: Producto;
    isDuplicate: boolean;
    isNew: boolean;
  } | null>(null);

  const [items, setItems] = useState<VerificacionItemDetallado[]>([]);
  const [productosFaltantes, setProductosFaltantes] = useState<Producto[]>([]);

  useEffect(() => {
    if (user && !["admin", "vendedor", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    } else if (user) {
      checkVerificacionActiva();
    }
  }, [user, router]);

  const checkVerificacionActiva = async () => {
    try {
      const response = await fetch(
        "/api/inventario/verificaciones?action=activa"
      );
      const data = await response.json();

      if (data.success && data.data) {
        setVerificacion(data.data);
        loadVerificacionItems(data.data.id);
        loadProductosFaltantes(data.data.id);
      }
    } catch (error) {
      console.error("Error checking active verification:", error);
    }
  };

  const loadVerificacionItems = async (verificacionId: string) => {
    try {
      const response = await fetch(
        `/api/inventario/verificaciones/${verificacionId}?action=items`
      );
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadProductosFaltantes = async (verificacionId: string) => {
    try {
      const response = await fetch(
        `/api/inventario/verificaciones/${verificacionId}?action=faltantes`
      );
      const data = await response.json();

      if (data.success) {
        setProductosFaltantes(data.data);
      }
    } catch (error) {
      console.error("Error loading missing products:", error);
    }
  };

  const handleIniciarVerificacion = async () => {
    try {
      const response = await fetch("/api/inventario/verificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ubicacionId: ubicacionSeleccionada,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificacion(data.data);
        setItems([]);
        setProductosFaltantes([]);
        loadProductosFaltantes(data.data.id);
      } else {
        alert(data.error || "Error al iniciar verificación");
      }
    } catch (error) {
      console.error("Error starting verification:", error);
      alert("Error al iniciar verificación");
    }
  };

  const handleScan = async (codigo: string) => {
    if (!verificacion) return;

    setScanning(true);
    try {
      const response = await fetch("/api/inventario/verificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan",
          verificacionId: verificacion.id,
          codigoEscaneado: codigo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const item: VerificacionItemDetallado = data.data;

        // Update last scanned
        setLastScanned({
          codigo,
          producto: item.producto,
          isDuplicate: item.esDuplicado,
          isNew: item.esProductoNuevo,
        });

        // Reload items and stats
        await checkVerificacionActiva();
        await loadVerificacionItems(verificacion.id);
        await loadProductosFaltantes(verificacion.id);
      } else {
        alert(data.error || "Error al escanear producto");
      }
    } catch (error) {
      console.error("Error scanning:", error);
      alert("Error al escanear producto");
    } finally {
      setScanning(false);
    }
  };

  const handleCompletarVerificacion = async () => {
    if (!verificacion) return;

    if (
      !confirm(
        `¿Completar verificación?\n\nEscaneados: ${verificacion.totalProductosEscaneados}\nFaltantes: ${verificacion.totalProductosFaltantes}\nDuplicados: ${verificacion.totalDuplicados}`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/inventario/verificaciones/${verificacion.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "completar",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Verificación completada exitosamente");
        setVerificacion(null);
        setItems([]);
        setProductosFaltantes([]);
        setLastScanned(null);
      } else {
        alert(data.error || "Error al completar verificación");
      }
    } catch (error) {
      console.error("Error completing verification:", error);
      alert("Error al completar verificación");
    }
  };

  const handleCancelarVerificacion = async () => {
    if (!verificacion) return;

    if (!confirm("¿Cancelar esta verificación? Se perderán todos los escaneos realizados.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/inventario/verificaciones/${verificacion.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancelar",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setVerificacion(null);
        setItems([]);
        setProductosFaltantes([]);
        setLastScanned(null);
      } else {
        alert(data.error || "Error al cancelar verificación");
      }
    } catch (error) {
      console.error("Error canceling verification:", error);
      alert("Error al cancelar verificación");
    }
  };

  if (!user || !["admin", "vendedor", "super_admin"].includes(user.role)) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Verificación de Inventario
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Escanee productos para verificar su existencia y ubicación
        </p>
      </div>

      {!verificacion ? (
        /* No active verification - Show start form */
        <Card className="p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Iniciar Nueva Verificación
          </h2>

          <LocationSelector
            value={ubicacionSeleccionada}
            onChange={setUbicacionSeleccionada}
            showAllOption
            showCounts
          />

          <div className="mt-6">
            <Button onClick={handleIniciarVerificacion} className="w-full">
              <PlayCircle className="w-5 h-5 mr-2" />
              Iniciar Verificación
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> Puede verificar una ubicación específica o
              todo el inventario. Los productos escaneados se marcarán como
              verificados.
            </p>
          </div>
        </Card>
      ) : (
        /* Active verification - Show scanner */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Escaneados
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {verificacion.totalProductosEscaneados}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Faltantes
                  </p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {verificacion.totalProductosFaltantes}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Duplicados
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {verificacion.totalDuplicados}
                </p>
              </Card>
            </div>

            {/* Scanner */}
            <Card className="p-6">
              <BarcodeScanner
                onScan={handleScan}
                isScanning={scanning}
                lastScannedCode={lastScanned?.codigo}
                productName={
                  lastScanned?.producto
                    ? `${lastScanned.producto.nombre} - ${lastScanned.producto.marca}`
                    : lastScanned?.isNew
                    ? "⚠️ Producto NO registrado"
                    : undefined
                }
                productImage={lastScanned?.producto?.imagen}
              />

              {lastScanned?.isDuplicate && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ⚠️ Este producto ya fue escaneado anteriormente en esta
                    verificación.
                  </p>
                </div>
              )}

              {lastScanned?.isNew && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    ⚠️ Producto no encontrado en el sistema. Se ha creado una
                    alerta para el administrador.
                  </p>
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleCompletarVerificacion}
                className="flex-1"
                disabled={verificacion.totalProductosEscaneados === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar Verificación
              </Button>

              <Button
                onClick={handleCancelarVerificacion}
                variant="danger"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>

          {/* Right Column - Missing Products */}
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos Faltantes ({productosFaltantes.length})
              </h3>

              {productosFaltantes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  ¡Todos los productos han sido verificados!
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {productosFaltantes.slice(0, 20).map((producto) => (
                    <ProductLocationCard
                      key={producto.id}
                      producto={producto}
                      showLocation
                      showBarcode
                    />
                  ))}
                  {productosFaltantes.length > 20 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                      Y {productosFaltantes.length - 20} más...
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
