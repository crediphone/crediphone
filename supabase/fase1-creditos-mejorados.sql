-- =====================================================
-- FASE 1: Sistema de Créditos Mejorado
-- Incluye: Folio, Enganche, Frecuencias, Mora, etc.
-- =====================================================

-- 1. AGREGAR CAMPO DE FOLIO ÚNICO
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS folio TEXT UNIQUE;

-- Crear índice único para folio
CREATE UNIQUE INDEX IF NOT EXISTS idx_creditos_folio ON public.creditos(folio);

-- Función para generar folio automático
CREATE OR REPLACE FUNCTION generar_folio_credito()
RETURNS TRIGGER AS $$
DECLARE
  year_actual TEXT;
  contador INTEGER;
  nuevo_folio TEXT;
BEGIN
  -- Obtener año actual
  year_actual := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Obtener el último folio del año actual
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 11) AS INTEGER)), 0) + 1
  INTO contador
  FROM public.creditos
  WHERE folio LIKE 'CRED-' || year_actual || '-%';

  -- Generar nuevo folio: CRED-2024-00001
  nuevo_folio := 'CRED-' || year_actual || '-' || LPAD(contador::TEXT, 5, '0');

  -- Asignar folio al nuevo registro
  NEW.folio := nuevo_folio;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar folio automáticamente
DROP TRIGGER IF EXISTS trigger_generar_folio ON public.creditos;
CREATE TRIGGER trigger_generar_folio
  BEFORE INSERT ON public.creditos
  FOR EACH ROW
  WHEN (NEW.folio IS NULL)
  EXECUTE FUNCTION generar_folio_credito();

-- 2. AGREGAR CAMPOS DE ENGANCHE
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS monto_original DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS enganche DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enganche_porcentaje DECIMAL(5, 2) DEFAULT 10.00;

-- 3. AGREGAR CAMPO DE FRECUENCIA DE PAGO
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS frecuencia_pago TEXT DEFAULT 'quincenal'
    CHECK (frecuencia_pago IN ('semanal', 'quincenal', 'mensual'));

-- 4. AGREGAR CAMPO DE MONTO DE PAGO GENÉRICO
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS monto_pago DECIMAL(10, 2);

-- 5. AGREGAR CAMPOS PARA SISTEMA DE MORA
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS dias_mora INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_mora DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasa_mora_diaria DECIMAL(10, 2) DEFAULT 50.00;

-- 6. AGREGAR CAMPO PARA PRODUCTOS ASOCIADOS (JSON)
ALTER TABLE public.creditos
  ADD COLUMN IF NOT EXISTS productos_ids JSONB;

-- 7. ACTUALIZAR REGISTROS EXISTENTES
-- Usar CTE para generar row numbers y luego actualizar
WITH numbered_creditos AS (
  SELECT
    id,
    'CRED-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0') AS nuevo_folio
  FROM public.creditos
  WHERE folio IS NULL
)
UPDATE public.creditos c
SET
  frecuencia_pago = 'quincenal',
  monto_pago = pago_quincenal,
  folio = nc.nuevo_folio,
  monto_original = monto,
  enganche = 0,
  enganche_porcentaje = 0
FROM numbered_creditos nc
WHERE c.id = nc.id;

-- 8. AGREGAR COMENTARIOS EXPLICATIVOS
COMMENT ON COLUMN public.creditos.folio IS 'Folio único del crédito. Formato: CRED-YYYY-##### (Ej: CRED-2024-00001)';
COMMENT ON COLUMN public.creditos.monto_original IS 'Valor original del crédito antes de aplicar enganche';
COMMENT ON COLUMN public.creditos.enganche IS 'Monto pagado como enganche inicial';
COMMENT ON COLUMN public.creditos.enganche_porcentaje IS 'Porcentaje de enganche aplicado (10-50%)';
COMMENT ON COLUMN public.creditos.frecuencia_pago IS 'Frecuencia de pagos: semanal (52/año), quincenal (24/año), mensual (12/año)';
COMMENT ON COLUMN public.creditos.monto_pago IS 'Monto de cada pago según la frecuencia seleccionada';
COMMENT ON COLUMN public.creditos.dias_mora IS 'Número de días de retraso en pagos';
COMMENT ON COLUMN public.creditos.monto_mora IS 'Monto acumulado por mora/retraso';
COMMENT ON COLUMN public.creditos.tasa_mora_diaria IS 'Cobro mínimo diario por retraso (en pesos MXN)';
COMMENT ON COLUMN public.creditos.productos_ids IS 'Array JSON de IDs de productos asociados al crédito';

-- 9. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_creditos_folio_year ON public.creditos((SUBSTRING(folio, 6, 4)));
CREATE INDEX IF NOT EXISTS idx_creditos_mora ON public.creditos(dias_mora) WHERE dias_mora > 0;
CREATE INDEX IF NOT EXISTS idx_creditos_frecuencia ON public.creditos(frecuencia_pago);
CREATE INDEX IF NOT EXISTS idx_creditos_enganche ON public.creditos(enganche_porcentaje);

-- 10. FUNCIÓN PARA CALCULAR CAT (Costo Anual Total)
CREATE OR REPLACE FUNCTION calcular_cat_credito(
  p_monto DECIMAL,
  p_tasa_interes DECIMAL,
  p_plazo INTEGER,
  p_comisiones DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
  cat DECIMAL;
BEGIN
  -- Fórmula simplificada del CAT
  -- CAT = (Interés Total + Comisiones) / Monto * (365 / Plazo en días) * 100
  cat := ((p_monto * (p_tasa_interes / 100) + p_comisiones) / p_monto) * (365.0 / (p_plazo * 30)) * 100;
  RETURN ROUND(cat, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. VISTA PARA CRÉDITOS CON INFORMACIÓN COMPLETA
CREATE OR REPLACE VIEW v_creditos_detalle AS
SELECT
  c.id,
  c.folio,
  c.monto,
  c.monto_original,
  c.enganche,
  c.enganche_porcentaje,
  c.plazo,
  c.tasa_interes,
  c.frecuencia_pago,
  c.monto_pago,
  c.pago_quincenal,
  c.fecha_inicio,
  c.fecha_fin,
  c.estado,
  c.dias_mora,
  c.monto_mora,
  c.tasa_mora_diaria,
  c.cliente_id,
  cl.nombre || ' ' || cl.apellido AS cliente_nombre,
  cl.telefono AS cliente_telefono,
  c.vendedor_id,
  c.productos_ids,
  c.created_at,
  c.updated_at,
  -- Cálculos adicionales
  (c.monto * (1 + c.tasa_interes / 100)) AS monto_total_con_interes,
  calcular_cat_credito(c.monto, c.tasa_interes, c.plazo, 0) AS cat_estimado,
  CASE
    WHEN c.frecuencia_pago = 'semanal' THEN c.plazo * 4
    WHEN c.frecuencia_pago = 'quincenal' THEN c.plazo * 2
    WHEN c.frecuencia_pago = 'mensual' THEN c.plazo
  END AS numero_pagos
FROM public.creditos c
LEFT JOIN public.clientes cl ON c.cliente_id = cl.id;

-- Comentario en la vista
COMMENT ON VIEW v_creditos_detalle IS 'Vista completa de créditos con información del cliente y cálculos financieros';

-- 12. FUNCIÓN PARA ACTUALIZAR MORA AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION actualizar_mora_creditos()
RETURNS void AS $$
BEGIN
  -- Actualizar mora para créditos activos vencidos
  UPDATE public.creditos
  SET
    dias_mora = GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - fecha_fin))::INTEGER),
    monto_mora = GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - fecha_fin))::INTEGER * tasa_mora_diaria),
    estado = CASE
      WHEN CURRENT_DATE > fecha_fin AND estado = 'activo' THEN 'vencido'
      ELSE estado
    END
  WHERE estado = 'activo' AND CURRENT_DATE > fecha_fin;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION actualizar_mora_creditos IS 'Actualiza automáticamente los días y montos de mora para créditos vencidos';

-- =====================================================
-- VERIFICACIÓN Y MENSAJES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FASE 1: Sistema de Créditos Mejorado - Completado';
  RAISE NOTICE '📋 Folio automático: Habilitado (CRED-YYYY-#####)';
  RAISE NOTICE '💰 Sistema de enganche: Configurado (10%% por defecto)';
  RAISE NOTICE '📅 Frecuencias de pago: Semanal, Quincenal, Mensual';
  RAISE NOTICE '⚠️  Sistema de mora: Activado ($50 MXN/día)';
  RAISE NOTICE '📊 Vista detallada: v_creditos_detalle creada';
  RAISE NOTICE '🧮 Función CAT: calcular_cat_credito() disponible';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Próximo paso: Ejecutar update-creditos-frecuencia.sql si aún no lo has hecho';
END $$;
