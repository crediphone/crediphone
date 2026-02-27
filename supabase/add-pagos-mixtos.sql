-- Agregar soporte para pagos mixtos
-- Este script agrega la funcionalidad de pagos combinados (efectivo + transferencia, etc.)

-- 1. Agregar 'mixto' como opción de método de pago
ALTER TABLE public.pagos
  DROP CONSTRAINT IF EXISTS pagos_metodo_pago_check;

ALTER TABLE public.pagos
  ADD CONSTRAINT pagos_metodo_pago_check
  CHECK (metodo_pago IN ('efectivo', 'transferencia', 'deposito', 'mixto'));

-- 2. Agregar campo JSONB para almacenar el detalle de pagos mixtos
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS detalle_pago JSONB;

-- 3. Agregar comentario explicativo
COMMENT ON COLUMN public.pagos.detalle_pago IS 'Detalle de pagos mixtos: [{"metodo": "efectivo", "monto": 500}, {"metodo": "transferencia", "monto": 300}]';

-- 4. Crear índice para búsquedas en el campo JSON
CREATE INDEX IF NOT EXISTS idx_pagos_detalle_pago ON public.pagos USING GIN (detalle_pago);
