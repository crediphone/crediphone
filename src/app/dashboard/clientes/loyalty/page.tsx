"use client";

import { useEffect, useState } from "react";
import { Star, TrendingUp, Gift, RefreshCw } from "lucide-react";

interface FilaPuntos {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  saldoDisponible: number;
  totalGanado: number;
  totalCanjeado: number;
}

interface Totales {
  clientesConPuntos: number;
  totalPuntosEnCirculacion: number;
  totalPuntosGanados: number;
  totalPuntosCanjeados: number;
}

function fmtPts(n: number) {
  return n.toLocaleString("es-MX");
}

function ClienteFilaPuntos({ fila, rank }: { fila: FilaPuntos; rank: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "transparent",
        borderBottom: "1px solid var(--color-border-subtle)",
        transition: "background 120ms",
      }}
    >
      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-text-muted)", width: 40 }}>
        {rank}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {fila.nombre || "—"}
        </p>
        {fila.telefono && (
          <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {fila.telefono}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className="text-base font-bold"
          style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}
        >
          {fmtPts(fila.saldoDisponible)}
        </span>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          ${fila.saldoDisponible} MXN
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
          {fmtPts(fila.totalGanado)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-data)" }}>
          {fmtPts(fila.totalCanjeado)}
        </span>
        {fila.totalCanjeado > 0 && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            −${fila.totalCanjeado} MXN
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--color-bg-elevated)", minWidth: 60 }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: fila.totalGanado > 0 ? `${(fila.saldoDisponible / fila.totalGanado) * 100}%` : "0%",
              background: "var(--color-success)",
              transition: "width 400ms ease",
            }}
          />
        </div>
      </td>
    </tr>
  );
}

export default function LoyaltyPage() {
  const [rows, setRows] = useState<FilaPuntos[]>([]);
  const [totales, setTotales] = useState<Totales | null>(null);
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty");
      const data = await res.json();
      if (data.success) {
        setRows(data.data.rows);
        setTotales(data.data.totales);
        setAño(data.data.año);
      }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  const filtered = rows.filter((r) =>
    !search || r.nombre.toLowerCase().includes(search.toLowerCase()) || (r.telefono ?? "").includes(search)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Star className="w-6 h-6" style={{ color: "#ffd700" }} />
            Programa de Puntos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Año {año} · $50 gastados = 1 punto · 1 punto = $1 MXN de descuento
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats pills */}
      {totales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Clientes con puntos", value: fmtPts(totales.clientesConPuntos), icon: "👥", color: "var(--color-info-text)", bg: "var(--color-info-bg)" },
            { label: "Puntos en circulación", value: fmtPts(totales.totalPuntosEnCirculacion), icon: "⭐", color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
            { label: "Total ganados (año)", value: fmtPts(totales.totalPuntosGanados), icon: "📈", color: "var(--color-accent)", bg: "var(--color-accent-light)" },
            { label: "Total canjeados", value: fmtPts(totales.totalPuntosCanjeados), icon: "🎁", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: bg }}>
              <p className="text-xs font-medium" style={{ color }}>{icon} {label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color, fontFamily: "var(--font-data)" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-xl text-sm"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
        />
      </div>

      {/* Tabla */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}
      >
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            Cargando puntos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Star className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {search ? "Sin resultados" : "Ningún cliente tiene puntos este año"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              Los puntos se acumulan al completar ventas y reparaciones
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
                {["#", "Cliente", "Disponible", "Ganados", "Canjeados", "Retención"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((fila, i) => (
                <ClienteFilaPuntos key={fila.clienteId} fila={fila} rank={i + 1} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} · Reseteo el 31 dic {año}
        </p>
      )}
    </div>
  );
}
