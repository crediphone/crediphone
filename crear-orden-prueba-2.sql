-- Crear segunda orden de prueba para probar aprobación
DO $$
DECLARE
  v_cliente_id UUID;
  v_tecnico_id UUID;
  v_orden_id UUID;
  v_token TEXT;
BEGIN
  -- Usar el mismo cliente y técnico
  SELECT id INTO v_cliente_id FROM clientes LIMIT 1;
  SELECT id INTO v_tecnico_id FROM users WHERE role IN ('admin', 'tecnico') LIMIT 1;

  -- Generar IDs
  v_orden_id := gen_random_uuid();
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Crear orden
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
  ) VALUES (
    v_orden_id,
    'ORD-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'),
    v_cliente_id,
    v_tecnico_id,
    'presupuesto',
    'Samsung',
    'Galaxy S21',
    '987654321098765',
    'Batería se descarga muy rápido',
    'Batería degradada al 65%. Se requiere reemplazo urgente.',
    300.00,
    450.00,
    'alta',
    true,
    v_tecnico_id,
    v_tecnico_id
  );

  -- Crear tracking token
  INSERT INTO tracking_tokens (orden_id, token)
  VALUES (v_orden_id, v_token);

  -- Crear historial
  INSERT INTO historial_estado_orden (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  VALUES
    (v_orden_id, NULL, 'recibido', v_tecnico_id, 'Orden recibida'),
    (v_orden_id, 'recibido', 'diagnostico', v_tecnico_id, 'Diagnóstico iniciado'),
    (v_orden_id, 'diagnostico', 'presupuesto', v_tecnico_id, 'Presupuesto generado');

  -- Mostrar información
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ NUEVA ORDEN DE PRUEBA CREADA';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Orden ID: %', v_orden_id;
  RAISE NOTICE '🔑 Token: %', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URL de tracking:';
  RAISE NOTICE 'http://localhost:3000/tracking/%', v_token;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Dispositivo: Samsung Galaxy S21';
  RAISE NOTICE '📊 Estado: presupuesto (listo para aprobar)';
  RAISE NOTICE '📊 Costo total: $750.00';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Antes de aprobar, abre la terminal';
  RAISE NOTICE '    donde corre Next.js y observa los logs';
  RAISE NOTICE '';

END $$;
