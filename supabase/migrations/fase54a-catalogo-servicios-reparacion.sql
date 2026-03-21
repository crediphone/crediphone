-- FASE 54-A: Catálogo de Servicios de Reparación con Precios por Distribuidor
-- Permite definir servicios estándar con precio base global
-- y sobrescrituras de precio por distribuidor

-- Tabla principal de servicios
CREATE TABLE IF NOT EXISTS catalogo_servicios_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  marca TEXT,                              -- NULL = aplica a cualquier marca
  modelo TEXT,                             -- NULL = aplica a cualquier modelo
  precio_base DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_base >= 0),
  tiempo_estimado_minutos INT CHECK (tiempo_estimado_minutos > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  distribuidor_id UUID REFERENCES distribuidores(id) ON DELETE CASCADE,  -- NULL = global
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Precios específicos por distribuidor (sobrescribe precio_base)
CREATE TABLE IF NOT EXISTS catalogo_servicios_precios_distribuidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES catalogo_servicios_reparacion(id) ON DELETE CASCADE,
  distribuidor_id UUID NOT NULL REFERENCES distribuidores(id) ON DELETE CASCADE,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(servicio_id, distribuidor_id)
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_distribuidor
  ON catalogo_servicios_reparacion(distribuidor_id);

CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_activo
  ON catalogo_servicios_reparacion(activo)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_marca
  ON catalogo_servicios_reparacion(marca)
  WHERE marca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalogo_precios_servicio
  ON catalogo_servicios_precios_distribuidor(servicio_id);

CREATE INDEX IF NOT EXISTS idx_catalogo_precios_distribuidor
  ON catalogo_servicios_precios_distribuidor(distribuidor_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_catalogo_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_catalogo_servicios_updated_at
  BEFORE UPDATE ON catalogo_servicios_reparacion
  FOR EACH ROW EXECUTE FUNCTION update_catalogo_servicios_updated_at();

CREATE TRIGGER trigger_catalogo_precios_updated_at
  BEFORE UPDATE ON catalogo_servicios_precios_distribuidor
  FOR EACH ROW EXECUTE FUNCTION update_catalogo_servicios_updated_at();
