-- Crear segunda orden de prueba y mostrar resultado
WITH nueva_orden AS (
  INSERT INTO ordenes_reparacion (
    id,
    folio,
    cliente_id,
    tecnico_id,
    estado,
    marca_dispositivo,
    modelo_dispositivo,
    imei,
    problema_reportado,
    diagnostico_tecnico,
    costo_reparacion,
    costo_partes,
    prioridad,
    requiere_aprobacion,
    created_by,
    updated_by
  )
  SELECT
    gen_random_uuid() as id,
    'ORD-' || to_char(NOW(), 'YYYYMMDD-HH24MISS') as folio,
    (SELECT id FROM clientes LIMIT 1) as cliente_id,
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1) as tecnico_id,
    'presupuesto' as estado,
    'Samsung' as marca_dispositivo,
    'Galaxy S21' as modelo_dispositivo,
    '987654321098765' as imei,
    'Batería se descarga muy rápido' as problema_reportado,
    'Batería degradada al 65%. Se requiere reemplazo urgente.' as diagnostico_tecnico,
    300.00 as costo_reparacion,
    450.00 as costo_partes,
    'alta' as prioridad,
    true as requiere_aprobacion,
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1) as created_by,
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1) as updated_by
  RETURNING id, folio
),
nuevo_token AS (
  INSERT INTO tracking_tokens (orden_id, token)
  SELECT id, encode(gen_random_bytes(32), 'hex')
  FROM nueva_orden
  RETURNING orden_id, token
),
historial AS (
  INSERT INTO historial_estado_orden (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  SELECT
    id,
    NULL,
    'recibido',
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1),
    'Orden recibida'
  FROM nueva_orden
  UNION ALL
  SELECT
    id,
    'recibido',
    'diagnostico',
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1),
    'Diagnóstico iniciado'
  FROM nueva_orden
  UNION ALL
  SELECT
    id,
    'diagnostico',
    'presupuesto',
    (SELECT id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1),
    'Presupuesto generado'
  FROM nueva_orden
  RETURNING *
)
SELECT
  no.id as orden_id,
  no.folio,
  nt.token,
  'http://localhost:3000/tracking/' || nt.token as url_tracking,
  'Samsung Galaxy S21' as dispositivo,
  'presupuesto' as estado,
  '$750.00' as costo_total
FROM nueva_orden no
JOIN nuevo_token nt ON nt.orden_id = no.id;
