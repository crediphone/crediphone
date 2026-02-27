"use client";

import { useState } from "react";
import { CuentaDispositivo } from "@/types";

interface FormularioCuentasProps {
  cuentas: CuentaDispositivo[];
  onChange: (nuevasCuentas: CuentaDispositivo[]) => void;
}

const TIPOS_CUENTA = [
  { value: "Google", label: "Google", icono: "📧" },
  { value: "Apple", label: "Apple ID / iCloud", icono: "🍎" },
  { value: "Samsung", label: "Samsung Account", icono: "📱" },
  { value: "Microsoft", label: "Microsoft", icono: "🪟" },
  { value: "Otra", label: "Otra", icono: "🔐" },
] as const;

export function FormularioCuentas({
  cuentas,
  onChange,
}: FormularioCuentasProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<CuentaDispositivo>({
    tipo: "Google",
    email: "",
    usuario: "",
    password: "",
    notas: "",
  });

  const resetForm = () => {
    setFormData({
      tipo: "Google",
      email: "",
      usuario: "",
      password: "",
      notas: "",
    });
    setMostrarFormulario(false);
    setEditandoIndex(null);
  };

  const agregarCuenta = () => {
    if (!formData.email && !formData.usuario) {
      alert("Por favor ingresa un email o nombre de usuario");
      return;
    }

    if (editandoIndex !== null) {
      // Editar cuenta existente
      const nuevasCuentas = [...cuentas];
      nuevasCuentas[editandoIndex] = formData;
      onChange(nuevasCuentas);
    } else {
      // Agregar nueva cuenta
      onChange([...cuentas, formData]);
    }

    resetForm();
  };

  const editarCuenta = (index: number) => {
    setFormData(cuentas[index]);
    setEditandoIndex(index);
    setMostrarFormulario(true);
  };

  const eliminarCuenta = (index: number) => {
    if (confirm("¿Eliminar esta cuenta?")) {
      onChange(cuentas.filter((_, i) => i !== index));
    }
  };

  const obtenerIconoTipo = (tipo: CuentaDispositivo["tipo"]) => {
    return TIPOS_CUENTA.find((t) => t.value === tipo)?.icono || "🔐";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span>👤</span>
          <span>Cuentas del Dispositivo</span>
          <span className="text-xs font-normal text-gray-500">
            ({cuentas.length})
          </span>
        </h3>
        {!mostrarFormulario && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
          >
            + Agregar Cuenta
          </button>
        )}
      </div>

      {cuentas.length === 0 && !mostrarFormulario && (
        <div className="text-xs text-gray-500 text-center italic py-8 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-2 text-2xl">🔐</div>
          <p>No hay cuentas registradas.</p>
          <p className="mt-1">
            Agrega las cuentas de Google, Apple, Samsung, etc. asociadas al
            dispositivo.
          </p>
        </div>
      )}

      {/* Lista de cuentas existentes */}
      {cuentas.length > 0 && (
        <div className="space-y-2">
          {cuentas.map((cuenta, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{obtenerIconoTipo(cuenta.tipo)}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {cuenta.tipo}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => editarCuenta(index)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarCuenta(index)}
                    className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 text-gray-700">
                {cuenta.email && (
                  <div>
                    <strong>Email:</strong> {cuenta.email}
                  </div>
                )}
                {cuenta.usuario && (
                  <div>
                    <strong>Usuario:</strong> {cuenta.usuario}
                  </div>
                )}
                {cuenta.password && (
                  <div className="flex items-center gap-2">
                    <strong>Password:</strong>
                    <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {"•".repeat(cuenta.password.length)}
                    </code>
                  </div>
                )}
                {cuenta.notas && (
                  <div className="mt-1 text-gray-600 italic">
                    <strong>Notas:</strong> {cuenta.notas}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de agregar/editar */}
      {mostrarFormulario && (
        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              {editandoIndex !== null ? "Editar Cuenta" : "Nueva Cuenta"}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              ✕ Cancelar
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de cuenta
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value as CuentaDispositivo["tipo"],
                })
              }
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIPOS_CUENTA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.icono} {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email o correo electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="usuario@ejemplo.com"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nombre de usuario (opcional)
            </label>
            <input
              type="text"
              value={formData.usuario}
              onChange={(e) =>
                setFormData({ ...formData, usuario: e.target.value })
              }
              placeholder="@username o ID"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contraseña (opcional)
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Contraseña"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ La contraseña se guarda en texto plano. Solo visible para personal
              autorizado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              placeholder="Ej: Verificación en 2 pasos activa, PIN de pantalla bloqueada, etc."
              rows={2}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="button"
            onClick={agregarCuenta}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {editandoIndex !== null ? "Guardar Cambios" : "Agregar Cuenta"}
          </button>
        </div>
      )}

      {cuentas.length > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
          🔒 <strong>Seguridad:</strong> Las cuentas se guardan encriptadas en la
          base de datos y solo son visibles para personal autorizado.
        </div>
      )}
    </div>
  );
}
