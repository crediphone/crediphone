-- Actualizar tabla de créditos para soportar diferentes frecuencias de pago
-- Este script agrega la funcionalidad de pagos semanales, quincenales y mensuales

-- 1. Agregar campo de frecuencia de pago
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS frecuencia_pago TEXT DEFAULT 'quincenal' CHECK (frecuencia_pago IN ('semanal', 'quincenal', 'mensual'));

-- 2. Agregar campo de monto de pago (genérico según frecuencia)
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS monto_pago DECIMAL(10, 2);

-- 3. Actualizar registros existentes para que tengan la frecuencia quincenal por defecto
UPDATE public.creditos
SET frecuencia_pago = 'quincenal',
    monto_pago = pago_quincenal
WHERE frecuencia_pago IS NULL OR monto_pago IS NULL;

-- 4. Agregar campos para sistema de mora (para implementación futura)
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS dias_mora INTEGER DEFAULT 0;

ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS monto_mora DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS tasa_mora_diaria DECIMAL(5, 2) DEFAULT 50.00; -- cobro mínimo diario por mora

-- 5. Agregar comentarios explicativos
COMMENT ON COLUMN public.creditos.frecuencia_pago IS 'Frecuencia de pagos: semanal (52 pagos/año), quincenal (24 pagos/año), mensual (12 pagos/año)';
COMMENT ON COLUMN public.creditos.monto_pago IS 'Monto de cada pago según la frecuencia seleccionada';
COMMENT ON COLUMN public.creditos.dias_mora IS 'Número de días de retraso en pagos';
COMMENT ON COLUMN public.creditos.tasa_mora_diaria IS 'Cobro mínimo diario por retraso (en pesos)';

-- 6. Crear índice para búsquedas de créditos en mora
CREATE INDEX IF NOT EXISTS idx_creditos_mora ON public.creditos(dias_mora) WHERE dias_mora > 0;
