"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Search, ArrowRight } from "lucide-react";

export default function BuscarReparacionPage() {
  const router = useRouter();
  const [folio, setFolio] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const limpio = folio.trim().toUpperCase();
    if (!limpio) {
      setError("Ingresa tu número de folio");
      return;
    }
    router.push(`/reparacion/${encodeURIComponent(limpio)}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 space-y-6"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Logo / ícono */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <Smartphone
              size={28}
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="text-center">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Rastrear mi equipo
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Ingresa tu número de folio para ver el estado de tu reparación
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="folio"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Número de folio
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                id="folio"
                type="text"
                value={folio}
                onChange={(e) => {
                  setFolio(e.target.value);
                  setError("");
                }}
                placeholder="Ej: REP-0001"
                autoComplete="off"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm font-mono tracking-wider"
                style={{
                  background: "var(--color-bg-sunken)",
                  border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  if (!error)
                    e.currentTarget.style.border =
                      "1px solid var(--color-border-strong)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(0,153,184,0.15)";
                }}
                onBlur={(e) => {
                  if (!error)
                    e.currentTarget.style.border =
                      "1px solid var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            {error && (
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--color-danger)" }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-text)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--color-primary-mid)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                "var(--color-primary)")
            }
          >
            Ver estado
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Footer */}
        <p
          className="text-xs text-center"
          style={{ color: "var(--color-text-muted)" }}
        >
          El número de folio te fue proporcionado al dejar tu equipo.
        </p>
      </div>
    </div>
  );
}
