-- Verificar que se creó la notificación al técnico
SELECT
  n.id,
  n.tipo,
  n.canal,
  n.mensaje,
  n.estado,
  n.created_at,
  u.name as destinatario,
  u.email as email_destinatario,
  n.datos_adicionales,
  o.folio as orden_folio,
  o.estado as orden_estado
FROM notificaciones n
LEFT JOIN users u ON u.id = n.destinatario_id
LEFT JOIN ordenes_reparacion o ON o.id = n.orden_reparacion_id
WHERE n.orden_reparacion_id = 'f82aa274-bb98-41b9-bfdd-c2459edbf7f3'
ORDER BY n.created_at DESC;
