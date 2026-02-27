-- =====================================================
-- FASE 18: Sistema POS (Punto de Venta)
-- =====================================================
-- Tablas: ventas, ventas_items, caja_sesiones, caja_movimientos
-- Triggers: Decrementar/restaurar stock automático, generar folios
-- =====================================================

-- =====================================================
-- 1. TABLA: caja_sesiones (primero, porque ventas depende de ella)
-- =====================================================
CREATE TABLE IF NOT EXISTS caja_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  usuario_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,

  -- Apertura
  monto_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notas_apertura TEXT,

  -- Cierre
  monto_final NUMERIC(12, 2),
  monto_esperado NUMERIC(12, 2),
  diferencia NUMERIC(12, 2),
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  notas_cierre TEXT,

  -- Estado
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),

  -- Estadísticas (calculadas al cierre)
  total_ventas_efectivo NUMERIC(12, 2) DEFAULT 0,
  total_ventas_transferencia NUMERIC(12, 2) DEFAULT 0,
  total_ventas_tarjeta NUMERIC(12, 2) DEFAULT 0,
  total_retiros NUMERIC(12, 2) DEFAULT 0,
  total_depositos NUMERIC(12, 2) DEFAULT 0,
  numero_ventas INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_caja_sesiones_folio ON caja_sesiones(folio);
CREATE INDEX idx_caja_sesiones_usuario ON caja_sesiones(usuario_id);
CREATE INDEX idx_caja_sesiones_estado ON caja_sesiones(estado);
CREATE INDEX idx_caja_sesiones_fecha_apertura ON caja_sesiones(fecha_apertura);

-- =====================================================
-- 2. TABLA: ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
  sesion_caja_id UUID REFERENCES caja_sesiones(id) ON DELETE SET NULL,

  -- Montos
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  descuento NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Métodos de pago
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'mixto')),
  desglose_mixto JSONB, -- { efectivo: 100, tarjeta: 200 }
  referencia_pago TEXT, -- Número de transferencia/tarjeta

  -- Solo para efectivo
  monto_recibido NUMERIC(12, 2),
  cambio NUMERIC(12, 2),

  -- Metadata
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'cancelada', 'reembolsada')),
  fecha_venta TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_ventas_folio ON ventas(folio);
CREATE INDEX idx_ventas_vendedor ON ventas(vendedor_id);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_sesion ON ventas(sesion_caja_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_ventas_metodo_pago ON ventas(metodo_pago);

-- =====================================================
-- 3. TABLA: ventas_items
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT NOT NULL,

  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,

  -- Snapshot del producto (para historial)
  producto_nombre TEXT,
  producto_marca TEXT,
  producto_modelo TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ventas_items_venta ON ventas_items(venta_id);
CREATE INDEX idx_ventas_items_producto ON ventas_items(producto_id);

-- =====================================================
-- 4. TABLA: caja_movimientos
-- =====================================================
CREATE TABLE IF NOT EXISTS caja_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES caja_sesiones(id) ON DELETE CASCADE NOT NULL,

  tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  concepto TEXT NOT NULL,
  autorizado_por TEXT, -- Nombre del supervisor/admin que autorizó

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_caja_movimientos_sesion ON caja_movimientos(sesion_id);
CREATE INDEX idx_caja_movimientos_tipo ON caja_movimientos(tipo);

-- =====================================================
-- TRIGGER: Generar folio automático para ventas
-- =====================================================
DROP FUNCTION IF EXISTS generar_folio_venta() CASCADE;

CREATE OR REPLACE FUNCTION generar_folio_venta()
RETURNS TRIGGER AS $$
DECLARE
  year_actual TEXT;
  ultimo_numero INTEGER;
  nuevo_folio TEXT;
BEGIN
  -- Obtener año actual
  year_actual := TO_CHAR(NOW(), 'YYYY');

  -- Obtener último número del año
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(folio FROM 'VENTA-' || year_actual || '-(\d+)') AS INTEGER
      )
    ),
    0
  ) INTO ultimo_numero
  FROM ventas
  WHERE folio LIKE 'VENTA-' || year_actual || '-%';

  -- Generar nuevo folio con formato VENTA-YYYY-#####
  nuevo_folio := 'VENTA-' || year_actual || '-' || LPAD((ultimo_numero + 1)::TEXT, 5, '0');

  NEW.folio := nuevo_folio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_venta
BEFORE INSERT ON ventas
FOR EACH ROW
WHEN (NEW.folio IS NULL OR NEW.folio = '')
EXECUTE FUNCTION generar_folio_venta();

-- =====================================================
-- TRIGGER: Generar folio automático para caja
-- =====================================================
DROP FUNCTION IF EXISTS generar_folio_caja() CASCADE;

CREATE OR REPLACE FUNCTION generar_folio_caja()
RETURNS TRIGGER AS $$
DECLARE
  year_actual TEXT;
  ultimo_numero INTEGER;
  nuevo_folio TEXT;
BEGIN
  -- Obtener año actual
  year_actual := TO_CHAR(NOW(), 'YYYY');

  -- Obtener último número del año
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(folio FROM 'CAJA-' || year_actual || '-(\d+)') AS INTEGER
      )
    ),
    0
  ) INTO ultimo_numero
  FROM caja_sesiones
  WHERE folio LIKE 'CAJA-' || year_actual || '-%';

  -- Generar nuevo folio con formato CAJA-YYYY-#####
  nuevo_folio := 'CAJA-' || year_actual || '-' || LPAD((ultimo_numero + 1)::TEXT, 5, '0');

  NEW.folio := nuevo_folio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_caja
BEFORE INSERT ON caja_sesiones
FOR EACH ROW
WHEN (NEW.folio IS NULL OR NEW.folio = '')
EXECUTE FUNCTION generar_folio_caja();

-- =====================================================
-- TRIGGER: Decrementar stock automáticamente al crear venta
-- =====================================================
DROP FUNCTION IF EXISTS decrementar_stock_venta() CASCADE;

CREATE OR REPLACE FUNCTION decrementar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
  stock_actual INTEGER;
  venta_estado TEXT;
BEGIN
  -- Verificar que la venta esté completada
  SELECT estado INTO venta_estado
  FROM ventas
  WHERE id = NEW.venta_id;

  IF venta_estado != 'completada' THEN
    RETURN NEW; -- No decrementar si está cancelada/reembolsada
  END IF;

  -- Obtener stock actual
  SELECT stock INTO stock_actual
  FROM productos
  WHERE id = NEW.producto_id;

  -- Validar stock suficiente
  IF stock_actual < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente para producto %. Stock disponible: %, Cantidad solicitada: %',
      NEW.producto_id, stock_actual, NEW.cantidad;
  END IF;

  -- Decrementar stock
  UPDATE productos
  SET stock = stock - NEW.cantidad,
      updated_at = NOW()
  WHERE id = NEW.producto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrementar_stock_venta
AFTER INSERT ON ventas_items
FOR EACH ROW
EXECUTE FUNCTION decrementar_stock_venta();

-- =====================================================
-- TRIGGER: Restaurar stock al cancelar venta
-- =====================================================
DROP FUNCTION IF EXISTS restaurar_stock_cancelacion() CASCADE;

CREATE OR REPLACE FUNCTION restaurar_stock_cancelacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar si el estado cambió de 'completada' a 'cancelada' o 'reembolsada'
  IF OLD.estado = 'completada' AND NEW.estado IN ('cancelada', 'reembolsada') THEN
    -- Restaurar stock de todos los items
    UPDATE productos p
    SET stock = p.stock + vi.cantidad,
        updated_at = NOW()
    FROM ventas_items vi
    WHERE vi.venta_id = NEW.id
      AND p.id = vi.producto_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurar_stock_cancelacion
AFTER UPDATE ON ventas
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION restaurar_stock_cancelacion();

-- =====================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =====================================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ventas_updated_at
BEFORE UPDATE ON ventas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_caja_sesiones_updated_at
BEFORE UPDATE ON caja_sesiones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS Policies
-- =====================================================

-- ventas: Vendedores/Admin pueden ver sus propias ventas, admin ve todo
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver ventas"
ON ventas FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor', 'cobrador')
  )
);

CREATE POLICY "Vendedores y admin pueden crear ventas"
ON ventas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor')
  )
);

CREATE POLICY "Admin puede actualizar ventas (cancelar)"
ON ventas FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- ventas_items: Siguen las reglas de la venta padre
ALTER TABLE ventas_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver items de ventas visibles"
ON ventas_items FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor', 'cobrador')
  )
);

CREATE POLICY "Vendedores y admin pueden crear items"
ON ventas_items FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor')
  )
);

-- caja_sesiones: Usuario ve sus propias sesiones, admin ve todo
ALTER TABLE caja_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias sesiones de caja"
ON caja_sesiones FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid() OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

CREATE POLICY "Vendedores y admin pueden abrir caja"
ON caja_sesiones FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor')
  )
);

CREATE POLICY "Usuario puede cerrar su propia caja"
ON caja_sesiones FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid() OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- caja_movimientos: Usuario ve movimientos de sus sesiones, admin ve todo
ALTER TABLE caja_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven movimientos de sus sesiones"
ON caja_movimientos FOR SELECT
TO authenticated
USING (
  sesion_id IN (
    SELECT id FROM caja_sesiones
    WHERE usuario_id = auth.uid() OR
          auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  )
);

CREATE POLICY "Usuarios pueden crear movimientos en sus sesiones"
ON caja_movimientos FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'vendedor')
  )
);

-- =====================================================
-- Actualizar configuración: Agregar módulo POS
-- =====================================================
UPDATE configuracion
SET modulos_habilitados = jsonb_set(
  COALESCE(modulos_habilitados, '{}'::jsonb),
  '{pos}',
  'true'::jsonb
)
WHERE id = (SELECT id FROM configuracion LIMIT 1);

-- Si no existe configuración, crear una con POS habilitado
INSERT INTO configuracion (
  nombre_empresa,
  modulos_habilitados
)
SELECT
  'CREDIPHONE',
  '{"dashboard": true, "reparaciones": true, "pos": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracion LIMIT 1);

-- =====================================================
-- Comentarios para documentación
-- =====================================================
COMMENT ON TABLE ventas IS 'Transacciones de punto de venta (POS) - ventas directas sin crédito';
COMMENT ON TABLE ventas_items IS 'Líneas de productos por cada venta POS';
COMMENT ON TABLE caja_sesiones IS 'Turnos de caja con apertura/cierre y corte de caja';
COMMENT ON TABLE caja_movimientos IS 'Depósitos y retiros durante turnos de caja';

COMMENT ON COLUMN ventas.folio IS 'Folio auto-generado: VENTA-YYYY-#####';
COMMENT ON COLUMN ventas.desglose_mixto IS 'Desglose de pago mixto: {efectivo: 100, tarjeta: 200}';
COMMENT ON COLUMN ventas.monto_recibido IS 'Solo para efectivo: monto entregado por cliente';
COMMENT ON COLUMN ventas.cambio IS 'Solo para efectivo: cambio devuelto = recibido - total';

COMMENT ON COLUMN caja_sesiones.folio IS 'Folio auto-generado: CAJA-YYYY-#####';
COMMENT ON COLUMN caja_sesiones.monto_esperado IS 'Inicial + ventas efectivo + depósitos - retiros';
COMMENT ON COLUMN caja_sesiones.diferencia IS 'Final - Esperado (positivo = sobrante, negativo = faltante)';
