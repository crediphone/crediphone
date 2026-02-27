-- Probar crear notificación manualmente
INSERT INTO notificaciones (
  orden_reparacion_id,
  destinatario_id,
  tipo,
  canal,
  mensaje,
  estado,
  datos_adicionales
) VALUES (
  'f82aa274-bb98-41b9-bfdd-c2459edbf7f3',
  '52afdfcf-d4fa-47eb-91ee-31b6f1cd8db3',
  'cliente_aprobo',
  'sistema',
  '✅ El cliente aprobó el presupuesto del folio ORD-20260212-0001. Puedes proceder con la reparación.',
  'pendiente',
  '{"folio": "ORD-20260212-0001", "origen": "tracking_publico", "fecha_accion": "2026-02-12T00:00:00.000Z"}'::jsonb
);

-- Verificar que se creó
SELECT
  n.id,
  n.tipo,
  n.canal,
  n.mensaje,
  n.estado,
  u.name as destinatario
FROM notificaciones n
LEFT JOIN users u ON u.id = n.destinatario_id
WHERE n.orden_reparacion_id = 'f82aa274-bb98-41b9-bfdd-c2459edbf7f3';
