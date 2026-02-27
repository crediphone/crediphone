-- =====================================================
-- FASE 4: Captura de Documentos (Versión Simplificada)
-- Solo fotos comprimidas, sin OCR
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPOS DE DOCUMENTOS A CLIENTES
-- =====================================================

ALTER TABLE public.clientes
  -- Campos de texto opcionales (llenado manual)
  ADD COLUMN IF NOT EXISTS curp VARCHAR(18),                 -- CURP (opcional)
  ADD COLUMN IF NOT EXISTS ine VARCHAR(18),                  -- Número de INE (opcional)
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,            -- Fecha de nacimiento

  -- Domicilio detallado (opcional)
  ADD COLUMN IF NOT EXISTS calle VARCHAR(255),
  ADD COLUMN IF NOT EXISTS numero_exterior VARCHAR(50),
  ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(50),
  ADD COLUMN IF NOT EXISTS colonia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5),

  -- Rutas de imágenes (fotos comprimidas)
  ADD COLUMN IF NOT EXISTS foto_ine_frontal TEXT,           -- Foto frente de INE
  ADD COLUMN IF NOT EXISTS foto_ine_reverso TEXT,           -- Foto reverso de INE
  ADD COLUMN IF NOT EXISTS foto_comprobante_domicilio TEXT, -- Recibo de luz, agua, etc.
  ADD COLUMN IF NOT EXISTS foto_adicional_1 TEXT,           -- Foto adicional (predial, etc.)
  ADD COLUMN IF NOT EXISTS foto_adicional_2 TEXT;           -- Foto adicional

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_clientes_curp ON public.clientes(curp) WHERE curp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_ine ON public.clientes(ine) WHERE ine IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_codigo_postal ON public.clientes(codigo_postal) WHERE codigo_postal IS NOT NULL;

-- =====================================================
-- 2. TABLA DE REFERENCIAS PERSONALES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referencias_personales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(255) NOT NULL,
  parentesco VARCHAR(100),                   -- Hermano, Padre, Amigo, etc.
  telefono VARCHAR(20) NOT NULL,
  telefono_alternativo VARCHAR(20),
  domicilio TEXT,
  tiempo_conocerlo VARCHAR(50),              -- "5 años", "Toda la vida", etc.
  ocupacion VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referencias_personales_cliente
ON public.referencias_personales(cliente_id);

-- =====================================================
-- 3. TABLA DE REFERENCIAS LABORALES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referencias_laborales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  empresa VARCHAR(255) NOT NULL,
  puesto VARCHAR(255) NOT NULL,
  nombre_supervisor VARCHAR(255),
  telefono_empresa VARCHAR(20) NOT NULL,
  extension VARCHAR(10),
  domicilio_empresa TEXT,
  antiguedad VARCHAR(50),                    -- "2 años", "6 meses", etc.
  salario_mensual DECIMAL(10, 2),
  tipo_contrato VARCHAR(100),                -- Temporal, indefinido, por obra, etc.
  horario VARCHAR(100),
  dias_laborales VARCHAR(100),               -- Lunes a Viernes, etc.
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referencias_laborales_cliente
ON public.referencias_laborales(cliente_id);

-- =====================================================
-- 4. POLÍTICAS RLS
-- =====================================================

ALTER TABLE public.referencias_personales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referencias personales acceso público"
ON public.referencias_personales FOR ALL
TO public
USING (true)
WITH CHECK (true);

ALTER TABLE public.referencias_laborales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referencias laborales acceso público"
ON public.referencias_laborales FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_referencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referencias_personales_updated_at
BEFORE UPDATE ON public.referencias_personales
FOR EACH ROW
EXECUTE FUNCTION update_referencias_updated_at();

CREATE TRIGGER trigger_referencias_laborales_updated_at
BEFORE UPDATE ON public.referencias_laborales
FOR EACH ROW
EXECUTE FUNCTION update_referencias_updated_at();

-- =====================================================
-- 6. COMENTARIOS
-- =====================================================

COMMENT ON COLUMN public.clientes.foto_ine_frontal IS 'Foto comprimida del frente de la INE';
COMMENT ON COLUMN public.clientes.foto_ine_reverso IS 'Foto comprimida del reverso de la INE';
COMMENT ON COLUMN public.clientes.foto_comprobante_domicilio IS 'Foto comprimida de recibo de luz, agua, etc.';
COMMENT ON TABLE public.referencias_personales IS 'Referencias personales del cliente';
COMMENT ON TABLE public.referencias_laborales IS 'Referencias laborales del cliente';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FASE 4: Sistema de Documentos - Configurado (Versión Simplificada)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Campos agregados a clientes:';
  RAISE NOTICE '   • CURP, INE (opcionales, llenado manual)';
  RAISE NOTICE '   • Domicilio detallado (calle, colonia, CP, etc.)';
  RAISE NOTICE '   • Fotos: INE frontal, INE reverso, comprobantes';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Tablas creadas:';
  RAISE NOTICE '   • referencias_personales';
  RAISE NOTICE '   • referencias_laborales';
  RAISE NOTICE '';
  RAISE NOTICE '📸 Las fotos se comprimen automáticamente antes de guardar';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Próximo paso: Crear componente de captura de fotos';
END $$;
