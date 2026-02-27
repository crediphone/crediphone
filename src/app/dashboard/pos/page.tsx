"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProductSearchBar } from "@/components/pos/ProductSearchBar";
import { ShoppingCart, CartItem } from "@/components/pos/ShoppingCart";
import { PaymentMethodSelector } from "@/components/pos/PaymentMethodSelector";
import { ReciboModal } from "@/components/pos/ReciboModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ShoppingCart as CartIcon, DollarSign, Receipt, LogOut as CloseIcon } from "lucide-react";
import type {
  Producto,
  CajaSesion,
  NuevaVentaFormData,
  VentaDetallada,
  EstadisticasPOS,
} from "@/types";

export default function POSPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Estado de sesión de caja
  const [sesionCaja, setSesionCaja] = useState<CajaSesion | null>(null);
  const [loadingSesion, setLoadingSesion] = useState(true);

  // Estado del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [descuento, setDescuento] = useState(0);

  // Estado de pago
  const [paymentData, setPaymentData] = useState<any>(null);

  // Estado de proceso
  const [processingVenta, setProcessingVenta] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<VentaDetallada | null>(null);
  const [showReciboModal, setShowReciboModal] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState<EstadisticasPOS | null>(null);

  // Redirect non-admin/vendedor
  useEffect(() => {
    if (user && !["admin", "vendedor", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Cargar sesión activa al montar
  useEffect(() => {
    if (user) {
      fetchSesionActiva();
      fetchEstadisticas();
    }
  }, [user]);

  const fetchSesionActiva = async () => {
    try {
      setLoadingSesion(true);
      const response = await fetch(`/api/pos/caja?action=activa&usuarioId=${user?.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSesionCaja(data.data);
      }
    } catch (error) {
      console.error("Error fetching sesion activa:", error);
    } finally {
      setLoadingSesion(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch("/api/pos/ventas?action=estadisticas");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching estadisticas:", error);
    }
  };

  const handleSelectProduct = (producto: Producto) => {
    if (producto.stock <= 0) {
      alert("Producto sin stock disponible");
      return;
    }

    // Buscar si ya está en el carrito
    const existingIndex = cartItems.findIndex(
      (item) => item.producto.id === producto.id
    );

    if (existingIndex >= 0) {
      // Incrementar cantidad si hay stock
      const newItems = [...cartItems];
      if (newItems[existingIndex].cantidad < producto.stock) {
        newItems[existingIndex].cantidad += 1;
        newItems[existingIndex].subtotal =
          newItems[existingIndex].cantidad * newItems[existingIndex].precioUnitario;
        setCartItems(newItems);
      } else {
        alert("No hay más stock disponible de este producto");
      }
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        producto,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      handleRemoveItem(productoId);
      return;
    }

    const newItems = cartItems.map((item) => {
      if (item.producto.id === productoId) {
        // Validar stock
        if (cantidad > item.producto.stock) {
          alert("Cantidad excede el stock disponible");
          return item;
        }
        return {
          ...item,
          cantidad,
          subtotal: cantidad * item.precioUnitario,
        };
      }
      return item;
    });

    setCartItems(newItems);
  };

  const handleRemoveItem = (productoId: string) => {
    setCartItems(cartItems.filter((item) => item.producto.id !== productoId));
  };

  const handleClearCart = () => {
    if (confirm("¿Limpiar carrito?")) {
      setCartItems([]);
      setDescuento(0);
    }
  };

  const handleCompletarVenta = async () => {
    // Validaciones
    if (cartItems.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (!paymentData || !paymentData.isValid) {
      alert(paymentData?.errorMessage || "Método de pago inválido");
      return;
    }

    if (!sesionCaja) {
      alert("Debe abrir una sesión de caja para realizar ventas");
      return;
    }

    // Confirmar venta
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - descuento;

    if (
      !confirm(
        `¿Completar venta por $${total.toFixed(2)} con ${paymentData.metodoPago}?`
      )
    ) {
      return;
    }

    setProcessingVenta(true);

    try {
      const ventaFormData: NuevaVentaFormData = {
        items: cartItems.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
        descuento,
        metodoPago: paymentData.metodoPago,
        desgloseMixto: paymentData.desgloseMixto,
        referenciaPago: paymentData.referenciaPago,
        montoRecibido: paymentData.montoRecibido,
      };

      const response = await fetch("/api/pos/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ventaFormData),
      });

      const data = await response.json();

      if (data.success) {
        setVentaCompletada(data.data);
        setShowReciboModal(true);
        // Limpiar carrito y datos
        setCartItems([]);
        setDescuento(0);
        // Actualizar estadísticas
        fetchEstadisticas();
      } else {
        alert(data.error || "Error al crear venta");
      }
    } catch (error) {
      console.error("Error creating venta:", error);
      alert("Error al procesar la venta");
    } finally {
      setProcessingVenta(false);
    }
  };

  const handleNuevaVenta = () => {
    setVentaCompletada(null);
    setCartItems([]);
    setDescuento(0);
  };

  if (!user || !["admin", "vendedor", "super_admin"].includes(user.role)) {
    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - descuento;

  // Verificando sesión
  if (loadingSesion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Verificando sesión de caja...
        </div>
      </div>
    );
  }

  // Sin sesión activa → redirigir a Caja para abrir turno
  if (!sesionCaja) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No hay turno abierto
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Debes abrir un turno de caja antes de realizar ventas.
          </p>
          <Button
            onClick={() => router.push("/dashboard/pos/caja")}
            className="w-full"
          >
            Ir a gestión de caja
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Punto de Venta (POS)
            </h1>
            {sesionCaja && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sesión: {sesionCaja.folio} | Monto inicial: ${sesionCaja.montoInicial.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard/pos/caja")}
            >
              <CloseIcon className="w-4 h-4 mr-2" />
              Gestión de Caja
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard/pos/historial")}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Historial
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.ventasHoy}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hoy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                ${stats.totalHoy.toFixed(2)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Mes</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ${stats.totalMes.toFixed(2)}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Search */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Buscar Producto
            </h2>
            <ProductSearchBar onSelectProduct={handleSelectProduct} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descuento
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={subtotal}
              value={descuento}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Right Column - Cart & Payment */}
        <div className="space-y-6">
          <ShoppingCart
            items={cartItems}
            descuento={descuento}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClear={handleClearCart}
          />

          {cartItems.length > 0 && (
            <div className="space-y-4">
              <PaymentMethodSelector total={total} onChange={setPaymentData} />

              <Button
                onClick={handleCompletarVenta}
                disabled={
                  processingVenta ||
                  cartItems.length === 0 ||
                  !paymentData?.isValid
                }
                className="w-full"
                size="lg"
              >
                <CartIcon className="w-5 h-5 mr-2" />
                {processingVenta
                  ? "Procesando..."
                  : `Completar Venta - $${total.toFixed(2)}`}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recibo Modal */}
      {ventaCompletada && (
        <ReciboModal
          venta={ventaCompletada}
          isOpen={showReciboModal}
          onClose={() => setShowReciboModal(false)}
          onNuevaVenta={handleNuevaVenta}
        />
      )}
    </div>
  );
}
