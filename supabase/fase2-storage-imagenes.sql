-- =====================================================
-- FASE 2: Configuración de Storage para Imágenes
-- Sistema de gestión de imágenes de productos
-- =====================================================

-- 1. CREAR BUCKET PARA IMÁGENES DE PRODUCTOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos',
  'productos',
  true, -- Público para acceso directo
  5242880, -- 5MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE ACCESO PÚBLICO PARA LECTURA
CREATE POLICY "Imágenes de productos son públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

-- 3. POLÍTICAS DE SUBIDA (Solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos');

-- 4. POLÍTICAS DE ACTUALIZACIÓN (Solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

-- 5. POLÍTICAS DE ELIMINACIÓN (Solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos');

-- 6. FUNCIÓN PARA GENERAR URL PÚBLICA DE IMAGEN
CREATE OR REPLACE FUNCTION obtener_url_imagen(ruta_imagen TEXT)
RETURNS TEXT AS $$
DECLARE
  url_base TEXT;
  proyecto_url TEXT;
BEGIN
  -- Obtener la URL base del proyecto de Supabase
  -- Esta URL se construye automáticamente
  SELECT current_setting('app.settings.api_url', true) INTO proyecto_url;

  IF ruta_imagen IS NULL OR ruta_imagen = '' THEN
    RETURN NULL;
  END IF;

  -- Construir URL pública
  -- Formato: https://[PROJECT_REF].supabase.co/storage/v1/object/public/productos/[PATH]
  RETURN proyecto_url || '/storage/v1/object/public/productos/' || ruta_imagen;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. AGREGAR ÍNDICE PARA BÚSQUEDA DE IMÁGENES POR PRODUCTO
CREATE INDEX IF NOT EXISTS idx_productos_imagen ON public.productos(imagen)
WHERE imagen IS NOT NULL;

-- 8. FUNCIÓN PARA LIMPIAR IMÁGENES HUÉRFANAS
-- (Imágenes en storage sin producto asociado)
CREATE OR REPLACE FUNCTION limpiar_imagenes_huerfanas()
RETURNS void AS $$
DECLARE
  imagen_record RECORD;
BEGIN
  -- Buscar imágenes en storage que no tienen producto asociado
  FOR imagen_record IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'productos'
    AND name NOT IN (
      SELECT imagen
      FROM public.productos
      WHERE imagen IS NOT NULL
    )
  LOOP
    -- Eliminar imagen huérfana
    DELETE FROM storage.objects
    WHERE bucket_id = 'productos'
    AND name = imagen_record.name;

    RAISE NOTICE 'Imagen huérfana eliminada: %', imagen_record.name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. COMENTARIOS EXPLICATIVOS
COMMENT ON TABLE storage.buckets IS 'Almacenamiento de archivos multimedia';
COMMENT ON FUNCTION obtener_url_imagen(TEXT) IS 'Genera URL pública para acceder a una imagen del storage';
COMMENT ON FUNCTION limpiar_imagenes_huerfanas IS 'Elimina imágenes del storage que no están asociadas a ningún producto';

-- =====================================================
-- ESTRUCTURA DE CARPETAS RECOMENDADA
-- =====================================================
-- /productos
--   /celulares
--     - iphone-14-pro-[timestamp].jpg
--     - samsung-galaxy-s23-[timestamp].jpg
--   /accesorios
--     - airpods-pro-[timestamp].jpg
--     - funda-iphone-[timestamp].jpg
--   /laptops
--     - macbook-pro-[timestamp].jpg
--   /tablets
--     - ipad-air-[timestamp].jpg
--   /otros
--     - smartwatch-[timestamp].jpg
-- =====================================================

-- =====================================================
-- VERIFICACIÓN Y MENSAJES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FASE 2: Sistema de Imágenes - Configurado';
  RAISE NOTICE '📦 Bucket "productos" creado (público para lectura)';
  RAISE NOTICE '🔒 Políticas de seguridad: Solo autenticados pueden modificar';
  RAISE NOTICE '📸 Límite por archivo: 5MB';
  RAISE NOTICE '🖼️  Formatos permitidos: JPEG, PNG, WebP, GIF';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Estructura recomendada:';
  RAISE NOTICE '   /productos/celulares/nombre-producto-timestamp.jpg';
  RAISE NOTICE '   /productos/accesorios/nombre-accesorio-timestamp.jpg';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Próximo paso: Crear componente de subida de imágenes';
END $$;
