-- CREDIPHONE - Script de Verificación
-- Ejecutar DESPUÉS de schema.sql y seed.sql para verificar la instalación

-- ===================================
-- 1. VERIFICAR TABLAS CREADAS
-- ===================================
SELECT
  'Tablas creadas:' as verificacion,
  COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'clientes', 'productos', 'creditos', 'pagos');

-- ===================================
-- 2. VERIFICAR ESTRUCTURA DE TABLAS
-- ===================================
SELECT
  table_name as tabla,
  COUNT(*) as columnas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'clientes', 'productos', 'creditos', 'pagos')
GROUP BY table_name
ORDER BY table_name;

-- ===================================
-- 3. VERIFICAR ÍNDICES CREADOS
-- ===================================
SELECT
  'Índices creados:' as verificacion,
  COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- ===================================
-- 4. VERIFICAR VISTAS CREADAS
-- ===================================
SELECT
  'Vistas creadas:' as verificacion,
  COUNT(*) as total
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('creditos_con_cliente', 'pagos_detallados');

-- ===================================
-- 5. VERIFICAR FUNCIONES CREADAS
-- ===================================
SELECT
  'Funciones creadas:' as verificacion,
  COUNT(*) as total
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('total_pagado', 'saldo_pendiente', 'update_updated_at_column');

-- ===================================
-- 6. VERIFICAR TRIGGERS CREADOS
-- ===================================
SELECT
  'Triggers creados:' as verificacion,
  COUNT(*) as total
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ===================================
-- 7. VERIFICAR RLS (Row Level Security)
-- ===================================
SELECT
  tablename as tabla,
  CASE
    WHEN rowsecurity THEN 'Habilitado ✓'
    ELSE 'Deshabilitado ✗'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'clientes', 'productos', 'creditos', 'pagos')
ORDER BY tablename;

-- ===================================
-- 8. VERIFICAR POLÍTICAS RLS
-- ===================================
SELECT
  'Políticas RLS creadas:' as verificacion,
  COUNT(*) as total
FROM pg_policies
WHERE schemaname = 'public';

-- ===================================
-- 9. VERIFICAR DATOS INSERTADOS (SEED)
-- ===================================
SELECT 'Productos:' as tabla, COUNT(*) as registros FROM public.productos
UNION ALL
SELECT 'Clientes:', COUNT(*) FROM public.clientes
UNION ALL
SELECT 'Créditos:', COUNT(*) FROM public.creditos
UNION ALL
SELECT 'Pagos:', COUNT(*) FROM public.pagos
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM public.users;

-- ===================================
-- 10. LISTAR PRODUCTOS INSERTADOS
-- ===================================
SELECT
  nombre,
  marca,
  modelo,
  precio,
  stock
FROM public.productos
ORDER BY precio DESC;

-- ===================================
-- 11. LISTAR CLIENTES INSERTADOS
-- ===================================
SELECT
  nombre || ' ' || apellido as nombre_completo,
  telefono,
  email
FROM public.clientes
ORDER BY nombre;

-- ===================================
-- 12. VERIFICAR EXTENSIONES
-- ===================================
SELECT
  'Extensión uuid-ossp:' as verificacion,
  CASE
    WHEN COUNT(*) > 0 THEN 'Instalada ✓'
    ELSE 'No instalada ✗'
  END as estado
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- ===================================
-- RESUMEN FINAL
-- ===================================
SELECT '========================================' as resumen;
SELECT '   VERIFICACIÓN COMPLETADA' as resumen;
SELECT '========================================' as resumen;
SELECT 'Si todos los checks muestran ✓ o números > 0,' as resumen;
SELECT 'la base de datos está correctamente configurada.' as resumen;
SELECT '========================================' as resumen;
