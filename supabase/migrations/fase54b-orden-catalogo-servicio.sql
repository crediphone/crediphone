-- FASE 54-B: Agregar referencia al catálogo de servicios en órdenes de reparación
-- Permite rastrear qué tipo de servicio fue la reparación y su precio sugerido en el momento

ALTER TABLE ordenes_reparacion
  ADD COLUMN IF NOT EXISTS catalogo_servicio_id UUID
    REFERENCES catalogo_servicios_reparacion(id)
    ON DELETE SET NULL;

-- Índice para reportes y búsquedas por tipo de servicio
CREATE INDEX IF NOT EXISTS idx_ordenes_reparacion_catalogo_servicio
  ON ordenes_reparacion(catalogo_servicio_id)
  WHERE catalogo_servicio_id IS NOT NULL;
