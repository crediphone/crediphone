-- FASE 42: Sistema de Lotes de Piezas — Gestión de órdenes de compra con distribución de costo de envío
-- Tabla principal de lotes
CREATE TABLE IF NOT EXISTS lotes_piezas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribuidor_id UUID NOT NULL REFERENCES distribuidores(id) ON DELETE CASCADE,
  proveedor VARCHAR(200) NOT NULL,
  numero_pedido VARCHAR(100),
  fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_estimada_llegada DATE,
  fecha_llegada DATE,
  costo_envio_total DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(30) NOT NULL DEFAULT 'pedido',
  -- estados: 'pedido' | 'en_camino' | 'recibido' | 'verificado' | 'cancelado'
  notas TEXT,
  recibido_por UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items del lote (piezas individuales)
CREATE TABLE IF NOT EXISTS lotes_piezas_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES lotes_piezas(id) ON DELETE CASCADE,
  reparacion_id UUID REFERENCES reparaciones(id) ON DELETE SET NULL,
  -- NULL = pieza para stock general (no vinculada a reparación específica)
  descripcion VARCHAR(300) NOT NULL,
  cantidad_pedida INT NOT NULL DEFAULT 1,
  cantidad_recibida INT,
  costo_unitario DECIMAL(10,2),
  estado_item VARCHAR(30) DEFAULT 'pendiente',
  -- 'pendiente' | 'recibido_ok' | 'recibido_danado' | 'faltante'
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas a reparacion_piezas si no existen
ALTER TABLE reparacion_piezas ADD COLUMN IF NOT EXISTS lote_id UUID REFERENCES lotes_piezas(id) ON DELETE SET NULL;
ALTER TABLE reparacion_piezas ADD COLUMN IF NOT EXISTS costo_envio_proporcionado DECIMAL(10,2) DEFAULT 0;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_lotes_piezas_distribuidor_id ON lotes_piezas(distribuidor_id);
CREATE INDEX IF NOT EXISTS idx_lotes_piezas_estado ON lotes_piezas(estado);
CREATE INDEX IF NOT EXISTS idx_lotes_piezas_items_lote_id ON lotes_piezas_items(lote_id);
CREATE INDEX IF NOT EXISTS idx_lotes_piezas_items_reparacion_id ON lotes_piezas_items(reparacion_id);
