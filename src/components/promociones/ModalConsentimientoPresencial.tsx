"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, MessageCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNombre: string;
  onSuccess: () => void;
}

export function ModalConsentimientoPresencial({ isOpen, onClose, clienteId, clienteNombre, onSuccess }: Props) {
  const [aceptaNotif, setAceptaNotif] = useState(false);
  const [aceptaPromos, setAceptaPromos] = useState(false);
  const [prefAcc, setPrefAcc] = useState(false);
  const [prefCombos, setPrefCombos] = useState(false);
  const [prefCel, setPrefCel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/consentimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aceptaNotificaciones: aceptaNotif,
          aceptaPromociones: aceptaPromos,
          preferencias: { accesorios: prefAcc, combos: prefCombos, celulares: prefCel },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDone(true);
      setTimeout(() => { setDone(false); onSuccess(); onClose(); }, 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Consentimiento" size="sm">
      {done ? (
        <div className="py-8 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: "var(--color-success)" }} />
          <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Consentimiento registrado</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
            <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{clienteNombre}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Cliente acepta presencialmente</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={aceptaNotif} onChange={(e) => setAceptaNotif(e.target.checked)} className="mt-0.5 w-4 h-4" />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Notificaciones de su reparación</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Estado de la orden, listo para entrega, etc.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={aceptaPromos} onChange={(e) => setAceptaPromos(e.target.checked)} className="mt-0.5 w-4 h-4" />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Promociones y ofertas especiales</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Descuentos, combos y productos en oferta</p>
              </div>
            </label>
          </div>

          {aceptaPromos && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Categorías de interés</p>
              {[
                { key: "acc", label: "Accesorios", val: prefAcc, set: setPrefAcc },
                { key: "combos", label: "Combos y paquetes", val: prefCombos, set: setPrefCombos },
                { key: "cel", label: "Celulares", val: prefCel, set: setPrefCel },
              ].map((p) => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={p.val} onChange={(e) => p.set(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{p.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Guardando..." : "Registrar consentimiento"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
