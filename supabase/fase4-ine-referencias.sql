-- =====================================================
-- FASE 4: Captura de INE y Sistema de Referencias
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPOS DE INE A LA TABLA CLIENTES
-- =====================================================

-- Campos extraídos de la credencial INE
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ine_numero VARCHAR(18),           -- Número de credencial (13-18 dígitos)
  ADD COLUMN IF NOT EXISTS ine_ocr VARCHAR(13),              -- OCR de la credencial
  ADD COLUMN IF NOT EXISTS curp VARCHAR(18),                 -- CURP (Clave Única de Registro de Población)
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,            -- Fecha de nacimiento
  ADD COLUMN IF NOT EXISTS calle VARCHAR(255),               -- Domicilio: Calle
  ADD COLUMN IF NOT EXISTS numero_exterior VARCHAR(50),      -- Domicilio: Número exterior
  ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(50),      -- Domicilio: Número interior
  ADD COLUMN IF NOT EXISTS colonia VARCHAR(255),             -- Domicilio: Colonia
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(255),           -- Domicilio: Municipio/Alcaldía
  ADD COLUMN IF NOT EXISTS estado VARCHAR(100),              -- Domicilio: Estado
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5),         -- Código postal (5 dígitos)
  ADD COLUMN IF NOT EXISTS seccion_electoral VARCHAR(10),    -- Sección electoral
  ADD COLUMN IF NOT EXISTS vigencia DATE,                    -- Vigencia de la credencial
  ADD COLUMN IF NOT EXISTS clave_elector VARCHAR(18),        -- Clave de elector
  ADD COLUMN IF NOT EXISTS imagen_ine_frontal TEXT,          -- Ruta de imagen del frente de INE
  ADD COLUMN IF NOT EXISTS imagen_ine_reverso TEXT;          -- Ruta de imagen del reverso de INE

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_ine_numero ON public.clientes(ine_numero);
CREATE INDEX IF NOT EXISTS idx_clientes_curp ON public.clientes(curp);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo_postal ON public.clientes(codigo_postal);

-- =====================================================
-- 2. CREAR TABLA DE REFERENCIAS PERSONALES
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

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_referencias_personales_cliente
ON public.referencias_personales(cliente_id);

-- =====================================================
-- 3. CREAR TABLA DE REFERENCIAS LABORALES
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

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_referencias_laborales_cliente
ON public.referencias_laborales(cliente_id);

-- =====================================================
-- 4. CREAR TABLA DE HISTORIAL DE VERIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.verificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_verificacion VARCHAR(50) NOT NULL,    -- 'ine', 'referencia_personal', 'referencia_laboral'
  referencia_id UUID,                        -- ID de la referencia verificada (si aplica)
  resultado VARCHAR(50),                     -- 'exitosa', 'fallida', 'pendiente'
  metodo VARCHAR(100),                       -- 'llamada', 'visita', 'correo', etc.
  notas TEXT,
  verificado_por UUID REFERENCES auth.users(id),
  fecha_verificacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_verificaciones_cliente ON public.verificaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_tipo ON public.verificaciones(tipo_verificacion);

-- =====================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Referencias personales: Solo usuarios autenticados
ALTER TABLE public.referencias_personales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referencias personales visibles para autenticados"
ON public.referencias_personales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Crear referencias personales autenticados"
ON public.referencias_personales FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Actualizar referencias personales autenticados"
ON public.referencias_personales FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Eliminar referencias personales autenticados"
ON public.referencias_personales FOR DELETE
TO authenticated
USING (true);

-- Referencias laborales: Solo usuarios autenticados
ALTER TABLE public.referencias_laborales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referencias laborales visibles para autenticados"
ON public.referencias_laborales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Crear referencias laborales autenticados"
ON public.referencias_laborales FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Actualizar referencias laborales autenticados"
ON public.referencias_laborales FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Eliminar referencias laborales autenticados"
ON public.referencias_laborales FOR DELETE
TO authenticated
USING (true);

-- Verificaciones: Solo usuarios autenticados
ALTER TABLE public.verificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verificaciones visibles para autenticados"
ON public.verificaciones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Crear verificaciones autenticados"
ON public.verificaciones FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para validar CURP
CREATE OR REPLACE FUNCTION validar_curp(curp_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- CURP debe tener 18 caracteres
  IF LENGTH(curp_input) != 18 THEN
    RETURN FALSE;
  END IF;

  -- Validar formato básico (4 letras, 6 números, 1 letra, 5 alfanuméricos, 1 número)
  IF curp_input !~ '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para validar número de INE
CREATE OR REPLACE FUNCTION validar_ine(ine_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- INE debe tener entre 13 y 18 dígitos
  IF LENGTH(ine_input) < 13 OR LENGTH(ine_input) > 18 THEN
    RETURN FALSE;
  END IF;

  -- Solo números
  IF ine_input !~ '^[0-9]+$' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular edad a partir de fecha de nacimiento
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('year', AGE(fecha_nac));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para referencias_personales
CREATE OR REPLACE FUNCTION update_referencias_personales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referencias_personales_updated_at
BEFORE UPDATE ON public.referencias_personales
FOR EACH ROW
EXECUTE FUNCTION update_referencias_personales_updated_at();

-- Trigger para referencias_laborales
CREATE OR REPLACE FUNCTION update_referencias_laborales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referencias_laborales_updated_at
BEFORE UPDATE ON public.referencias_laborales
FOR EACH ROW
EXECUTE FUNCTION update_referencias_laborales_updated_at();

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN public.clientes.ine_numero IS 'Número de credencial INE (13-18 dígitos)';
COMMENT ON COLUMN public.clientes.curp IS 'CURP - Clave Única de Registro de Población';
COMMENT ON COLUMN public.clientes.clave_elector IS 'Clave de elector de la credencial INE';
COMMENT ON TABLE public.referencias_personales IS 'Referencias personales del cliente para verificación crediticia';
COMMENT ON TABLE public.referencias_laborales IS 'Referencias laborales del cliente para verificación de ingresos';
COMMENT ON TABLE public.verificaciones IS 'Historial de verificaciones realizadas';

-- =====================================================
-- VERIFICACIÓN Y MENSAJES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FASE 4: Sistema de INE y Referencias - Configurado';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tablas creadas:';
  RAISE NOTICE '   • clientes (campos INE agregados)';
  RAISE NOTICE '   • referencias_personales';
  RAISE NOTICE '   • referencias_laborales';
  RAISE NOTICE '   • verificaciones';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funciones creadas:';
  RAISE NOTICE '   • validar_curp(TEXT) - Valida formato de CURP';
  RAISE NOTICE '   • validar_ine(TEXT) - Valida número de INE';
  RAISE NOTICE '   • calcular_edad(DATE) - Calcula edad del cliente';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Políticas RLS configuradas para tablas de referencias';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Próximo paso: Implementar componente de captura de INE';
END $$;
