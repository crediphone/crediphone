-- =====================================================
-- SCRIPT DE PRUEBA PARA FASE 3
-- Crea una orden de reparación con todos los datos necesarios
-- =====================================================

-- PASO 1: Verificar que tenemos clientes y técnicos
-- Ejecuta estas queries primero para obtener IDs reales:

-- SELECT id, nombre, apellido, telefono FROM clientes LIMIT 5;
-- SELECT id, name, role FROM users WHERE role IN ('tecnico', 'admin') LIMIT 5;

-- PASO 2: Reemplaza estos UUIDs con los IDs reales de tu base de datos
-- (o deja estos si vas a crear datos de prueba)

DO $$
DECLARE
  v_cliente_id UUID;
  v_tecnico_id UUID;
  v_orden_id UUID;
  v_token TEXT;
BEGIN
  -- Obtener el primer cliente disponible (o crear uno de prueba)
  SELECT id INTO v_cliente_id FROM clientes LIMIT 1;

  -- Si no hay clientes, crear uno de prueba
  IF v_cliente_id IS NULL THEN
    INSERT INTO clientes (nombre, apellido, telefono, whatsapp, email)
    VALUES ('Juan', 'Pérez', '5551234567', '5551234567', 'juan.perez@test.com')
    RETURNING id INTO v_cliente_id;
  END IF;

  -- Obtener el primer técnico/admin disponible
  SELECT id INTO v_tecnico_id FROM users WHERE role IN ('tecnico', 'admin') LIMIT 1;

  -- Si no hay técnicos, usar el primer usuario disponible
  IF v_tecnico_id IS NULL THEN
    SELECT id INTO v_tecnico_id FROM users LIMIT 1;
  END IF;

  -- Generar ID para la orden
  v_orden_id := gen_random_uuid();

  -- Generar token de tracking (64 caracteres hexadecimales)
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Crear la orden de reparación (costo_total se calcula automáticamente)
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
    partes_reemplazadas,
    fecha_recepcion,
    fecha_estimada_entrega,
    prioridad,
    requiere_aprobacion,
    aprobado_por_cliente,
    notas_tecnico
  ) VALUES (
    v_orden_id,
    'ORD-TEST-' || to_char(NOW(), 'YYYYMMDD-HH24MI'),
    v_cliente_id,
    v_tecnico_id,
    'presupuesto', -- Estado inicial para probar aprobación
    'Apple',
    'iPhone 12 Pro',
    '123456789012345',
    'Pantalla quebrada, táctil no responde correctamente',
    'Se requiere reemplazo completo de pantalla LCD + digitalizador. Marco presenta pequeños golpes pero no afectan funcionalidad. Batería en buen estado (87% de salud).',
    500.00,
    800.00,
    '[
      {"nombre": "Pantalla LCD Original", "costo": 800, "cantidad": 1},
      {"nombre": "Adhesivo pantalla", "costo": 0, "cantidad": 1}
    ]'::jsonb,
    NOW(),
    NOW() + INTERVAL '2 days',
    'alta',
    true, -- Requiere aprobación del cliente
    false, -- Aún no aprobado
    'Cliente reporta que cayó de 1.5m de altura. Revisar también funcionamiento de cámaras después de cambio de pantalla.'
  );

  -- Crear el tracking token
  INSERT INTO tracking_tokens (
    orden_id,
    token,
    accesos,
    expires_at
  ) VALUES (
    v_orden_id,
    v_token,
    0,
    NOW() + INTERVAL '90 days'
  );

  -- OPCIONAL: Crear historial de estados previos para el timeline
  INSERT INTO historial_estado_orden (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  VALUES
    (v_orden_id, NULL, 'recibido', v_tecnico_id, 'Orden recibida en recepción'),
    (v_orden_id, 'recibido', 'diagnostico', v_tecnico_id, 'Técnico inició diagnóstico'),
    (v_orden_id, 'diagnostico', 'presupuesto', v_tecnico_id, 'Diagnóstico completado, presupuesto generado');

  -- OPCIONAL: Crear algunos anticipos para probar el display
  INSERT INTO anticipos_reparacion (orden_id, monto, tipo_pago, fecha_anticipo, notas)
  VALUES
    (v_orden_id, 500.00, 'efectivo', NOW() - INTERVAL '1 day', 'Anticipo inicial del cliente'),
    (v_orden_id, 300.00, 'transferencia', NOW(), 'Segundo pago parcial');

  -- Mostrar información de la orden creada
  RAISE NOTICE '✅ Orden creada exitosamente!';
  RAISE NOTICE 'Orden ID: %', v_orden_id;
  RAISE NOTICE 'Folio: ORD-TEST-%', to_char(NOW(), 'YYYYMMDD-HH24MI');
  RAISE NOTICE 'Cliente ID: %', v_cliente_id;
  RAISE NOTICE 'Técnico ID: %', v_tecnico_id;
  RAISE NOTICE 'Token de tracking: %', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URL de tracking:';
  RAISE NOTICE 'http://localhost:3000/tracking/%', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Detalles de la orden:';
  RAISE NOTICE '- Dispositivo: Apple iPhone 12 Pro';
  RAISE NOTICE '- Estado: presupuesto';
  RAISE NOTICE '- Costo total: $1,300.00';
  RAISE NOTICE '- Anticipos: $800.00';
  RAISE NOTICE '- Saldo pendiente: $500.00';

END $$;

-- Verificar que se creó correctamente
SELECT
  o.folio,
  o.estado,
  o.marca_dispositivo,
  o.modelo_dispositivo,
  o.costo_total,
  c.nombre || ' ' || c.apellido as cliente,
  u.name as tecnico,
  t.token as tracking_token
FROM ordenes_reparacion o
JOIN clientes c ON c.id = o.cliente_id
LEFT JOIN users u ON u.id = o.tecnico_id
LEFT JOIN tracking_tokens t ON t.orden_id = o.id
WHERE o.folio LIKE 'ORD-TEST-%'
ORDER BY o.created_at DESC
LIMIT 1;
