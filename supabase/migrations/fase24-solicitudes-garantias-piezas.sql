-- ============================================================
-- FASE 24: Solicitudes y Garantías de Piezas en Reparaciones
-- - solicitudes_piezas: cuando no hay stock, pedir al distribuidor
-- - garantias_piezas: cuando una pieza falla o está dañada
-- ============================================================

-- -------------------------------------------------------
-- Tabla: solicitudes_piezas
-- Registra solicitudes de piezas al distribuidor cuando
-- el inventario no tiene stock del producto requerido
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_piezas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id                UUID NOT NULL REFERENCES ordenes_reparacion(id) ON DELETE CASCADE,
  producto_id             UUID REFERENCES productos(id),           -- null si la pieza no está en catálogo
  nombre_pieza            TEXT NOT NULL,
  descripcion             TEXT,                                     -- especificaciones adicionales
  cantidad                INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','enviada','recibida','cancelada')),
  solicitado_por          UUID REFERENCES users(id),
  notas                   TEXT,
  fecha_estimada_llegada  DATE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_piezas_orden   ON solicitudes_piezas(orden_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_piezas_estado  ON solicitudes_piezas(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_piezas_producto ON solicitudes_piezas(producto_id);

COMMENT ON TABLE solicitudes_piezas IS 'Solicitudes de piezas al distribuidor cuando no hay stock disponible';
COMMENT ON COLUMN solicitudes_piezas.producto_id IS 'Referencia al producto del catálogo; NULL si la pieza no está en el catálogo';
COMMENT ON COLUMN solicitudes_piezas.estado IS 'pendiente=creada, enviada=pedida al proveedor, recibida=llegó al taller, cancelada';

-- -------------------------------------------------------
-- Tabla: garantias_piezas
-- Registra solicitudes de garantía cuando una pieza
-- de inventario instalada falla o está dañada
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS garantias_piezas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id                UUID NOT NULL REFERENCES ordenes_reparacion(id) ON DELETE CASCADE,
  pieza_reparacion_id     UUID NOT NULL REFERENCES reparacion_piezas(id) ON DELETE CASCADE,
  nombre_pieza            TEXT NOT NULL,                            -- snapshot
  motivo_garantia         TEXT NOT NULL,                           -- descripción del problema
  estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','enviada','aprobada','rechazada','resuelta')),
  tipo_resolucion         VARCHAR(20)
                          CHECK (tipo_resolucion IN ('reemplazo','reembolso','reparacion','sin_resolucion')),
  notas_resolucion        TEXT,
  solicitado_por          UUID REFERENCES users(id),
  resuelto_por            UUID REFERENCES users(id),
  fecha_resolucion        TIMESTAMP WITH TIME ZONE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garantias_piezas_orden        ON garantias_piezas(orden_id);
CREATE INDEX IF NOT EXISTS idx_garantias_piezas_pieza        ON garantias_piezas(pieza_reparacion_id);
CREATE INDEX IF NOT EXISTS idx_garantias_piezas_estado       ON garantias_piezas(estado);

COMMENT ON TABLE garantias_piezas IS 'Solicitudes de garantía para piezas de inventario que fallaron o estaban dañadas';
COMMENT ON COLUMN garantias_piezas.pieza_reparacion_id IS 'Referencia a la pieza de reparacion_piezas que está en garantía';
COMMENT ON COLUMN garantias_piezas.motivo_garantia IS 'Descripción del fallo o daño de la pieza';
COMMENT ON COLUMN garantias_piezas.tipo_resolucion IS 'reemplazo=pieza nueva, reembolso=devolución de costo, reparacion=la pieza se repara, sin_resolucion=rechazada';

-- Función para actualizar updated_at (CREATE OR REPLACE es idempotente)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (DROP IF EXISTS para idempotencia)
DROP TRIGGER IF EXISTS solicitudes_piezas_updated_at ON solicitudes_piezas;
CREATE TRIGGER solicitudes_piezas_updated_at
  BEFORE UPDATE ON solicitudes_piezas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS garantias_piezas_updated_at ON garantias_piezas;
CREATE TRIGGER garantias_piezas_updated_at
  BEFORE UPDATE ON garantias_piezas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
