-- =====================================================
-- FASE 19: Sistema de Códigos de Barras y Ubicaciones
-- =====================================================
-- Features:
-- - Barcode/SKU tracking for products
-- - Physical location management (shelves, bins)
-- - Inventory verification workflow
-- - Missing product alerts
-- - Product movement history
-- - Employee-specific inventory tasks
-- =====================================================

-- ==========================================
-- 0. CHECK AND CREATE usuarios table if needed
-- ==========================================
-- Create usuarios table if it doesn't exist (using auth.users as base)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    CREATE TABLE usuarios (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'vendedor',
      telefono VARCHAR(20),
      direccion TEXT,
      fecha_ingreso TIMESTAMP,
      sueldo_base DECIMAL(10,2),
      comision_porcentaje DECIMAL(5,2),
      foto_perfil TEXT,
      activo BOOLEAN DEFAULT true,
      notas TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Create index on role
    CREATE INDEX idx_usuarios_role ON usuarios(role);
    CREATE INDEX idx_usuarios_activo ON usuarios(activo);

    -- Enable RLS
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY "usuarios_select_all" ON usuarios FOR SELECT TO authenticated USING (true);
    CREATE POLICY "usuarios_insert_admin" ON usuarios FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'));
    CREATE POLICY "usuarios_update_own_or_admin" ON usuarios FOR UPDATE TO authenticated
      USING (id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END
$$;

-- ==========================================
-- 1. ALTER productos table - Add barcode fields
-- ==========================================
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(100),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS ubicacion_id UUID,
ADD COLUMN IF NOT EXISTS ultima_verificacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS verificado_por UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Create unique index for barcode (allow nulls, but unique when present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_codigo_barras
ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku
ON productos(sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_ubicacion ON productos(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ==========================================
-- 2. ubicaciones_inventario - Physical locations
-- ==========================================
CREATE TABLE IF NOT EXISTS ubicaciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL, -- "Estante A1", "Vitrina Principal"
  codigo VARCHAR(50) UNIQUE NOT NULL, -- "A1", "VP1" (auto-generated)
  tipo VARCHAR(50) NOT NULL DEFAULT 'estante', -- estante, vitrina, bodega, mostrador
  descripcion TEXT,
  capacidad_maxima INTEGER, -- Optional max capacity
  qr_code TEXT, -- QR code for shelf/location
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_activo ON ubicaciones_inventario(activo);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_tipo ON ubicaciones_inventario(tipo);

-- ==========================================
-- 3. movimientos_ubicacion - Product movement history
-- ==========================================
CREATE TABLE IF NOT EXISTS movimientos_ubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  ubicacion_origen_id UUID REFERENCES ubicaciones_inventario(id),
  ubicacion_destino_id UUID REFERENCES ubicaciones_inventario(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  motivo VARCHAR(50) NOT NULL, -- 'remodelacion', 'reabastecimiento', 'promocion', 'verificacion'
  notas TEXT,
  fecha_movimiento TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_ubicacion(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_ubicacion(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos_ubicacion(usuario_id);

-- ==========================================
-- 4. verificaciones_inventario - Verification sessions
-- ==========================================
CREATE TABLE IF NOT EXISTS verificaciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio VARCHAR(50) UNIQUE NOT NULL, -- VER-2026-00001
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  ubicacion_id UUID REFERENCES ubicaciones_inventario(id), -- Optional: verify specific location
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  estado VARCHAR(50) NOT NULL DEFAULT 'en_proceso', -- en_proceso, completada, cancelada
  total_productos_esperados INTEGER DEFAULT 0,
  total_productos_escaneados INTEGER DEFAULT 0,
  total_productos_faltantes INTEGER DEFAULT 0,
  total_duplicados INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verificaciones_usuario ON verificaciones_inventario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_estado ON verificaciones_inventario(estado);
CREATE INDEX IF NOT EXISTS idx_verificaciones_fecha ON verificaciones_inventario(fecha_inicio);

-- ==========================================
-- 5. verificaciones_items - Individual scans
-- ==========================================
CREATE TABLE IF NOT EXISTS verificaciones_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verificacion_id UUID NOT NULL REFERENCES verificaciones_inventario(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id), -- NULL if unregistered product
  codigo_escaneado VARCHAR(100) NOT NULL, -- The actual barcode scanned
  cantidad_escaneada INTEGER DEFAULT 1,
  es_duplicado BOOLEAN DEFAULT false,
  es_producto_nuevo BOOLEAN DEFAULT false, -- Scanned but not in system
  ubicacion_encontrada_id UUID REFERENCES ubicaciones_inventario(id),
  notas_scan TEXT,
  fecha_scan TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verificaciones_items_verificacion ON verificaciones_items(verificacion_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_items_producto ON verificaciones_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_items_nuevo ON verificaciones_items(es_producto_nuevo) WHERE es_producto_nuevo = true;

-- ==========================================
-- 6. alertas_productos_nuevos - Admin notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS alertas_productos_nuevos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verificacion_id UUID NOT NULL REFERENCES verificaciones_inventario(id),
  verificacion_item_id UUID NOT NULL REFERENCES verificaciones_items(id),
  codigo_escaneado VARCHAR(100) NOT NULL,
  escaneado_por UUID NOT NULL REFERENCES usuarios(id),
  imagen_url TEXT, -- Optional photo of product
  notas TEXT,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- pendiente, revisado, registrado, descartado
  revisado_por UUID REFERENCES usuarios(id),
  fecha_revision TIMESTAMP,
  fecha_alerta TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_productos_nuevos(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_productos_nuevos(fecha_alerta);

-- ==========================================
-- 7. TRIGGERS - Auto-generate folios
-- ==========================================

-- Generate folio for verificaciones
DROP FUNCTION IF EXISTS generar_folio_verificacion() CASCADE;

CREATE OR REPLACE FUNCTION generar_folio_verificacion()
RETURNS TRIGGER AS $$
DECLARE
  year_actual VARCHAR(4);
  max_numero INTEGER;
  nuevo_folio VARCHAR(50);
BEGIN
  year_actual := EXTRACT(YEAR FROM NOW())::VARCHAR;

  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(folio FROM 'VER-' || year_actual || '-(\d+)')
      AS INTEGER
    )
  ), 0) INTO max_numero
  FROM verificaciones_inventario
  WHERE folio LIKE 'VER-' || year_actual || '-%';

  nuevo_folio := 'VER-' || year_actual || '-' || LPAD((max_numero + 1)::TEXT, 5, '0');
  NEW.folio := nuevo_folio;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_verificacion
BEFORE INSERT ON verificaciones_inventario
FOR EACH ROW
WHEN (NEW.folio IS NULL OR NEW.folio = '')
EXECUTE FUNCTION generar_folio_verificacion();

-- ==========================================
-- 8. TRIGGERS - Update ubicaciones_inventario updated_at
-- ==========================================
DROP FUNCTION IF EXISTS actualizar_updated_at_ubicacion() CASCADE;

CREATE OR REPLACE FUNCTION actualizar_updated_at_ubicacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_ubicacion
BEFORE UPDATE ON ubicaciones_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at_ubicacion();

-- ==========================================
-- 9. TRIGGERS - Update verificaciones updated_at
-- ==========================================
DROP FUNCTION IF EXISTS actualizar_updated_at_verificacion() CASCADE;

CREATE OR REPLACE FUNCTION actualizar_updated_at_verificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_verificacion
BEFORE UPDATE ON verificaciones_inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at_verificacion();

-- ==========================================
-- 10. TRIGGERS - Auto-update verification stats
-- ==========================================
DROP FUNCTION IF EXISTS actualizar_stats_verificacion() CASCADE;

CREATE OR REPLACE FUNCTION actualizar_stats_verificacion()
RETURNS TRIGGER AS $$
DECLARE
  total_scanned INTEGER;
  total_duplicates INTEGER;
  total_expected INTEGER;
BEGIN
  -- Count total scanned items
  SELECT COUNT(*) INTO total_scanned
  FROM verificaciones_items
  WHERE verificacion_id = NEW.verificacion_id
    AND producto_id IS NOT NULL
    AND es_duplicado = false;

  -- Count duplicates
  SELECT COUNT(*) INTO total_duplicates
  FROM verificaciones_items
  WHERE verificacion_id = NEW.verificacion_id
    AND es_duplicado = true;

  -- Get expected count from ubicacion if specified
  SELECT COUNT(*) INTO total_expected
  FROM productos p
  INNER JOIN verificaciones_inventario v ON v.id = NEW.verificacion_id
  WHERE (v.ubicacion_id IS NULL OR p.ubicacion_id = v.ubicacion_id)
    AND COALESCE(p.activo, true) = true;

  -- Update verification stats
  UPDATE verificaciones_inventario
  SET
    total_productos_escaneados = total_scanned,
    total_duplicados = total_duplicates,
    total_productos_esperados = total_expected,
    total_productos_faltantes = GREATEST(0, total_expected - total_scanned)
  WHERE id = NEW.verificacion_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stats_verificacion
AFTER INSERT OR UPDATE ON verificaciones_items
FOR EACH ROW
EXECUTE FUNCTION actualizar_stats_verificacion();

-- ==========================================
-- 11. TRIGGERS - Create alert for new products
-- ==========================================
DROP FUNCTION IF EXISTS crear_alerta_producto_nuevo() CASCADE;

CREATE OR REPLACE FUNCTION crear_alerta_producto_nuevo()
RETURNS TRIGGER AS $$
DECLARE
  usuario_scanner UUID;
BEGIN
  -- Only create alert if it's a new product
  IF NEW.es_producto_nuevo = true THEN
    -- Get user from verification session
    SELECT usuario_id INTO usuario_scanner
    FROM verificaciones_inventario
    WHERE id = NEW.verificacion_id;

    -- Create alert
    INSERT INTO alertas_productos_nuevos (
      verificacion_id,
      verificacion_item_id,
      codigo_escaneado,
      escaneado_por,
      estado
    ) VALUES (
      NEW.verificacion_id,
      NEW.id,
      NEW.codigo_escaneado,
      usuario_scanner,
      'pendiente'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crear_alerta_producto_nuevo
AFTER INSERT ON verificaciones_items
FOR EACH ROW
WHEN (NEW.es_producto_nuevo = true)
EXECUTE FUNCTION crear_alerta_producto_nuevo();

-- ==========================================
-- 12. FUNCTIONS - Helper functions
-- ==========================================

-- Generate QR code for location (just the text, frontend will render)
DROP FUNCTION IF EXISTS generar_qr_ubicacion(UUID) CASCADE;

CREATE OR REPLACE FUNCTION generar_qr_ubicacion(ubicacion_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  qr_text TEXT;
BEGIN
  SELECT 'UBICACION:' || codigo INTO qr_text
  FROM ubicaciones_inventario
  WHERE id = ubicacion_uuid;

  RETURN qr_text;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 13. RLS POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE ubicaciones_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_ubicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_productos_nuevos ENABLE ROW LEVEL SECURITY;

-- ubicaciones_inventario policies
DROP POLICY IF EXISTS "ubicaciones_select_all" ON ubicaciones_inventario;
CREATE POLICY "ubicaciones_select_all"
ON ubicaciones_inventario FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "ubicaciones_insert_admin" ON ubicaciones_inventario;
CREATE POLICY "ubicaciones_insert_admin"
ON ubicaciones_inventario FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role IN ('admin', 'vendedor')
  )
);

DROP POLICY IF EXISTS "ubicaciones_update_admin" ON ubicaciones_inventario;
CREATE POLICY "ubicaciones_update_admin"
ON ubicaciones_inventario FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role IN ('admin', 'vendedor')
  )
);

DROP POLICY IF EXISTS "ubicaciones_delete_admin" ON ubicaciones_inventario;
CREATE POLICY "ubicaciones_delete_admin"
ON ubicaciones_inventario FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- movimientos_ubicacion policies
DROP POLICY IF EXISTS "movimientos_select_all" ON movimientos_ubicacion;
CREATE POLICY "movimientos_select_all"
ON movimientos_ubicacion FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "movimientos_insert_authenticated" ON movimientos_ubicacion;
CREATE POLICY "movimientos_insert_authenticated"
ON movimientos_ubicacion FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role IN ('admin', 'vendedor')
  )
);

-- verificaciones_inventario policies
DROP POLICY IF EXISTS "verificaciones_select_own_or_admin" ON verificaciones_inventario;
CREATE POLICY "verificaciones_select_own_or_admin"
ON verificaciones_inventario FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "verificaciones_insert_authenticated" ON verificaciones_inventario;
CREATE POLICY "verificaciones_insert_authenticated"
ON verificaciones_inventario FOR INSERT
TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role IN ('admin', 'vendedor')
  )
);

DROP POLICY IF EXISTS "verificaciones_update_own" ON verificaciones_inventario;
CREATE POLICY "verificaciones_update_own"
ON verificaciones_inventario FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid());

-- verificaciones_items policies
DROP POLICY IF EXISTS "verificaciones_items_select_own_or_admin" ON verificaciones_items;
CREATE POLICY "verificaciones_items_select_own_or_admin"
ON verificaciones_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM verificaciones_inventario v
    WHERE v.id = verificacion_id
    AND (v.usuario_id = auth.uid() OR EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

DROP POLICY IF EXISTS "verificaciones_items_insert_own" ON verificaciones_items;
CREATE POLICY "verificaciones_items_insert_own"
ON verificaciones_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM verificaciones_inventario v
    WHERE v.id = verificacion_id
    AND v.usuario_id = auth.uid()
    AND v.estado = 'en_proceso'
  )
);

-- alertas_productos_nuevos policies (admin only to view/manage)
DROP POLICY IF EXISTS "alertas_select_admin" ON alertas_productos_nuevos;
CREATE POLICY "alertas_select_admin"
ON alertas_productos_nuevos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "alertas_update_admin" ON alertas_productos_nuevos;
CREATE POLICY "alertas_update_admin"
ON alertas_productos_nuevos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ==========================================
-- 14. SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Insert some default locations
INSERT INTO ubicaciones_inventario (nombre, codigo, tipo, descripcion)
VALUES
  ('Estante A1', 'A1', 'estante', 'Estante principal - Smartphones'),
  ('Vitrina Principal', 'VP1', 'vitrina', 'Vitrina de exhibición frontal'),
  ('Bodega General', 'BG1', 'bodega', 'Almacén principal de productos')
ON CONFLICT (codigo) DO NOTHING;

-- Update ubicaciones to have QR codes
UPDATE ubicaciones_inventario
SET qr_code = generar_qr_ubicacion(id)
WHERE qr_code IS NULL;

-- ==========================================
-- 15. UPDATE configuracion - Enable module
-- ==========================================

-- Add inventory module to configuration (only if configuracion table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'configuracion') THEN
    UPDATE configuracion
    SET modulos_habilitados = jsonb_set(
      COALESCE(modulos_habilitados, '{}'::jsonb),
      '{inventario_avanzado}',
      'true'::jsonb,
      true
    );
  END IF;
END
$$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
