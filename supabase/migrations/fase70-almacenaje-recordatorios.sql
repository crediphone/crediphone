-- ============================================================
-- FASE 70: Almacenaje y recordatorios de equipos sin recoger
-- LFPC Art. 63 — 30 días gratis, 90 días → disposición
-- ============================================================

-- 1. Tarifa de almacenaje diaria configurable por distribuidor
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS tarifa_almacenaje_diaria NUMERIC(10,2) DEFAULT 30.00;

COMMENT ON COLUMN configuracion.tarifa_almacenaje_diaria
  IS 'Costo diario de almacenaje en MXN cuando equipo supera los días gratis (LFPC Art. 63)';

-- 2. Tabla de recordatorios enviados
CREATE TABLE IF NOT EXISTS recordatorios_enviados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id          UUID NOT NULL REFERENCES ordenes_reparacion(id) ON DELETE CASCADE,
  distribuidor_id   UUID NOT NULL REFERENCES distribuidores(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL,
    -- 'recordatorio_15'  → primer aviso (día 15)
    -- 'recordatorio_25'  → segundo aviso (día 25)
    -- 'aviso_cobro_30'   → inicio de cobro de almacenaje (día 30)
    -- 'urgente_60'       → aviso urgente (día 60)
    -- 'disposicion_90'   → inicio proceso de disposición (día 90)
    -- 'manual'           → enviado manualmente desde el panel
  dias_transcurridos INTEGER,
  enviado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  canal             TEXT DEFAULT 'whatsapp',  -- 'whatsapp' | 'manual'
  resultado         TEXT DEFAULT 'enviado',   -- 'enviado' | 'error' | 'pendiente'
  notas             TEXT
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_orden_id
  ON recordatorios_enviados(orden_id);

CREATE INDEX IF NOT EXISTS idx_recordatorios_distribuidor_id
  ON recordatorios_enviados(distribuidor_id);

CREATE INDEX IF NOT EXISTS idx_recordatorios_enviado_en
  ON recordatorios_enviados(enviado_en DESC);

-- 3. RLS — cada distribuidor solo ve sus propios recordatorios
ALTER TABLE recordatorios_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "recordatorios_distribuidor_isolation"
  ON recordatorios_enviados
  FOR ALL
  USING (
    distribuidor_id = (
      SELECT distribuidor_id FROM usuarios WHERE id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
