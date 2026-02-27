-- CREDIPHONE - Arreglar Permisos para Service Role
-- Este script otorga todos los permisos necesarios al rol service_role

-- Otorgar todos los permisos en el schema public al service_role
GRANT ALL ON SCHEMA public TO service_role;

-- Otorgar todos los permisos en todas las tablas
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Otorgar todos los permisos en todas las secuencias (para IDs autoincrementales)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Otorgar todos los permisos en todas las funciones
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Otorgar permisos específicos en cada tabla
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.clientes TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.productos TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.creditos TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.pagos TO service_role;

-- Otorgar permisos en las vistas
GRANT ALL PRIVILEGES ON TABLE public.creditos_con_cliente TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.pagos_detallados TO service_role;

-- Otorgar permisos por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Verificar que los permisos se otorgaron correctamente
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;
