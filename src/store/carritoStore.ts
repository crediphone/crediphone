import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/types";

export interface ProductoCarrito extends Producto {
  cantidad: number;
}

interface CarritoStore {
  productos: ProductoCarrito[];
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  quitarProducto: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  limpiarCarrito: () => void;
  obtenerTotal: () => number;
  obtenerCantidadTotal: () => number;
}

export const useCarritoStore = create<CarritoStore>()(
  persist(
    (set, get) => ({
      productos: [],

      agregarProducto: (producto, cantidad = 1) => {
        set((state) => {
          const existente = state.productos.find((p) => p.id === producto.id);

          if (existente) {
            // Si ya existe, incrementar cantidad
            return {
              productos: state.productos.map((p) =>
                p.id === producto.id
                  ? { ...p, cantidad: p.cantidad + cantidad }
                  : p
              ),
            };
          } else {
            // Si no existe, agregar nuevo
            return {
              productos: [...state.productos, { ...producto, cantidad }],
            };
          }
        });
      },

      quitarProducto: (productoId) => {
        set((state) => ({
          productos: state.productos.filter((p) => p.id !== productoId),
        }));
      },

      actualizarCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().quitarProducto(productoId);
          return;
        }

        set((state) => ({
          productos: state.productos.map((p) =>
            p.id === productoId ? { ...p, cantidad } : p
          ),
        }));
      },

      limpiarCarrito: () => {
        set({ productos: [] });
      },

      obtenerTotal: () => {
        const { productos } = get();
        return productos.reduce(
          (total, p) => total + Number(p.precio) * p.cantidad,
          0
        );
      },

      obtenerCantidadTotal: () => {
        const { productos } = get();
        return productos.reduce((total, p) => total + p.cantidad, 0);
      },
    }),
    {
      name: "carrito-storage", // Nombre en localStorage
    }
  )
);
