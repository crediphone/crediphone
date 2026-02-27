-- =====================================================
-- FASE 8: SISTEMA COMPLETO DE REPARACIONES - CREDIPHONE
-- Creación limpia de todas las tablas necesarias
-- =====================================================

-- ============================================
-- LIMPIAR TABLAS EXISTENTES (si existen)
-- ============================================

DROP TABLE IF EXISTS public.imagenes_reparacion CASCADE;
DROP TABLE IF EXISTS public.anticipos_reparacion CASCADE;
DROP TABLE IF EXISTS public.historial_estado_orden CASCADE;
DROP TABLE IF EXISTS public.tracking_tokens CASCADE;
DROP TABLE IF EXISTS public.ordenes_reparacion CASCADE;

-- ============================================
-- TABLA PRINCIPAL: ordenes_reparacion
-- ============================================

CREATE TABLE public.ordenes_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información básica
  folio VARCHAR(50) UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  tecnico_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Estado y prioridad
  estado VARCHAR(30) NOT NULL DEFAULT 'recibido'
    CHECK (estado IN (
      'recibido', 'diagnostico', 'presupuesto', 'aprobado',
      'en_reparacion', 'completado', 'listo_entrega', 'entregado',
      'no_reparable', 'cancelado'
    )),
  prioridad VARCHAR(20) DEFAULT 'normal'
    CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),

  -- Información del dispositivo
  marca_dispositivo VARCHAR(100) NOT NULL,
  modelo_dispositivo VARCHAR(100) NOT NULL,
  imei VARCHAR(20),
  serie VARCHAR(50),
  color VARCHAR(50),

  -- Problema y diagnóstico
  problema_reportado TEXT NOT NULL,
  accesorios_incluidos TEXT,
  diagnostico_tecnico TEXT,

  -- Condiciones del dispositivo (FASE 8B/8C)
  condiciones_dispositivo JSONB DEFAULT '{}'::jsonb,
  patron_desbloqueo TEXT,
  cuentas_dispositivo JSONB DEFAULT '[]'::jsonb,

  -- Costos (costo_total es GENERADO automáticamente)
  costo_reparacion DECIMAL(10,2) DEFAULT 0.00,
  costo_partes DECIMAL(10,2) DEFAULT 0.00,
  costo_total DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(costo_reparacion, 0) + COALESCE(costo_partes, 0)
  ) STORED,

  -- Partes reemplazadas
  partes_reemplazadas JSONB DEFAULT '[]'::jsonb,

  -- Fechas
  fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_estimada_entrega TIMESTAMP WITH TIME ZONE,
  fecha_completado TIMESTAMP WITH TIME ZONE,
  fecha_entregado TIMESTAMP WITH TIME ZONE,

  -- Aprobación del cliente
  requiere_aprobacion BOOLEAN DEFAULT false,
  aprobado_por_cliente BOOLEAN DEFAULT false,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,

  -- Garantía
  es_garantia BOOLEAN DEFAULT false,
  orden_original_id UUID REFERENCES public.ordenes_reparacion(id) ON DELETE SET NULL,

  -- Firma del cliente (FASE 8B/8C)
  firma_cliente TEXT,
  tipo_firma VARCHAR(20) CHECK (tipo_firma IN ('manuscrita', 'digital')),
  fecha_firma TIMESTAMP WITH TIME ZONE,

  -- Deslindes legales (FASE 8B/8C)
  deslindes_legales TEXT[],

  -- Notas
  notas_tecnico TEXT,
  notas_internas TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_ordenes_cliente ON public.ordenes_reparacion(cliente_id);
CREATE INDEX idx_ordenes_tecnico ON public.ordenes_reparacion(tecnico_id);
CREATE INDEX idx_ordenes_estado ON public.ordenes_reparacion(estado);
CREATE INDEX idx_ordenes_fecha_recepcion ON public.ordenes_reparacion(fecha_recepcion DESC);
CREATE INDEX idx_ordenes_folio ON public.ordenes_reparacion(folio);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ordenes_reparacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ordenes_reparacion_updated_at
  BEFORE UPDATE ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION update_ordenes_reparacion_updated_at();

-- ============================================
-- TABLA: tracking_tokens
-- ============================================

CREATE TABLE public.tracking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  accesos INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tracking_tokens_orden ON public.tracking_tokens(orden_id);
CREATE INDEX idx_tracking_tokens_token ON public.tracking_tokens(token);

-- ============================================
-- TABLA: historial_estado_orden
-- ============================================

CREATE TABLE public.historial_estado_orden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30) NOT NULL,
  usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historial_orden ON public.historial_estado_orden(orden_id, created_at DESC);

-- Trigger automático para registrar cambios de estado
CREATE OR REPLACE FUNCTION registrar_cambio_estado_orden()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si el estado cambió
  IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.historial_estado_orden (
      orden_id,
      estado_anterior,
      estado_nuevo,
      usuario_id,
      comentario
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.estado ELSE NULL END,
      NEW.estado,
      NEW.updated_by,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Orden creada'
        ELSE 'Estado actualizado'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historial_estado_orden
  AFTER INSERT OR UPDATE OF estado ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_estado_orden();

-- ============================================
-- TABLA: anticipos_reparacion
-- ============================================

CREATE TABLE public.anticipos_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  tipo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo'
    CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque')),
  fecha_anticipo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anticipos_orden ON public.anticipos_reparacion(orden_id);

-- ============================================
-- TABLA: imagenes_reparacion
-- ============================================

CREATE TABLE public.imagenes_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  tipo_imagen VARCHAR(50) NOT NULL
    CHECK (tipo_imagen IN ('dispositivo', 'dano', 'accesorio', 'diagnostico', 'finalizado')),
  url_imagen TEXT NOT NULL,
  path_storage TEXT NOT NULL,
  orden_visualizacion INTEGER DEFAULT 0,
  descripcion TEXT,
  subido_desde VARCHAR(20) CHECK (subido_desde IN ('web', 'mobile', 'qr')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_imagenes_orden ON public.imagenes_reparacion(orden_id);

-- ============================================
-- PERMISOS RLS (Row Level Security)
-- ============================================

ALTER TABLE public.ordenes_reparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_estado_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos_reparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagenes_reparacion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (ajustar según necesidades)
CREATE POLICY "Usuarios autenticados pueden ver órdenes"
  ON public.ordenes_reparacion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins/técnicos pueden modificar órdenes"
  ON public.ordenes_reparacion FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users
      WHERE role IN ('admin', 'tecnico', 'recepcion')
    )
  );

-- Tracking tokens son públicos (sin autenticación)
CREATE POLICY "Tracking tokens públicos"
  ON public.tracking_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- BUCKET DE STORAGE PARA IMÁGENES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reparaciones',
  'reparaciones',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política de storage
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reparaciones');

CREATE POLICY "Usuarios autenticados pueden ver imágenes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reparaciones');

-- ============================================
-- FUNCIÓN: Generar folio automático
-- ============================================

CREATE OR REPLACE FUNCTION generar_folio_orden()
RETURNS TEXT AS $$
DECLARE
  nuevo_folio TEXT;
  contador INTEGER;
BEGIN
  -- Obtener el contador del día actual
  SELECT COUNT(*) + 1 INTO contador
  FROM public.ordenes_reparacion
  WHERE DATE(fecha_recepcion) = CURRENT_DATE;

  -- Formato: ORD-YYYYMMDD-NNNN
  nuevo_folio := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');

  RETURN nuevo_folio;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Generar token de tracking
-- ============================================

CREATE OR REPLACE FUNCTION generar_tracking_token(p_orden_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generar token aleatorio de 64 caracteres
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Insertar en tabla tracking_tokens
  INSERT INTO public.tracking_tokens (orden_id, token)
  VALUES (p_orden_id, v_token);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Insertar orden de prueba solo si hay clientes y usuarios
DO $$
DECLARE
  v_cliente_id UUID;
  v_tecnico_id UUID;
  v_orden_id UUID;
  v_token TEXT;
BEGIN
  -- Buscar primer cliente
  SELECT id INTO v_cliente_id FROM public.clientes LIMIT 1;

  -- Si no hay clientes, crear uno de prueba
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nombre, apellido, telefono, whatsapp, email)
    VALUES ('Juan', 'Pérez García', '5551234567', '5551234567', 'juan.perez@test.com')
    RETURNING id INTO v_cliente_id;

    RAISE NOTICE '✅ Cliente de prueba creado: %', v_cliente_id;
  END IF;

  -- Buscar primer técnico/admin
  SELECT id INTO v_tecnico_id
  FROM public.users
  WHERE role IN ('admin', 'tecnico')
  LIMIT 1;

  -- Si no hay técnicos, usar primer usuario disponible
  IF v_tecnico_id IS NULL THEN
    SELECT id INTO v_tecnico_id FROM public.users LIMIT 1;
  END IF;

  -- Crear orden de prueba
  v_orden_id := gen_random_uuid();

  INSERT INTO public.ordenes_reparacion (
    id,
    folio,
    cliente_id,
    tecnico_id,
    estado,
    marca_dispositivo,
    modelo_dispositivo,
    imei,
    problema_reportado,
    diagnostico_tecnico,
    costo_reparacion,
    costo_partes,
    partes_reemplazadas,
    fecha_recepcion,
    fecha_estimada_entrega,
    prioridad,
    requiere_aprobacion,
    aprobado_por_cliente,
    notas_tecnico,
    created_by,
    updated_by
  ) VALUES (
    v_orden_id,
    generar_folio_orden(),
    v_cliente_id,
    v_tecnico_id,
    'presupuesto',
    'Apple',
    'iPhone 12 Pro',
    '123456789012345',
    'Pantalla quebrada, táctil no responde correctamente',
    'Se requiere reemplazo completo de pantalla LCD + digitalizador. Marco presenta pequeños golpes pero no afectan funcionalidad. Batería en buen estado (87% de salud).',
    500.00,
    800.00,
    '[
      {"nombre": "Pantalla LCD Original", "costo": 800, "cantidad": 1},
      {"nombre": "Adhesivo pantalla", "costo": 0, "cantidad": 1}
    ]'::jsonb,
    NOW(),
    NOW() + INTERVAL '2 days',
    'alta',
    true,
    false,
    'Cliente reporta que cayó de 1.5m de altura. Revisar también funcionamiento de cámaras después de cambio de pantalla.',
    v_tecnico_id,
    v_tecnico_id
  );

  -- Generar token de tracking
  v_token := generar_tracking_token(v_orden_id);

  -- Crear anticipos de prueba
  INSERT INTO public.anticipos_reparacion (orden_id, monto, tipo_pago, fecha_anticipo, notas, created_by)
  VALUES
    (v_orden_id, 500.00, 'efectivo', NOW() - INTERVAL '1 day', 'Anticipo inicial del cliente', v_tecnico_id),
    (v_orden_id, 300.00, 'transferencia', NOW(), 'Segundo pago parcial', v_tecnico_id);

  -- Mostrar información
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ ORDEN DE PRUEBA CREADA EXITOSAMENTE';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Orden ID: %', v_orden_id;
  RAISE NOTICE '📋 Cliente ID: %', v_cliente_id;
  RAISE NOTICE '📋 Técnico ID: %', v_tecnico_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Token de tracking: %', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URL de tracking:';
  RAISE NOTICE 'http://localhost:3000/tracking/%', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Detalles:';
  RAISE NOTICE '- Dispositivo: Apple iPhone 12 Pro';
  RAISE NOTICE '- Estado: presupuesto';
  RAISE NOTICE '- Costo reparación: $500.00';
  RAISE NOTICE '- Costo partes: $800.00';
  RAISE NOTICE '- COSTO TOTAL: $1,300.00 (calculado automáticamente)';
  RAISE NOTICE '- Anticipos: $800.00';
  RAISE NOTICE '- Saldo pendiente: $500.00';
  RAISE NOTICE '';

END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar orden creada
SELECT
  o.folio,
  o.estado,
  o.marca_dispositivo,
  o.modelo_dispositivo,
  o.costo_reparacion,
  o.costo_partes,
  o.costo_total as total_calculado,
  c.nombre || ' ' || c.apellido as cliente,
  u.name as tecnico,
  t.token as tracking_token,
  (SELECT COUNT(*) FROM historial_estado_orden WHERE orden_id = o.id) as estados_historial,
  (SELECT COUNT(*) FROM anticipos_reparacion WHERE orden_id = o.id) as num_anticipos,
  (SELECT SUM(monto) FROM anticipos_reparacion WHERE orden_id = o.id) as total_anticipos
FROM public.ordenes_reparacion o
JOIN public.clientes c ON c.id = o.cliente_id
LEFT JOIN public.users u ON u.id = o.tecnico_id
LEFT JOIN public.tracking_tokens t ON t.orden_id = o.id
WHERE o.folio LIKE 'ORD-%'
ORDER BY o.created_at DESC
LIMIT 1;
