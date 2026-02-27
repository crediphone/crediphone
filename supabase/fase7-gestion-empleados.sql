-- =============================================
-- FASE 7: GESTIÓN DE EMPLEADOS - CREDIPHONE
-- =============================================
-- Descripción: Extensión de tabla users para gestión de empleados
-- con campos de RH y rol "técnico" para servicio de reparación
-- =============================================

-- 1. AGREGAR ROL "TÉCNICO" AL CHECK CONSTRAINT
-- =============================================

-- Eliminar constraint existente
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Crear nuevo constraint incluyendo "tecnico"
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'vendedor', 'cobrador', 'tecnico'));

COMMENT ON CONSTRAINT users_role_check ON public.users IS 'Roles permitidos: admin, vendedor, cobrador, tecnico';

-- 2. AGREGAR CAMPOS DE RH A LA TABLA USERS
-- =============================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS sueldo_base DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS comision_porcentaje DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS foto_perfil TEXT,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN public.users.telefono IS 'Teléfono de contacto del empleado';
COMMENT ON COLUMN public.users.direccion IS 'Dirección del empleado';
COMMENT ON COLUMN public.users.fecha_ingreso IS 'Fecha de ingreso a la empresa';
COMMENT ON COLUMN public.users.sueldo_base IS 'Sueldo base mensual en MXN';
COMMENT ON COLUMN public.users.comision_porcentaje IS 'Porcentaje de comisión sobre ventas (para vendedores)';
COMMENT ON COLUMN public.users.foto_perfil IS 'URL de foto de perfil en Supabase Storage';
COMMENT ON COLUMN public.users.activo IS 'Empleado activo (true) o inactivo (false) - soft delete';
COMMENT ON COLUMN public.users.notas IS 'Notas administrativas sobre el empleado';

-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_activo ON public.users(activo);
CREATE INDEX IF NOT EXISTS idx_users_telefono ON public.users(telefono);
CREATE INDEX IF NOT EXISTS idx_users_fecha_ingreso ON public.users(fecha_ingreso);

-- 4. CREAR VISTA DE EMPLEADOS ACTIVOS
-- =============================================

CREATE OR REPLACE VIEW public.empleados_activos AS
SELECT
  id,
  email,
  name,
  role,
  telefono,
  direccion,
  fecha_ingreso,
  sueldo_base,
  comision_porcentaje,
  foto_perfil,
  activo,
  notas,
  created_at,
  updated_at
FROM public.users
WHERE activo = true
ORDER BY name ASC;

COMMENT ON VIEW public.empleados_activos IS 'Vista de todos los empleados activos ordenados por nombre';

-- 5. FUNCIÓN PARA CALCULAR COMISIONES DE VENDEDOR
-- =============================================

CREATE OR REPLACE FUNCTION public.calcular_comision_vendedor(
  vendedor_uuid UUID,
  fecha_inicio DATE,
  fecha_fin DATE
)
RETURNS TABLE (
  total_creditos INTEGER,
  monto_total_vendido DECIMAL(10, 2),
  comision_ganada DECIMAL(10, 2)
) AS $$
DECLARE
  porcentaje_comision DECIMAL(5, 2);
BEGIN
  -- Obtener porcentaje de comisión del vendedor
  SELECT comision_porcentaje INTO porcentaje_comision
  FROM public.users
  WHERE id = vendedor_uuid;

  -- Si no tiene comisión configurada, usar 0
  IF porcentaje_comision IS NULL THEN
    porcentaje_comision := 0;
  END IF;

  -- Calcular totales
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_creditos,
    COALESCE(SUM(c.monto), 0)::DECIMAL(10, 2) AS monto_total_vendido,
    COALESCE(SUM(c.monto) * porcentaje_comision / 100, 0)::DECIMAL(10, 2) AS comision_ganada
  FROM public.creditos c
  WHERE c.vendedor_id = vendedor_uuid
    AND c.fecha_inicio >= fecha_inicio
    AND c.fecha_inicio <= fecha_fin
    AND c.estado != 'cancelado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calcular_comision_vendedor IS 'Calcula la comisión ganada por un vendedor en un período de tiempo';

-- 6. FUNCIÓN PARA CALCULAR DESEMPEÑO DE COBRADOR
-- =============================================

CREATE OR REPLACE FUNCTION public.calcular_desempeno_cobrador(
  cobrador_uuid UUID,
  fecha_inicio DATE,
  fecha_fin DATE
)
RETURNS TABLE (
  total_pagos INTEGER,
  monto_total_cobrado DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_pagos,
    COALESCE(SUM(p.monto), 0)::DECIMAL(10, 2) AS monto_total_cobrado
  FROM public.pagos p
  WHERE p.cobrador_id = cobrador_uuid
    AND p.fecha_pago >= fecha_inicio
    AND p.fecha_pago <= fecha_fin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calcular_desempeno_cobrador IS 'Calcula el desempeño de un cobrador en un período de tiempo';

-- 7. ACTUALIZAR RLS POLICIES
-- =============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Solo admins pueden gestionar empleados" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver empleados" ON public.users;

-- Política: Solo admins pueden crear/actualizar/eliminar empleados
CREATE POLICY "Solo admins pueden gestionar empleados"
  ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Todos los usuarios autenticados pueden ver empleados
CREATE POLICY "Usuarios autenticados pueden ver empleados"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. GRANTS DE PERMISOS
-- =============================================

-- Asegurar que la vista es accesible para usuarios autenticados
GRANT SELECT ON public.empleados_activos TO authenticated;

-- Asegurar que las funciones son ejecutables
GRANT EXECUTE ON FUNCTION public.calcular_comision_vendedor TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_desempeno_cobrador TO authenticated;

-- =============================================
-- FIN DE MIGRACIÓN FASE 7
-- =============================================

-- Verificar cambios
DO $$
BEGIN
  RAISE NOTICE '✅ Migración Fase 7 completada exitosamente';
  RAISE NOTICE '✅ Rol "tecnico" agregado';
  RAISE NOTICE '✅ Campos de RH agregados a tabla users';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '✅ Vista empleados_activos creada';
  RAISE NOTICE '✅ Funciones de cálculo creadas';
  RAISE NOTICE '✅ Políticas RLS actualizadas';
END $$;
