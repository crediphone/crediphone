-- Simular lo que hace la API de tracking
-- Verificar que todo está correcto

DO $$
DECLARE
  v_token TEXT := 'b9cd00968655bde7ee4e86ead056cc5f84a074e1e1f399a740ec77f20c356857';
  v_tracking_data RECORD;
  v_orden RECORD;
BEGIN
  -- Paso 1: Buscar el token
  SELECT orden_id, expires_at, accesos INTO v_tracking_data
  FROM tracking_tokens
  WHERE token = v_token;

  IF NOT FOUND THEN
    RAISE NOTICE '❌ Token no encontrado en tracking_tokens';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Token encontrado';
  RAISE NOTICE '   Orden ID: %', v_tracking_data.orden_id;
  RAISE NOTICE '   Expira: %', v_tracking_data.expires_at;
  RAISE NOTICE '   Accesos: %', v_tracking_data.accesos;

  -- Paso 2: Verificar expiración
  IF v_tracking_data.expires_at < NOW() THEN
    RAISE NOTICE '❌ Token expirado';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Token válido (no expirado)';

  -- Paso 3: Buscar la orden
  SELECT * INTO v_orden
  FROM ordenes_reparacion
  WHERE id = v_tracking_data.orden_id;

  IF NOT FOUND THEN
    RAISE NOTICE '❌ Orden no encontrada';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Orden encontrada';
  RAISE NOTICE '   Folio: %', v_orden.folio;
  RAISE NOTICE '   Estado: %', v_orden.estado;
  RAISE NOTICE '   Cliente ID: %', v_orden.cliente_id;

  -- Paso 4: Verificar cliente
  IF EXISTS (SELECT 1 FROM clientes WHERE id = v_orden.cliente_id) THEN
    RAISE NOTICE '✅ Cliente existe';
  ELSE
    RAISE NOTICE '❌ Cliente no encontrado';
  END IF;

  -- Paso 5: Verificar historial
  RAISE NOTICE '';
  RAISE NOTICE '📊 Historial de estados:';
  FOR v_tracking_data IN
    SELECT estado_anterior, estado_nuevo, comentario, created_at
    FROM historial_estado_orden
    WHERE orden_id = v_orden.id
    ORDER BY created_at ASC
  LOOP
    RAISE NOTICE '   % -> % (%)',
      COALESCE(v_tracking_data.estado_anterior, 'NULL'),
      v_tracking_data.estado_nuevo,
      to_char(v_tracking_data.created_at, 'YYYY-MM-DD HH24:MI');
  END LOOP;

  -- Paso 6: Verificar anticipos
  RAISE NOTICE '';
  RAISE NOTICE '💰 Anticipos:';
  FOR v_tracking_data IN
    SELECT monto, tipo_pago, fecha_anticipo
    FROM anticipos_reparacion
    WHERE orden_id = v_orden.id
    ORDER BY fecha_anticipo ASC
  LOOP
    RAISE NOTICE '   $% (%)', v_tracking_data.monto, v_tracking_data.tipo_pago;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ TODO CORRECTO - La API debería funcionar';

END $$;
