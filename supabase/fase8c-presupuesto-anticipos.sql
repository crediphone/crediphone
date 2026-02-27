-- =====================================================
-- FASE 8C: Sistema de Presupuesto y Anticipos
-- VERSIÓN IDEMPOTENTE (puede ejecutarse múltiples veces)
-- =====================================================
-- Mejoras al módulo de reparaciones con:
-- - Presupuesto detallado (mano de obra + piezas)
-- - Sistema de anticipos múltiples
-- - Tipos de pago (efectivo, transferencia, tarjeta, mixto)
-- - Historial de pagos
-- =====================================================

-- EXTENDER tabla ordenes_reparacion con campos de presupuesto
ALTER TABLE public.ordenes_reparacion
  ADD COLUMN IF NOT EXISTS precio_mano_obra DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_piezas DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS presupuesto_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_anticipos DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas_presupuesto TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN public.ordenes_reparacion.precio_mano_obra IS 'Precio de mano de obra/servicio técnico (legacy)';
COMMENT ON COLUMN public.ordenes_reparacion.precio_piezas IS 'Precio de piezas/refacciones (legacy)';
COMMENT ON COLUMN public.ordenes_reparacion.precio_total IS 'Total de reparación (legacy, calculado)';
COMMENT ON COLUMN public.ordenes_reparacion.presupuesto_total IS 'Presupuesto total simplificado (mano obra + piezas)';
COMMENT ON COLUMN public.ordenes_reparacion.total_anticipos IS 'Suma de todos los anticipos recibidos (actualizado por trigger)';
COMMENT ON COLUMN public.ordenes_reparacion.saldo_pendiente IS 'Saldo pendiente (presupuesto_total - total_anticipos)';
COMMENT ON COLUMN public.ordenes_reparacion.notas_presupuesto IS 'Notas adicionales sobre el presupuesto';

-- NUEVA tabla: anticipos_reparacion
CREATE TABLE IF NOT EXISTS public.anticipos_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'mixto')),
  desglose_mixto JSONB DEFAULT NULL,
  referencia_pago VARCHAR(100),
  notas TEXT,
  recibido_por UUID REFERENCES auth.users(id),
  fecha_anticipo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anticipos_orden ON public.anticipos_reparacion(orden_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_fecha ON public.anticipos_reparacion(fecha_anticipo DESC);

COMMENT ON TABLE public.anticipos_reparacion IS 'Historial de anticipos/pagos parciales por orden de reparación';
COMMENT ON COLUMN public.anticipos_reparacion.tipo_pago IS 'Tipo: efectivo, transferencia, tarjeta, o mixto';
COMMENT ON COLUMN public.anticipos_reparacion.desglose_mixto IS 'Para pago mixto: {"efectivo": 500, "tarjeta": 300, "transferencia": 200}';
COMMENT ON COLUMN public.anticipos_reparacion.referencia_pago IS 'Referencia bancaria, número de transacción, últimos 4 dígitos tarjeta, etc.';

-- FUNCIÓN: Actualizar total_anticipos cuando se agrega/elimina un anticipo
CREATE OR REPLACE FUNCTION actualizar_total_anticipos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.ordenes_reparacion
    SET total_anticipos = (
      SELECT COALESCE(SUM(monto), 0)
      FROM public.anticipos_reparacion
      WHERE orden_id = NEW.orden_id
    )
    WHERE id = NEW.orden_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ordenes_reparacion
    SET total_anticipos = (
      SELECT COALESCE(SUM(monto), 0)
      FROM public.anticipos_reparacion
      WHERE orden_id = OLD.orden_id
    )
    WHERE id = OLD.orden_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_anticipos_insert ON public.anticipos_reparacion;
DROP TRIGGER IF EXISTS trigger_actualizar_anticipos_update ON public.anticipos_reparacion;
DROP TRIGGER IF EXISTS trigger_actualizar_anticipos_delete ON public.anticipos_reparacion;

CREATE TRIGGER trigger_actualizar_anticipos_insert
  AFTER INSERT ON public.anticipos_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_anticipos();

CREATE TRIGGER trigger_actualizar_anticipos_update
  AFTER UPDATE ON public.anticipos_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_anticipos();

CREATE TRIGGER trigger_actualizar_anticipos_delete
  AFTER DELETE ON public.anticipos_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_anticipos();

-- POLÍTICAS RLS para tabla anticipos_reparacion
ALTER TABLE public.anticipos_reparacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver anticipos" ON public.anticipos_reparacion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear anticipos" ON public.anticipos_reparacion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar anticipos" ON public.anticipos_reparacion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar anticipos" ON public.anticipos_reparacion;

CREATE POLICY "Usuarios autenticados pueden ver anticipos"
  ON public.anticipos_reparacion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear anticipos"
  ON public.anticipos_reparacion FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar anticipos"
  ON public.anticipos_reparacion FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar anticipos"
  ON public.anticipos_reparacion FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

DO $$
BEGIN
  -- Verificar nuevas columnas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ordenes_reparacion'
    AND column_name = 'precio_total'
  ) THEN
    RAISE NOTICE '✓ Columnas de presupuesto agregadas correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Columnas de presupuesto no se agregaron';
  END IF;

  -- Verificar tabla anticipos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'anticipos_reparacion'
  ) THEN
    RAISE NOTICE '✓ Tabla anticipos_reparacion creada correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Tabla anticipos_reparacion no se creó';
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'MIGRACIÓN FASE 8C COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Nuevas características habilitadas:';
  RAISE NOTICE '- Presupuesto detallado (mano obra + piezas)';
  RAISE NOTICE '- Sistema de anticipos múltiples';
  RAISE NOTICE '- Tipos de pago: efectivo, transferencia, tarjeta, mixto';
  RAISE NOTICE '- Cálculo automático de saldo pendiente';
  RAISE NOTICE '==========================================';
END $$;
