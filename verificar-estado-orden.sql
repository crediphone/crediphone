-- Verificar el estado actual de la orden
SELECT
  o.id,
  o.folio,
  o.estado,
  o.aprobado_por_cliente,
  o.fecha_aprobacion,
  o.tecnico_id,
  u.name as tecnico_nombre,
  u.email as tecnico_email
FROM ordenes_reparacion o
LEFT JOIN users u ON u.id = o.tecnico_id
WHERE o.id = 'f82aa274-bb98-41b9-bfdd-c2459edbf7f3';
