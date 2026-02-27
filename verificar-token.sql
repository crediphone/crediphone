-- Verificar tokens de tracking creados
SELECT
  t.token,
  t.orden_id,
  t.accesos,
  t.expires_at,
  t.created_at,
  o.folio,
  o.estado,
  o.marca_dispositivo || ' ' || o.modelo_dispositivo as dispositivo
FROM tracking_tokens t
JOIN ordenes_reparacion o ON o.id = t.orden_id
ORDER BY t.created_at DESC
LIMIT 5;
