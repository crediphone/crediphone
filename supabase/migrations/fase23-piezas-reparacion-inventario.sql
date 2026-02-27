-- ============================================================
-- FASE 23: Piezas de Inventario en Reparaciones
-- Vincula piezas del inventario (productos) con órdenes de
-- reparación, con descuento/devolución automática de stock
-- ============================================================

-- Tabla de piezas usadas en reparaciones (con tracking de inventario)
CREATE TABLE IF NOT EXISTS reparacion_piezas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id        UUID NOT NULL REFERENCES ordenes_reparacion(id) ON DELETE CASCADE,
  producto_id     UUID NOT NULL REFERENCES productos(id),
  nombre_pieza    TEXT NOT NULL,       -- snapshot del nombre al agregar
  cantidad        INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  costo_unitario  DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
  notas           TEXT,
  agregado_por    UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_reparacion_piezas_orden ON reparacion_piezas(orden_id);
CREATE INDEX IF NOT EXISTS idx_reparacion_piezas_producto ON reparacion_piezas(producto_id);

-- Comentarios descriptivos
COMMENT ON TABLE reparacion_piezas IS 'Piezas del inventario utilizadas en órdenes de reparación';
COMMENT ON COLUMN reparacion_piezas.nombre_pieza IS 'Snapshot del nombre del producto al momento de agregar la pieza';
COMMENT ON COLUMN reparacion_piezas.cantidad IS 'Unidades utilizadas (descuentan del stock del producto)';
COMMENT ON COLUMN reparacion_piezas.costo_unitario IS 'Costo por unidad al momento de registrar (puede diferir del precio actual)';
