-- FASE 30: ventas_items con IMEI, ventas con cliente y notas por ítem
-- Permite registrar el IMEI del equipo vendido por línea de venta
-- y agregar notas por venta e ítem individual

-- 1. IMEI del equipo vendido (solo equipos serializados)
ALTER TABLE ventas_items
  ADD COLUMN IF NOT EXISTS imei TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT;

-- 2. notas de venta global (ya existe en ventas — solo verificar)
-- La columna `notas` ya existe en ventas desde fase18

-- Índice para búsqueda por IMEI vendido (auditoría / devoluciones futuras)
CREATE INDEX IF NOT EXISTS idx_ventas_items_imei
  ON ventas_items (imei)
  WHERE imei IS NOT NULL;

COMMENT ON COLUMN ventas_items.imei IS 'IMEI del equipo vendido. Solo aplica para productos tipo equipo_nuevo/equipo_usado con IMEI registrado.';
COMMENT ON COLUMN ventas_items.notas IS 'Nota específica para esta línea de venta (opcional).';
