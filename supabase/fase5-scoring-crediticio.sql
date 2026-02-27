-- =====================================================
-- FASE 5: Sistema de Scoring Crediticio
-- =====================================================

-- =====================================================
-- 1. TABLA DE SCORING DE CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scoring_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,

  -- Puntaje total (0-100)
  puntaje_total INTEGER DEFAULT 0 CHECK (puntaje_total >= 0 AND puntaje_total <= 100),

  -- Desglose de puntaje
  puntaje_historial_pagos INTEGER DEFAULT 0,     -- Máximo 40 puntos
  puntaje_antiguedad INTEGER DEFAULT 0,          -- Máximo 15 puntos
  puntaje_referencias INTEGER DEFAULT 0,         -- Máximo 15 puntos
  puntaje_capacidad_pago INTEGER DEFAULT 0,      -- Máximo 20 puntos
  puntaje_documentacion INTEGER DEFAULT 0,       -- Máximo 10 puntos

  -- Clasificación de riesgo
  nivel_riesgo VARCHAR(20) DEFAULT 'SIN_EVALUAR'
    CHECK (nivel_riesgo IN ('BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO', 'SIN_EVALUAR')),

  -- Límite de crédito sugerido
  limite_credito_sugerido DECIMAL(10, 2) DEFAULT 0,

  -- Condiciones recomendadas
  enganche_minimo_sugerido INTEGER DEFAULT 20,   -- Porcentaje
  tasa_interes_sugerida DECIMAL(5, 2) DEFAULT 25.00,
  plazo_maximo_sugerido INTEGER DEFAULT 12,      -- Meses

  -- Métricas del cliente
  total_creditos INTEGER DEFAULT 0,
  creditos_liquidados INTEGER DEFAULT 0,
  creditos_activos INTEGER DEFAULT 0,
  creditos_vencidos INTEGER DEFAULT 0,
  monto_total_prestado DECIMAL(10, 2) DEFAULT 0,
  monto_total_pagado DECIMAL(10, 2) DEFAULT 0,
  dias_mora_historicos INTEGER DEFAULT 0,
  porcentaje_pagos_tiempo DECIMAL(5, 2) DEFAULT 0,

  -- Metadata
  ultima_evaluacion TIMESTAMPTZ DEFAULT NOW(),
  proxima_evaluacion TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scoring_cliente ON public.scoring_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_scoring_nivel_riesgo ON public.scoring_clientes(nivel_riesgo);
CREATE INDEX IF NOT EXISTS idx_scoring_puntaje ON public.scoring_clientes(puntaje_total DESC);

-- =====================================================
-- 2. TABLA DE HISTORIAL DE SCORING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.historial_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  puntaje_anterior INTEGER,
  puntaje_nuevo INTEGER,
  nivel_riesgo_anterior VARCHAR(20),
  nivel_riesgo_nuevo VARCHAR(20),
  razon_cambio TEXT,
  evaluado_por UUID REFERENCES auth.users(id),
  fecha_evaluacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_scoring_cliente
ON public.historial_scoring(cliente_id, fecha_evaluacion DESC);

-- =====================================================
-- 3. TABLA DE FACTORES DE SCORING (Configuración)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.factores_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  peso_maximo INTEGER NOT NULL,              -- Puntos máximos que puede aportar
  activo BOOLEAN DEFAULT true,
  formula TEXT,                               -- Descripción de cómo se calcula
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar factores por defecto
INSERT INTO public.factores_scoring (nombre, descripcion, peso_maximo, formula) VALUES
  ('historial_pagos', 'Historial de pagos del cliente', 40, 'Basado en: pagos a tiempo, créditos liquidados, morosidad'),
  ('antiguedad', 'Antigüedad como cliente del negocio', 15, 'Tiempo desde primer crédito (años)'),
  ('referencias', 'Referencias personales y laborales verificadas', 15, 'Número de referencias verificadas'),
  ('capacidad_pago', 'Capacidad de pago vs monto solicitado', 20, 'Relación ingreso/deuda'),
  ('documentacion', 'Completitud de documentación', 10, 'Documentos proporcionados (INE, comprobante, etc.)')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- 4. FUNCIONES DE CÁLCULO DE SCORING
-- =====================================================

-- Función para calcular puntaje de historial de pagos
CREATE OR REPLACE FUNCTION calcular_puntaje_historial(cliente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_creditos INT;
  creditos_liquidados INT;
  pagos_tiempo INT;
  total_pagos INT;
  dias_mora INT;
  puntaje INT := 0;
BEGIN
  -- Contar créditos
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE estado = 'pagado'),
    COALESCE(SUM(c.dias_mora), 0)
  INTO total_creditos, creditos_liquidados, dias_mora
  FROM public.creditos c
  WHERE c.cliente_id = cliente_uuid;

  -- Contar total de pagos realizados
  SELECT COUNT(*)
  INTO total_pagos
  FROM public.pagos p
  JOIN public.creditos c ON p.credito_id = c.id
  WHERE c.cliente_id = cliente_uuid;

  -- Calcular puntaje (máximo 40 puntos)

  -- 1. Créditos liquidados (30 puntos) - Peso mayor porque es más confiable
  IF total_creditos > 0 THEN
    puntaje := puntaje + LEAST(30, (creditos_liquidados::DECIMAL / total_creditos * 30)::INT);
  END IF;

  -- 2. Bonificación por número de pagos realizados (10 puntos)
  -- Más pagos = más historial = más confiable
  IF total_pagos > 0 THEN
    puntaje := puntaje + LEAST(10, total_pagos / 2); -- 1 punto cada 2 pagos, máx 10
  END IF;

  -- 3. Penalización por mora (hasta -5 puntos)
  IF dias_mora > 0 THEN
    puntaje := puntaje - LEAST(5, dias_mora / 10);
  END IF;

  -- Bonus por cliente sin mora
  IF dias_mora = 0 AND total_creditos > 0 THEN
    puntaje := puntaje + 5;
  END IF;

  RETURN GREATEST(0, LEAST(40, puntaje));
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntaje de antigüedad
CREATE OR REPLACE FUNCTION calcular_puntaje_antiguedad(cliente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  fecha_primer_credito TIMESTAMPTZ;
  meses_antiguedad INT;
  puntaje INT := 0;
BEGIN
  -- Obtener fecha del primer crédito
  SELECT MIN(fecha_inicio) INTO fecha_primer_credito
  FROM public.creditos
  WHERE cliente_id = cliente_uuid;

  IF fecha_primer_credito IS NOT NULL THEN
    meses_antiguedad := DATE_PART('month', AGE(NOW(), fecha_primer_credito))::INT;

    -- Puntaje basado en antigüedad (máximo 15 puntos)
    IF meses_antiguedad >= 36 THEN      -- 3+ años
      puntaje := 15;
    ELSIF meses_antiguedad >= 24 THEN   -- 2-3 años
      puntaje := 12;
    ELSIF meses_antiguedad >= 12 THEN   -- 1-2 años
      puntaje := 9;
    ELSIF meses_antiguedad >= 6 THEN    -- 6-12 meses
      puntaje := 6;
    ELSIF meses_antiguedad >= 3 THEN    -- 3-6 meses
      puntaje := 3;
    ELSE                                 -- < 3 meses
      puntaje := 1;
    END IF;
  END IF;

  RETURN puntaje;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntaje de referencias
CREATE OR REPLACE FUNCTION calcular_puntaje_referencias(cliente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  refs_personales INT;
  refs_laborales INT;
  puntaje INT := 0;
BEGIN
  -- Contar referencias
  SELECT COUNT(*) INTO refs_personales
  FROM public.referencias_personales
  WHERE cliente_id = cliente_uuid;

  SELECT COUNT(*) INTO refs_laborales
  FROM public.referencias_laborales
  WHERE cliente_id = cliente_uuid;

  -- Calcular puntaje (máximo 15 puntos)
  -- Referencias personales: 1 punto cada una (max 9)
  puntaje := puntaje + LEAST(9, refs_personales * 3);

  -- Referencias laborales: 2 puntos cada una (max 6)
  puntaje := puntaje + LEAST(6, refs_laborales * 3);

  RETURN LEAST(15, puntaje);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntaje de documentación
CREATE OR REPLACE FUNCTION calcular_puntaje_documentacion(cliente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  docs_completos INT := 0;
  puntaje INT := 0;
BEGIN
  -- Verificar documentos del cliente
  SELECT
    (CASE WHEN curp IS NOT NULL AND curp != '' THEN 1 ELSE 0 END) +
    (CASE WHEN ine IS NOT NULL AND ine != '' THEN 1 ELSE 0 END) +
    (CASE WHEN foto_ine_frontal IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN foto_ine_reverso IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN foto_comprobante_domicilio IS NOT NULL THEN 1 ELSE 0 END)
  INTO docs_completos
  FROM public.clientes
  WHERE id = cliente_uuid;

  -- Calcular puntaje (2 puntos por documento, máximo 10)
  puntaje := LEAST(10, docs_completos * 2);

  RETURN puntaje;
END;
$$ LANGUAGE plpgsql;

-- Función principal para calcular scoring completo
CREATE OR REPLACE FUNCTION calcular_scoring_cliente(cliente_uuid UUID)
RETURNS TABLE (
  puntaje_total INT,
  puntaje_historial INT,
  puntaje_antiguedad INT,
  puntaje_referencias INT,
  puntaje_capacidad INT,
  puntaje_documentacion INT,
  nivel_riesgo VARCHAR,
  limite_sugerido DECIMAL,
  enganche_sugerido INT,
  tasa_sugerida DECIMAL,
  plazo_sugerido INT
) AS $$
DECLARE
  p_historial INT;
  p_antiguedad INT;
  p_referencias INT;
  p_capacidad INT := 10; -- Por ahora fijo, se puede mejorar
  p_documentacion INT;
  p_total INT;
  riesgo VARCHAR;
  limite DECIMAL;
  enganche INT;
  tasa DECIMAL;
  plazo INT;
BEGIN
  -- Calcular cada componente
  p_historial := calcular_puntaje_historial(cliente_uuid);
  p_antiguedad := calcular_puntaje_antiguedad(cliente_uuid);
  p_referencias := calcular_puntaje_referencias(cliente_uuid);
  p_documentacion := calcular_puntaje_documentacion(cliente_uuid);

  -- Total
  p_total := p_historial + p_antiguedad + p_referencias + p_capacidad + p_documentacion;

  -- Determinar nivel de riesgo
  IF p_total >= 80 THEN
    riesgo := 'BAJO';
    limite := 50000.00;
    enganche := 10;
    tasa := 20.00;
    plazo := 18;
  ELSIF p_total >= 60 THEN
    riesgo := 'MEDIO';
    limite := 30000.00;
    enganche := 15;
    tasa := 25.00;
    plazo := 12;
  ELSIF p_total >= 40 THEN
    riesgo := 'ALTO';
    limite := 15000.00;
    enganche := 25;
    tasa := 35.00;
    plazo := 6;
  ELSE
    riesgo := 'MUY_ALTO';
    limite := 5000.00;
    enganche := 40;
    tasa := 45.00;
    plazo := 3;
  END IF;

  RETURN QUERY SELECT
    p_total, p_historial, p_antiguedad, p_referencias, p_capacidad, p_documentacion,
    riesgo, limite, enganche, tasa, plazo;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGER PARA ACTUALIZAR SCORING AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_scoring_automatico()
RETURNS TRIGGER AS $$
DECLARE
  scoring_data RECORD;
BEGIN
  -- Calcular nuevo scoring
  SELECT * INTO scoring_data FROM calcular_scoring_cliente(NEW.cliente_id);

  -- Insertar o actualizar scoring
  INSERT INTO public.scoring_clientes (
    cliente_id,
    puntaje_total,
    puntaje_historial_pagos,
    puntaje_antiguedad,
    puntaje_referencias,
    puntaje_capacidad_pago,
    puntaje_documentacion,
    nivel_riesgo,
    limite_credito_sugerido,
    enganche_minimo_sugerido,
    tasa_interes_sugerida,
    plazo_maximo_sugerido,
    ultima_evaluacion
  ) VALUES (
    NEW.cliente_id,
    scoring_data.puntaje_total,
    scoring_data.puntaje_historial,
    scoring_data.puntaje_antiguedad,
    scoring_data.puntaje_referencias,
    scoring_data.puntaje_capacidad,
    scoring_data.puntaje_documentacion,
    scoring_data.nivel_riesgo,
    scoring_data.limite_sugerido,
    scoring_data.enganche_sugerido,
    scoring_data.tasa_sugerida,
    scoring_data.plazo_sugerido,
    NOW()
  )
  ON CONFLICT (cliente_id) DO UPDATE SET
    puntaje_total = scoring_data.puntaje_total,
    puntaje_historial_pagos = scoring_data.puntaje_historial,
    puntaje_antiguedad = scoring_data.puntaje_antiguedad,
    puntaje_referencias = scoring_data.puntaje_referencias,
    puntaje_capacidad_pago = scoring_data.puntaje_capacidad,
    puntaje_documentacion = scoring_data.puntaje_documentacion,
    nivel_riesgo = scoring_data.nivel_riesgo,
    limite_credito_sugerido = scoring_data.limite_sugerido,
    enganche_minimo_sugerido = scoring_data.enganche_sugerido,
    tasa_interes_sugerida = scoring_data.tasa_sugerida,
    plazo_maximo_sugerido = scoring_data.plazo_sugerido,
    ultima_evaluacion = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cuando se registra un pago
DROP TRIGGER IF EXISTS trigger_actualizar_scoring_pago ON public.pagos;

CREATE TRIGGER trigger_actualizar_scoring_pago
AFTER INSERT OR UPDATE ON public.pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_scoring_automatico();

-- =====================================================
-- 6. POLÍTICAS RLS
-- =====================================================

ALTER TABLE public.scoring_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factores_scoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoring acceso público" ON public.scoring_clientes;
CREATE POLICY "Scoring acceso público"
ON public.scoring_clientes FOR ALL
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Historial scoring acceso público" ON public.historial_scoring;
CREATE POLICY "Historial scoring acceso público"
ON public.historial_scoring FOR ALL
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Factores scoring lectura pública" ON public.factores_scoring;
CREATE POLICY "Factores scoring lectura pública"
ON public.factores_scoring FOR SELECT
TO public
USING (true);

-- =====================================================
-- 7. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.scoring_clientes IS 'Puntaje crediticio de cada cliente (0-100 puntos)';
COMMENT ON TABLE public.historial_scoring IS 'Historial de cambios en el scoring de clientes';
COMMENT ON TABLE public.factores_scoring IS 'Configuración de factores que afectan el scoring';
COMMENT ON FUNCTION calcular_scoring_cliente IS 'Calcula el puntaje crediticio completo de un cliente';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FASE 5: Sistema de Scoring Crediticio - Configurado';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tablas creadas:';
  RAISE NOTICE '   • scoring_clientes - Puntaje y clasificación de riesgo';
  RAISE NOTICE '   • historial_scoring - Historial de cambios';
  RAISE NOTICE '   • factores_scoring - Configuración de factores';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funciones creadas:';
  RAISE NOTICE '   • calcular_puntaje_historial() - Evalúa pagos';
  RAISE NOTICE '   • calcular_puntaje_antiguedad() - Evalúa lealtad';
  RAISE NOTICE '   • calcular_puntaje_referencias() - Evalúa referencias';
  RAISE NOTICE '   • calcular_puntaje_documentacion() - Evalúa docs';
  RAISE NOTICE '   • calcular_scoring_cliente() - Función principal';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Triggers:';
  RAISE NOTICE '   • Se actualiza scoring automáticamente al registrar pagos';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Clasificación de Riesgo:';
  RAISE NOTICE '   • 80-100 puntos: BAJO (límite $50K, enganche 10%%, tasa 20%%)';
  RAISE NOTICE '   • 60-79 puntos: MEDIO (límite $30K, enganche 15%%, tasa 25%%)';
  RAISE NOTICE '   • 40-59 puntos: ALTO (límite $15K, enganche 25%%, tasa 35%%)';
  RAISE NOTICE '   • 0-39 puntos: MUY ALTO (límite $5K, enganche 40%%, tasa 45%%)';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Próximo paso: Crear dashboard de scoring';
END $$;
