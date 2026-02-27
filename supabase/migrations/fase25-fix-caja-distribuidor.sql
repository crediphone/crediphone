-- FASE 25: Fix caja_sesiones distribuidor_id constraint
-- Permite que super_admin (sin distribuidor) abra sesiones de caja
-- También agrega multi-tenant scoping al historial de sesiones

-- 1. Hacer distribuidor_id nullable (super_admin no tiene distribuidor)
ALTER TABLE caja_sesiones
  ALTER COLUMN distribuidor_id DROP NOT NULL;

-- 2. Igual para caja_movimientos si existiera la columna (por si acaso)
-- (solo aplica si la tabla tiene esa columna)

-- 3. Agregar índice para consultas por distribuidor
CREATE INDEX IF NOT EXISTS idx_caja_sesiones_distribuidor
  ON caja_sesiones(distribuidor_id)
  WHERE distribuidor_id IS NOT NULL;
