-- Verificar TODAS las notificaciones de reparaciones
SELECT
  n.id,
  n.tipo,
  n.canal,
  n.mensaje,
  n.estado,
  n.created_at,
  u.name as destinatario,
  n.datos_adicionales,
  o.folio
FROM notificaciones n
LEFT JOIN users u ON u.id = n.destinatario_id
LEFT JOIN ordenes_reparacion o ON o.id = n.orden_reparacion_id
WHERE n.orden_reparacion_id IS NOT NULL
ORDER BY n.created_at DESC;
