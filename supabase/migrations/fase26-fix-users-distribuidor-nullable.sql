-- =====================================================
-- FASE 26: Fix usuarios sin distribuidor_id
-- =====================================================
-- Problema: users.distribuidor_id es NOT NULL pero
-- super_admin y usuarios del sistema no pertenecen a
-- un distribuidor específico → error al crear empleados.
--
-- Solución: Hacer distribuidor_id nullable en users.
-- Los super_admin tendrán distribuidor_id = NULL.
-- Los admin/vendedor/etc. tendrán su distribuidor asignado.
-- =====================================================

-- Hacer distribuidor_id nullable en users
ALTER TABLE users
  ALTER COLUMN distribuidor_id DROP NOT NULL;

-- El índice existente sigue siendo útil para filtrar por distribuidor
-- (ya existe idx_users_distribuidor de fase21)
-- Solo aseguramos que funcione con NULLs (los índices en PostgreSQL
-- automáticamente excluyen NULLs de índices normales, lo cual es correcto)
