-- =====================================================
-- Agregar campos de firma digital al sistema de créditos
-- =====================================================

-- Agregar campos para firma del cliente
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS firma_cliente TEXT,
  ADD COLUMN IF NOT EXISTS tipo_firma TEXT CHECK (tipo_firma IN ('manuscrita', 'digital')),
  ADD COLUMN IF NOT EXISTS fecha_firma TIMESTAMPTZ;

-- Comentarios explicativos
COMMENT ON COLUMN public.creditos.firma_cliente IS 'Firma del cliente (base64 para manuscrita, texto para digital)';
COMMENT ON COLUMN public.creditos.tipo_firma IS 'Tipo de firma: manuscrita (canvas) o digital (texto)';
COMMENT ON COLUMN public.creditos.fecha_firma IS 'Fecha y hora en que se firmó el contrato';

-- Índice para búsquedas por contratos firmados
CREATE INDEX IF NOT EXISTS idx_creditos_firmados ON public.creditos(fecha_firma) WHERE fecha_firma IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Campos de firma digital agregados correctamente';
  RAISE NOTICE '📝 Campos: firma_cliente, tipo_firma, fecha_firma';
END $$;
