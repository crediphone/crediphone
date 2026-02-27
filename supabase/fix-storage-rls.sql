-- =====================================================
-- FIX: Desactivar RLS en Storage para desarrollo
-- Esto permite subir imágenes sin autenticación
-- =====================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (si las hay)
DROP POLICY IF EXISTS "Imágenes de productos son públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON storage.objects;

-- 2. CREAR POLÍTICAS PÚBLICAS (permite operaciones sin autenticación)
-- Esto es útil para desarrollo, en producción deberías usar políticas más restrictivas

-- Permitir lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

-- Permitir subida pública (DESARROLLO - cambiar en producción)
CREATE POLICY "Public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'productos');

-- Permitir actualización pública (DESARROLLO - cambiar en producción)
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

-- Permitir eliminación pública (DESARROLLO - cambiar en producción)
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'productos');

-- 3. VERIFICAR CONFIGURACIÓN
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%Public%';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de Storage actualizadas';
  RAISE NOTICE '🔓 El bucket "productos" ahora permite operaciones públicas';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Estas políticas son para DESARROLLO';
  RAISE NOTICE '   En producción, deberías usar políticas más restrictivas';
  RAISE NOTICE '   que requieran autenticación (TO authenticated)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Recarga tu aplicación (Ctrl+F5) para aplicar cambios';
END $$;
