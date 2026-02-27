"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { obtenerUrlImagen } from "@/lib/storage";
import type { Producto } from "@/types";

interface ProductoSeleccionado extends Producto {
  cantidad: number;
}

interface SelectorProductosProps {
  onProductosChange: (productos: ProductoSeleccionado[], total: number) => void;
  productosIniciales?: ProductoSeleccionado[];
}

export function SelectorProductos({
  onProductosChange,
  productosIniciales = [],
}: SelectorProductosProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>(productosIniciales);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [loading, setLoading] = useState(false);

  // Cargar productos desde la API
  useEffect(() => {
    fetchProductos();
  }, []);

  // Notificar cambios al padre
  useEffect(() => {
    const total = productosSeleccionados.reduce(
      (sum, p) => sum + p.precio * p.cantidad,
      0
    );
    onProductosChange(productosSeleccionados, total);
  }, [productosSeleccionados]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/productos");
      const data = await response.json();
      if (data.success) {
        setProductos(data.data);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías únicas de productos
  const categorias = Array.from(
    new Set(productos.map((p) => p.marca))
  ).sort();

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const matchBusqueda =
      busqueda === "" ||
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.marca.toLowerCase().includes(busqueda.toLowerCase());

    const matchCategoria =
      categoriaFiltro === "todos" || producto.marca === categoriaFiltro;

    return matchBusqueda && matchCategoria && producto.stock > 0;
  });

  const agregarProducto = (producto: Producto) => {
    const existe = productosSeleccionados.find((p) => p.id === producto.id);

    if (existe) {
      // Incrementar cantidad
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      // Agregar nuevo
      setProductosSeleccionados([
        ...productosSeleccionados,
        { ...producto, cantidad: 1 },
      ]);
    }
  };

  const quitarProducto = (productoId: string) => {
    setProductosSeleccionados(
      productosSeleccionados.filter((p) => p.id !== productoId)
    );
  };

  const cambiarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) {
      quitarProducto(productoId);
    } else {
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
        )
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const totalProductos = productosSeleccionados.reduce(
    (sum, p) => sum + p.precio * p.cantidad,
    0
  );

  return (
    <div className="space-y-4">
      {/* Botón para mostrar/ocultar selector */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            🛍️ Productos del Crédito
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {productosSeleccionados.length > 0
              ? `${productosSeleccionados.length} producto(s) agregado(s)`
              : "Sin productos seleccionados"}
          </p>
        </div>
        <Button
          type="button"
          variant={mostrarSelector ? "secondary" : "primary"}
          onClick={() => setMostrarSelector(!mostrarSelector)}
        >
          {mostrarSelector ? "Cerrar Selector" : "+ Agregar Productos"}
        </Button>
      </div>

      {/* Productos seleccionados (siempre visible) */}
      {productosSeleccionados.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">
            📦 Desglose de Productos
          </h5>
          <div className="space-y-2">
            {productosSeleccionados.map((producto) => (
              <div
                key={producto.id}
                className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200"
              >
                {/* Imagen miniatura */}
                {producto.imagen && producto.imagen.trim() !== "" ? (
                  <img
                    src={obtenerUrlImagen(producto.imagen) || ""}
                    alt={producto.nombre}
                    className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">📦</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {producto.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {producto.marca} - {producto.modelo}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        cambiarCantidad(producto.id, producto.cantidad - 1)
                      }
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {producto.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        cambiarCantidad(producto.id, producto.cantidad + 1)
                      }
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                    {formatPrice(producto.precio * producto.cantidad)}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarProducto(producto.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="text-sm font-bold text-gray-900">
                Total del Crédito:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(totalProductos)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selector de productos (modal/panel) */}
      {mostrarSelector && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">
            Catálogo de Productos
          </h5>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input
              type="search"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de productos */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Cargando productos...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos disponibles
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center gap-3 bg-white p-3 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {/* Imagen del producto */}
                  {producto.imagen && producto.imagen.trim() !== "" ? (
                    <img
                      src={obtenerUrlImagen(producto.imagen) || ""}
                      alt={producto.nombre}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">📦</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {producto.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {producto.marca} - {producto.modelo}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Stock: {producto.stock} unidades
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPrice(producto.precio)}
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => agregarProducto(producto)}
                      className="text-sm"
                    >
                      + Agregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
