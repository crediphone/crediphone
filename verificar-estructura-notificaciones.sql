-- Verificar la estructura real de la tabla notificaciones
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notificaciones'
ORDER BY ordinal_position;
