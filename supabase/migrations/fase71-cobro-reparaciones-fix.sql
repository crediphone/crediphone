-- ══════════════════════════════════════════════════════════════════════════════
-- FASE 71 — Fix crítico: sistema de cobro de reparaciones
--
-- Problemas resueltos:
--   C1. Crear tabla movimientos_bolsa_virtual (faltaba completamente)
--   C2. Agregar columnas faltantes en anticipos_reparacion
--       (sesion_caja_id, creado_por, fecha_aplicado, fecha_devuelto,
--        motivo_devolucion)
--   C5. Normalizar campo fecha_entrega en ordenes_reparacion
--       (POS usaba fecha_entregado, Entrega usaba fecha_entrega)
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── C1: Tabla movimientos_bolsa_virtual ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.movimientos_bolsa_virtual (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id        UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  distribuidor_id UUID REFERENCES public.distribuidores(id) ON DELETE SET NULL,
  tipo            VARCHAR(30) NOT NULL
    CHECK (tipo IN ('gasto_pieza', 'ingreso_caja', 'reembolso_caja', 'devolucion_cliente')),
  monto           DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  concepto        TEXT,
  pedido_pieza_id UUID REFERENCES public.pedidos_pieza_reparacion(id) ON DELETE SET NULL,
  sesion_caja_id  UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
  registrado_por  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  en_disputa      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mbv_orden
  ON public.movimientos_bolsa_virtual(orden_id);

CREATE INDEX IF NOT EXISTS idx_mbv_tipo
  ON public.movimientos_bolsa_virtual(tipo);

CREATE INDEX IF NOT EXISTS idx_mbv_sesion
  ON public.movimientos_bolsa_virtual(sesion_caja_id);

CREATE INDEX IF NOT EXISTS idx_mbv_distribuidor
  ON public.movimientos_bolsa_virtual(distribuidor_id);

-- RLS: solo puede ver movimientos de su propio distribuidor
ALTER TABLE public.movimientos_bolsa_virtual ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "distribuidor_access_mbv" ON public.movimientos_bolsa_virtual;
CREATE POLICY "distribuidor_access_mbv" ON public.movimientos_bolsa_virtual
  USING (
    distribuidor_id IN (
      SELECT distribuidor_id FROM public.users WHERE id = auth.uid()
    )
  );

-- ─── C2: Columnas faltantes en anticipos_reparacion ──────────────────────────

ALTER TABLE public.anticipos_reparacion
  ADD COLUMN IF NOT EXISTS sesion_caja_id    UUID
    REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creado_por        UUID
    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_aplicado    TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS fecha_devuelto    TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS motivo_devolucion TEXT;

CREATE INDEX IF NOT EXISTS idx_anticipos_sesion_caja
  ON public.anticipos_reparacion(sesion_caja_id);

-- ─── C5: Normalizar fecha_entrega en ordenes_reparacion ──────────────────────

-- Agregar fecha_entrega si no existe (el nombre canónico)
ALTER TABLE public.ordenes_reparacion
  ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMP WITH TIME ZONE;

-- Si la columna antigua fecha_entregado existe, migrar sus datos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ordenes_reparacion'
      AND column_name  = 'fecha_entregado'
  ) THEN
    UPDATE public.ordenes_reparacion
    SET fecha_entrega = fecha_entregado
    WHERE fecha_entregado IS NOT NULL
      AND fecha_entrega IS NULL;
  END IF;
END $$;
