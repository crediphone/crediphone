"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useConfig } from "@/components/ConfigProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import type { Configuracion, ModulosHabilitados } from "@/types";
import { CORE_MODULES } from "@/types";
import { Save, Building2, DollarSign, Settings as SettingsIcon, Layout } from "lucide-react";
import PayjoyConfigSection from "@/components/payjoy/PayjoyConfigSection";
import { SonidosNotificacionConfig } from "@/components/configuracion/SonidosNotificacionConfig";

const MODULE_LABELS: Record<keyof ModulosHabilitados, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  creditos: "Créditos",
  pagos: "Pagos",
  productos: "Productos",
  empleados: "Empleados",
  reparaciones: "Reparaciones",
  "dashboard-reparaciones": "KPI Reparaciones",
  reportes: "Reportes",
  recordatorios: "Recordatorios",
  tecnico: "Panel Técnico",
  pos: "Punto de Venta (POS)",
  inventario_avanzado: "Inventario Avanzado (Barcode & Ubicaciones)",
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--color-text-secondary)",
  marginBottom: "0.5rem",
};

const hintSt: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-muted)",
  marginTop: "0.25rem",
};

// ── ModuleRow ──────────────────────────────────────────────────
function ModuleRow({
  label,
  isCore,
  enabled,
  onToggle,
}: {
  label: string;
  isCore: boolean;
  enabled: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-lg transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "var(--color-bg-elevated)" : "transparent" }}
    >
      <div>
        <p
          className="font-medium"
          style={{ color: isCore ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
        >
          {label}
        </p>
        {isCore && (
          <p style={hintSt}>Módulo esencial - no se puede desactivar</p>
        )}
      </div>
      <button
        onClick={onToggle}
        disabled={isCore}
        className="relative inline-flex h-6 w-11 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: enabled ? "var(--color-accent)" : "var(--color-border)" }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5"
          style={{ transform: enabled ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
        />
      </button>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { config, refreshConfig } = useConfig();
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Configuracion>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (config) setFormData({ ...config });
  }, [config]);

  const handleChange = (field: keyof Configuracion, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleKey: keyof ModulosHabilitados) => {
    if (CORE_MODULES.includes(moduleKey)) return;
    setFormData((prev) => ({
      ...prev,
      modulosHabilitados: {
        ...prev.modulosHabilitados!,
        [moduleKey]: !prev.modulosHabilitados![moduleKey],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        await refreshConfig();
        setMessage({ type: "success", text: "Configuración guardada exitosamente" });
      } else {
        setMessage({ type: "error", text: result.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al guardar configuración" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  if (!config || !formData.modulosHabilitados) {
    return (
      <div className="p-6">
        <div className="text-center" style={{ color: "var(--color-text-muted)" }}>
          Cargando configuración...
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "negocio",
      label: "Datos del Negocio",
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Información de la Empresa
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={labelSt}>Nombre de la Empresa</label>
                <Input
                  value={formData.nombreEmpresa || ""}
                  onChange={(e) => handleChange("nombreEmpresa", e.target.value)}
                  placeholder="CREDIPHONE"
                />
              </div>
              <div>
                <label style={labelSt}>RFC</label>
                <Input
                  value={formData.rfc || ""}
                  onChange={(e) => handleChange("rfc", e.target.value)}
                  placeholder="ABC123456XYZ"
                />
              </div>
              <div className="md:col-span-2">
                <label style={labelSt}>Dirección</label>
                <Input
                  value={formData.direccionEmpresa || ""}
                  onChange={(e) => handleChange("direccionEmpresa", e.target.value)}
                  placeholder="Calle, número, colonia, ciudad, estado, CP"
                />
              </div>
              <div>
                <label style={labelSt}>Teléfono</label>
                <Input
                  type="tel"
                  value={formData.telefonoEmpresa || ""}
                  onChange={(e) => handleChange("telefonoEmpresa", e.target.value)}
                  placeholder="618 123 4567"
                />
              </div>
              <div>
                <label style={labelSt}>WhatsApp</label>
                <Input
                  type="tel"
                  value={formData.whatsappNumero || ""}
                  onChange={(e) => handleChange("whatsappNumero", e.target.value)}
                  placeholder="618 123 4567"
                />
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "comisiones",
      label: "Comisiones y Mora",
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6" style={{ color: "var(--color-success)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Comisiones por Defecto
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={labelSt}>Comisión Vendedor (%)</label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={formData.comisionVendedorDefault || 0}
                  onChange={(e) => handleChange("comisionVendedorDefault", parseFloat(e.target.value) || 0)}
                />
                <p style={hintSt}>Porcentaje de comisión para nuevos vendedores</p>
              </div>
              <div>
                <label style={labelSt}>Comisión Cobrador (%)</label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={formData.comisionCobradorDefault || 0}
                  onChange={(e) => handleChange("comisionCobradorDefault", parseFloat(e.target.value) || 0)}
                />
                <p style={hintSt}>Porcentaje de comisión para nuevos cobradores</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6" style={{ color: "var(--color-danger)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Configuración de Mora
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={labelSt}>Tasa de Mora Diaria (MXN)</label>
                <Input
                  type="number" step="0.01" min="0"
                  value={formData.tasaMoraDiaria || 0}
                  onChange={(e) => handleChange("tasaMoraDiaria", parseFloat(e.target.value) || 0)}
                />
                <p style={hintSt}>Cargo por cada día de retraso en pagos</p>
              </div>
              <div>
                <label style={labelSt}>Días de Gracia</label>
                <Input
                  type="number" min="0" max="30"
                  value={formData.diasGracia || 0}
                  onChange={(e) => handleChange("diasGracia", parseInt(e.target.value) || 0)}
                />
                <p style={hintSt}>Días sin cargo de mora después de la fecha de vencimiento</p>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "general",
      label: "General",
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Configuración General
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label style={labelSt}>Días de Garantía por Defecto</label>
                <Input
                  type="number" min="0" max="365"
                  value={formData.diasGarantiaDefault || 0}
                  onChange={(e) => handleChange("diasGarantiaDefault", parseInt(e.target.value) || 0)}
                />
                <p style={hintSt}>Días de garantía para reparaciones (por defecto: 30 días)</p>
              </div>

              <div
                className="flex items-center justify-between py-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Notificaciones Activas
                  </p>
                  <p style={hintSt}>
                    Habilitar/deshabilitar notificaciones automáticas del sistema
                  </p>
                </div>
                <button
                  onClick={() => handleChange("notificacionesActivas", !formData.notificacionesActivas)}
                  className="relative inline-flex h-6 w-11 rounded-full transition-colors"
                  style={{
                    background: formData.notificacionesActivas
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5"
                    style={{
                      transform: formData.notificacionesActivas
                        ? "translateX(1.25rem)"
                        : "translateX(0.125rem)",
                    }}
                  />
                </button>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "modulos",
      label: "Módulos",
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Módulos del Sistema
              </h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
              Activa o desactiva módulos del sidebar. Los módulos esenciales (Dashboard y Reparaciones) no se pueden desactivar.
            </p>
            <div className="space-y-1">
              {Object.entries(MODULE_LABELS).map(([key, label]) => {
                const isCore = CORE_MODULES.includes(key as keyof ModulosHabilitados);
                const enabled = formData.modulosHabilitados![key as keyof ModulosHabilitados] ?? true;
                return (
                  <ModuleRow
                    key={key}
                    label={label}
                    isCore={isCore}
                    enabled={enabled}
                    onToggle={() => toggleModule(key as keyof ModulosHabilitados)}
                  />
                );
              })}
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "payjoy",
      label: "Payjoy",
      content: (
        <PayjoyConfigSection
          formData={formData}
          onFieldChange={handleChange}
          onSave={handleSave}
          saving={saving}
        />
      ),
    },
    ...(config
      ? [
          {
            id: "sonidos",
            label: "🔔 Sonidos & Push",
            content: (
              <SonidosNotificacionConfig
                config={config}
                onSaved={refreshConfig}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Configuración del Sistema
        </h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Administra los datos de la empresa, comisiones, mora y módulos activos
        </p>
      </div>

      {message && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={
            message.type === "success"
              ? {
                  background: "var(--color-success-bg)",
                  color: "var(--color-success-text)",
                  border: "1px solid var(--color-success)",
                }
              : {
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger-text)",
                  border: "1px solid var(--color-danger)",
                }
          }
        >
          {message.text}
        </div>
      )}

      <Tabs tabs={tabs} defaultTab="negocio" />
    </div>
  );
}
