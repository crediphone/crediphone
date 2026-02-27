"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { PanelNotificaciones } from "./PanelNotificaciones";

interface CampanaNotificacionesProps {
  usuarioId: string;
}

export function CampanaNotificaciones({
  usuarioId,
}: CampanaNotificacionesProps) {
  const [count, setCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bellHover, setBellHover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar conteo de notificaciones no leídas
  useEffect(() => {
    fetchCount();

    // Refresh cada 30 segundos (polling de respaldo)
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [usuarioId]);

  // Escuchar evento Realtime "nueva-notificacion" → actualizar badge al instante
  useEffect(() => {
    function handleNuevaNotificacion() {
      fetchCount();
    }
    window.addEventListener("nueva-notificacion", handleNuevaNotificacion);
    return () =>
      window.removeEventListener("nueva-notificacion", handleNuevaNotificacion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchCount() {
    try {
      const response = await fetch(
        `/api/notificaciones?usuario_id=${usuarioId}&conteo=true`
      );
      const data = await response.json();
      if (data.success) {
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones:", error);
    }
  }

  function handleTogglePanel() {
    setPanelOpen(!panelOpen);
  }

  function handleNotificacionesActualizadas() {
    fetchCount();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Botón campana */}
      <button
        onClick={handleTogglePanel}
        className="relative p-2 rounded-lg focus:outline-none"
        title="Notificaciones"
        style={{
          color: bellHover ? "var(--color-accent)" : "var(--color-text-secondary)",
          background: bellHover ? "var(--color-bg-elevated)" : "transparent",
          transition: "all var(--duration-normal) var(--ease-smooth)",
        }}
        onMouseEnter={() => setBellHover(true)}
        onMouseLeave={() => setBellHover(false)}
      >
        <Bell className="w-5 h-5" />

        {/* Badge de conteo */}
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full animate-pulse"
            style={{
              background: "var(--color-danger)",
              color: "var(--color-primary-text)",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {panelOpen && (
        <PanelNotificaciones
          usuarioId={usuarioId}
          onClose={() => setPanelOpen(false)}
          onActualizado={handleNotificacionesActualizadas}
        />
      )}
    </div>
  );
}
