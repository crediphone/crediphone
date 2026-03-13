-- FASE 29: Permitir ventas sin distribuidor_id para super_admin
-- Mismo patrón que fase25 (caja_sesiones) y fase26 (users)
-- super_admin tiene distribuidor_id = NULL y necesita poder registrar ventas

ALTER TABLE ventas
  ALTER COLUMN distribuidor_id DROP NOT NULL;

-- También ventas_items por si aplica (no tiene la columna, solo ventas)
