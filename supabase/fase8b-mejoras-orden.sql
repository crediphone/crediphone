-- =====================================================
-- FASE 8B: Sistema Avanzado de Captura de Órdenes
-- =====================================================
-- Mejoras al módulo de reparaciones con:
-- - Captura de fotos (QR + directo)
-- - Iconografía de condiciones (funcionamiento y estado físico)
-- - Patrón de desbloqueo
-- - Deslindes legales inteligentes
-- - Firma digital/manuscrita
-- =====================================================

-- EXTENDER tabla ordenes_reparacion (sin romper nada existente)
ALTER TABLE public.ordenes_reparacion
  ADD COLUMN IF NOT EXISTS patron_desbloqueo TEXT,
  ADD COLUMN IF NOT EXISTS cuentas_dispositivo JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS condiciones_funcionamiento JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estado_fisico_dispositivo JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deslindes_legales TEXT[],
  ADD COLUMN IF NOT EXISTS firma_cliente TEXT,
  ADD COLUMN IF NOT EXISTS tipo_firma VARCHAR(20) CHECK (tipo_firma IN ('manuscrita', 'digital')),
  ADD COLUMN IF NOT EXISTS fecha_firma TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN public.ordenes_reparacion.patron_desbloqueo IS 'Patrón de desbloqueo codificado (ej: "0-1-2-4-6")';
COMMENT ON COLUMN public.ordenes_reparacion.cuentas_dispositivo IS 'Array de cuentas: [{"tipo":"Google","email":"user@gmail.com","password":"***"}]';
COMMENT ON COLUMN public.ordenes_reparacion.condiciones_funcionamiento IS 'Estado de componentes electrónicos: {"bateria":"ok","pantalla":"falla",...}';
COMMENT ON COLUMN public.ordenes_reparacion.estado_fisico_dispositivo IS 'Estado físico/estético: {"marco":"perfecto","cristal":"rallado",...}';
COMMENT ON COLUMN public.ordenes_reparacion.deslindes_legales IS 'Array de textos legales aplicables según problema/servicio';
COMMENT ON COLUMN public.ordenes_reparacion.firma_cliente IS 'Firma manuscrita (base64) o nombre en cursiva (texto)';
COMMENT ON COLUMN public.ordenes_reparacion.tipo_firma IS 'Tipo de firma: manuscrita o digital';

-- NUEVA tabla: imagenes_reparacion
CREATE TABLE IF NOT EXISTS public.imagenes_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  tipo_imagen VARCHAR(50) NOT NULL CHECK (
    tipo_imagen IN ('dispositivo', 'dano', 'accesorio', 'diagnostico', 'finalizado')
  ),
  url_imagen TEXT NOT NULL,
  path_storage TEXT NOT NULL,
  orden_visualizacion INTEGER DEFAULT 0,
  descripcion TEXT,
  subido_desde VARCHAR(20) CHECK (subido_desde IN ('web', 'mobile', 'qr')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagenes_orden ON public.imagenes_reparacion(orden_id);
CREATE INDEX IF NOT EXISTS idx_imagenes_tipo ON public.imagenes_reparacion(tipo_imagen);

COMMENT ON TABLE public.imagenes_reparacion IS 'Fotos del dispositivo en diferentes etapas de la reparación';
COMMENT ON COLUMN public.imagenes_reparacion.tipo_imagen IS 'Tipo de foto: dispositivo (recepción), daño, accesorio, diagnóstico, finalizado';
COMMENT ON COLUMN public.imagenes_reparacion.subido_desde IS 'Origen: web (PC), mobile (celular), qr (escaneado)';

-- NUEVA tabla: sesiones_fotos_qr (para captura por QR)
CREATE TABLE IF NOT EXISTS public.sesiones_fotos_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  activa BOOLEAN DEFAULT true,
  imagenes_subidas INTEGER DEFAULT 0,
  max_imagenes INTEGER DEFAULT 10,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token ON public.sesiones_fotos_qr(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_orden ON public.sesiones_fotos_qr(orden_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_activas ON public.sesiones_fotos_qr(activa) WHERE activa = true;

COMMENT ON TABLE public.sesiones_fotos_qr IS 'Sesiones temporales para upload de fotos vía QR desde celular del cliente';
COMMENT ON COLUMN public.sesiones_fotos_qr.token IS 'Token único de 64 caracteres para acceso sin autenticación';
COMMENT ON COLUMN public.sesiones_fotos_qr.expires_at IS 'Sesión expira en 2 horas por seguridad';

-- FUNCIÓN: Generar token único para sesión QR
CREATE OR REPLACE FUNCTION generar_token_sesion_qr()
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generar_token_sesion_qr IS 'Genera token aleatorio de 64 caracteres para sesiones QR';

-- FUNCIÓN: Limpiar sesiones QR expiradas (ejecutar en cron job)
CREATE OR REPLACE FUNCTION limpiar_sesiones_qr_expiradas()
RETURNS INTEGER AS $$
DECLARE
  sesiones_limpiadas INTEGER;
BEGIN
  UPDATE public.sesiones_fotos_qr
  SET activa = false
  WHERE expires_at < NOW() AND activa = true;

  GET DIAGNOSTICS sesiones_limpiadas = ROW_COUNT;

  RETURN sesiones_limpiadas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpiar_sesiones_qr_expiradas IS 'Marca como inactivas las sesiones QR expiradas. Retorna cantidad limpiada.';

-- STORAGE BUCKET para imágenes de reparaciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reparaciones',
  'reparaciones',
  false, -- Privado, acceso controlado
  10485760, -- 10MB máximo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS RLS para tabla imagenes_reparacion
ALTER TABLE public.imagenes_reparacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver imágenes de reparaciones"
  ON public.imagenes_reparacion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear imágenes"
  ON public.imagenes_reparacion FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
  ON public.imagenes_reparacion FOR DELETE
  TO authenticated
  USING (true);

-- POLÍTICAS RLS para tabla sesiones_fotos_qr
ALTER TABLE public.sesiones_fotos_qr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden gestionar sesiones QR"
  ON public.sesiones_fotos_qr FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir acceso público de LECTURA para validar tokens (sin auth)
CREATE POLICY "Acceso público para validar tokens QR"
  ON public.sesiones_fotos_qr FOR SELECT
  TO anon
  USING (activa = true AND expires_at > NOW());

-- POLÍTICAS de Storage para bucket reparaciones
CREATE POLICY "Usuarios autenticados pueden ver imágenes de reparaciones"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reparaciones');

CREATE POLICY "Usuarios autenticados pueden subir imágenes de reparaciones"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reparaciones');

-- Permitir upload público durante sesiones QR activas (validado por API)
CREATE POLICY "Upload público durante sesiones QR"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'reparaciones');

CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'reparaciones');

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reparaciones');

-- TRIGGER: Actualizar updated_at en ordenes_reparacion
CREATE OR REPLACE FUNCTION update_ordenes_reparacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ordenes_updated_at ON public.ordenes_reparacion;

CREATE TRIGGER trigger_update_ordenes_updated_at
  BEFORE UPDATE ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION update_ordenes_reparacion_updated_at();

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

DO $$
BEGIN
  -- Verificar nuevas columnas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ordenes_reparacion'
    AND column_name = 'patron_desbloqueo'
  ) THEN
    RAISE NOTICE '✓ Columnas extendidas en ordenes_reparacion agregadas correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Columnas no se agregaron a ordenes_reparacion';
  END IF;

  -- Verificar tabla imagenes_reparacion
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'imagenes_reparacion'
  ) THEN
    RAISE NOTICE '✓ Tabla imagenes_reparacion creada correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Tabla imagenes_reparacion no se creó';
  END IF;

  -- Verificar tabla sesiones_fotos_qr
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'sesiones_fotos_qr'
  ) THEN
    RAISE NOTICE '✓ Tabla sesiones_fotos_qr creada correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: Tabla sesiones_fotos_qr no se creó';
  END IF;

  -- Verificar bucket
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'reparaciones'
  ) THEN
    RAISE NOTICE '✓ Bucket de storage "reparaciones" creado correctamente';
  ELSE
    RAISE NOTICE '⚠ Advertencia: Bucket "reparaciones" no encontrado (puede que ya exista)';
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'MIGRACIÓN FASE 8B COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Nuevas características habilitadas:';
  RAISE NOTICE '- Captura de fotos vía QR y directa';
  RAISE NOTICE '- Iconografía de condiciones de funcionamiento';
  RAISE NOTICE '- Estado físico del dispositivo';
  RAISE NOTICE '- Patrón de desbloqueo y cuentas';
  RAISE NOTICE '- Deslindes legales inteligentes';
  RAISE NOTICE '- Firma digital/manuscrita';
  RAISE NOTICE '==========================================';
END $$;
