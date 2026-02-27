-- Verificar notificación de la segunda orden
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
WHERE n.orden_reparacion_id = '733090a9-a8e1-43b6-94bc-52141b6cdd1d'
ORDER BY n.created_at DESC;
