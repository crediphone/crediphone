-- =====================================================
-- FASE 8 EXTRAS: Sistema de Notificaciones y Configuración
-- =====================================================
-- Descripción: Notificaciones automáticas, escalación y configuración
-- Ejecutar DESPUÉS de fase8-reparaciones.sql
-- =====================================================

-- =====================================================
-- 1. TABLA: config_notificaciones_reparacion
-- =====================================================

CREATE TABLE IF NOT EXISTS public.config_notificaciones_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuración de escalación
  horas_sin_respuesta_tecnico INTEGER DEFAULT 24,
  horas_listo_sin_notificar INTEGER DEFAULT 2,

  -- Recordatorios
  dias_recordatorio_garantia INTEGER DEFAULT 25, -- 5 días antes de vencer

  -- Habilitar/deshabilitar notificaciones automáticas
  notificar_diagnostico_completado BOOLEAN DEFAULT true,
  notificar_presupuesto_aprobado BOOLEAN DEFAULT true,
  notificar_reparacion_completada BOOLEAN DEFAULT true,
  notificar_listo_entrega BOOLEAN DEFAULT true,

  -- Plantillas de mensaje (variables: {cliente}, {dispositivo}, {diagnostico}, {costo}, {folio}, {fecha})
  plantilla_diagnostico TEXT DEFAULT 'Hola {cliente}, tu {dispositivo} ha sido diagnosticado. Problema: {diagnostico}. Costo estimado: ${costo}. Por favor, confirma si deseas continuar con la reparación.',

  plantilla_presupuesto_pendiente TEXT DEFAULT 'Hola {cliente}, tu {dispositivo} (Folio: {folio}) tiene un presupuesto pendiente de aprobación por ${costo}. Por favor revisa el link de tracking para aprobar.',

  plantilla_presupuesto_aprobado TEXT DEFAULT 'Gracias por aprobar el presupuesto. Tu {dispositivo} (Folio: {folio}) entrará en reparación pronto.',

  plantilla_reparacion_completada TEXT DEFAULT 'Buenas noticias {cliente}, la reparación de tu {dispositivo} ha sido completada. En breve estará listo para entrega.',

  plantilla_listo TEXT DEFAULT '¡Tu {dispositivo} está listo para recoger! Folio: {folio}. Pasa cuando gustes por CREDIPHONE.',

  plantilla_recordatorio_garantia TEXT DEFAULT 'Hola {cliente}, te recordamos que la garantía de tu reparación (Folio: {folio}) vence el {fecha}. Si tienes algún problema, acude antes de esa fecha.',

  plantilla_escalacion_vendedor TEXT DEFAULT 'ALERTA: El cliente {cliente} no ha respondido al presupuesto del folio {folio} después de {horas} horas. Por favor, contacta directamente.',

  -- Auditoría
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO public.config_notificaciones_reparacion (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.config_notificaciones_reparacion IS 'Configuración global del sistema de notificaciones para reparaciones';

-- =====================================================
-- 2. FUNCIÓN: Escalación de Notificaciones
-- =====================================================

CREATE OR REPLACE FUNCTION escalacion_notificacion_reparacion()
RETURNS void AS $$
DECLARE
  orden RECORD;
  config RECORD;
  tracking_token TEXT;
  tracking_url TEXT;
BEGIN
  -- Obtener configuración
  SELECT * INTO config FROM public.config_notificaciones_reparacion LIMIT 1;

  -- Si no hay configuración, salir
  IF config IS NULL THEN
    RETURN;
  END IF;

  -- =====================================================
  -- CASO 1: Órdenes en "presupuesto" sin respuesta > X horas
  -- =====================================================
  FOR orden IN
    SELECT
      o.id as orden_id,
      o.folio,
      o.marca_dispositivo,
      o.modelo_dispositivo,
      o.costo_total,
      o.updated_at,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.whatsapp as cliente_whatsapp,
      u.name as vendedor_nombre,
      u.telefono as vendedor_telefono,
      u.id as vendedor_id
    FROM public.ordenes_reparacion o
    JOIN public.clientes c ON o.cliente_id = c.id
    LEFT JOIN public.users u ON o.creado_por = u.id
    WHERE o.estado = 'presupuesto'
      AND o.updated_at < NOW() - (config.horas_sin_respuesta_tecnico || ' hours')::INTERVAL
      AND NOT EXISTS (
        -- Verificar que no se haya enviado notificación de escalación en las últimas 24h
        SELECT 1 FROM public.notificaciones n
        WHERE n.cliente_id = o.cliente_id
          AND n.tipo = 'escalacion_vendedor'
          AND n.created_at > NOW() - INTERVAL '24 hours'
      )
  LOOP
    -- Crear notificación para el vendedor
    IF orden.vendedor_telefono IS NOT NULL THEN
      INSERT INTO public.notificaciones (
        cliente_id,
        tipo,
        canal,
        estado,
        mensaje,
        telefono,
        enviado_por
      ) VALUES (
        orden.cliente_id,
        'escalacion_vendedor',
        'whatsapp',
        'pendiente',
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                config.plantilla_escalacion_vendedor,
                '{cliente}', orden.cliente_nombre || ' ' || COALESCE(orden.cliente_apellido, '')
              ),
              '{folio}', orden.folio
            ),
            '{horas}', config.horas_sin_respuesta_tecnico::TEXT
          ),
          '{costo}', orden.costo_total::TEXT
        ),
        orden.vendedor_telefono,
        NULL
      );
    END IF;
  END LOOP;

  -- =====================================================
  -- CASO 2: Órdenes "listo_entrega" > X horas sin notificar
  -- =====================================================
  IF config.notificar_listo_entrega THEN
    FOR orden IN
      SELECT
        o.id as orden_id,
        o.folio,
        o.marca_dispositivo,
        o.modelo_dispositivo,
        o.updated_at,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.whatsapp as cliente_whatsapp,
        tt.token
      FROM public.ordenes_reparacion o
      JOIN public.clientes c ON o.cliente_id = c.id
      LEFT JOIN public.tracking_tokens tt ON o.id = tt.orden_id
      WHERE o.estado = 'listo_entrega'
        AND o.updated_at < NOW() - (config.horas_listo_sin_notificar || ' hours')::INTERVAL
        AND NOT EXISTS (
          -- Verificar que no se haya notificado ya
          SELECT 1 FROM public.notificaciones n
          WHERE n.cliente_id = o.cliente_id
            AND n.tipo = 'orden_lista'
            AND n.created_at > o.updated_at
        )
    LOOP
      -- Generar URL de tracking
      tracking_url := 'https://crediphone.com/tracking/' || orden.token;

      -- Crear notificación automática para el cliente
      IF orden.cliente_whatsapp IS NOT NULL THEN
        INSERT INTO public.notificaciones (
          cliente_id,
          tipo,
          canal,
          estado,
          mensaje,
          telefono
        ) VALUES (
          orden.cliente_id,
          'orden_lista',
          'whatsapp',
          'pendiente',
          REPLACE(
            REPLACE(
              REPLACE(
                config.plantilla_listo,
                '{cliente}', orden.cliente_nombre
              ),
              '{dispositivo}', orden.marca_dispositivo || ' ' || orden.modelo_dispositivo
            ),
            '{folio}', orden.folio
          ) || ' Tracking: ' || tracking_url,
          orden.cliente_whatsapp
        );
      END IF;
    END LOOP;
  END IF;

  -- =====================================================
  -- CASO 3: Recordatorio de garantía próxima a vencer
  -- =====================================================
  FOR orden IN
    SELECT
      g.id as garantia_id,
      g.fecha_vencimiento,
      o.folio,
      o.marca_dispositivo,
      o.modelo_dispositivo,
      c.id as cliente_id,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.whatsapp as cliente_whatsapp
    FROM public.garantias_reparacion g
    JOIN public.ordenes_reparacion o ON g.orden_id = o.id
    JOIN public.clientes c ON g.cliente_id = c.id
    WHERE g.estado = 'activa'
      AND g.fecha_vencimiento BETWEEN NOW() AND NOW() + (config.dias_recordatorio_garantia || ' days')::INTERVAL
      AND NOT EXISTS (
        -- No enviar recordatorio más de una vez
        SELECT 1 FROM public.notificaciones n
        WHERE n.cliente_id = c.id
          AND n.tipo = 'recordatorio_garantia'
          AND n.created_at > NOW() - INTERVAL '30 days'
      )
  LOOP
    IF orden.cliente_whatsapp IS NOT NULL THEN
      INSERT INTO public.notificaciones (
        cliente_id,
        tipo,
        canal,
        estado,
        mensaje,
        telefono
      ) VALUES (
        orden.cliente_id,
        'recordatorio_garantia',
        'whatsapp',
        'pendiente',
        REPLACE(
          REPLACE(
            REPLACE(
              config.plantilla_recordatorio_garantia,
              '{cliente}', orden.cliente_nombre
            ),
            '{folio}', orden.folio
          ),
          '{fecha}', TO_CHAR(orden.fecha_vencimiento, 'DD/MM/YYYY')
        ),
        orden.cliente_whatsapp
      );
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION escalacion_notificacion_reparacion IS 'Ejecutar cada hora para enviar notificaciones automáticas y escalar casos sin respuesta';

-- =====================================================
-- 3. FUNCIÓN: Notificar diagnóstico completado
-- =====================================================

CREATE OR REPLACE FUNCTION notificar_diagnostico_completado()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  cliente RECORD;
  tracking_token TEXT;
  tracking_url TEXT;
BEGIN
  -- Solo ejecutar si cambió de estado a 'presupuesto' o 'diagnostico'
  IF (OLD.estado != 'presupuesto' AND NEW.estado = 'presupuesto')
     OR (OLD.diagnostico_tecnico IS NULL AND NEW.diagnostico_tecnico IS NOT NULL) THEN

    -- Obtener configuración
    SELECT * INTO config FROM public.config_notificaciones_reparacion LIMIT 1;

    IF config IS NULL OR NOT config.notificar_diagnostico_completado THEN
      RETURN NEW;
    END IF;

    -- Obtener datos del cliente
    SELECT c.*, tt.token INTO cliente
    FROM public.clientes c
    LEFT JOIN public.tracking_tokens tt ON tt.orden_id = NEW.id
    WHERE c.id = NEW.cliente_id;

    IF cliente.whatsapp IS NULL THEN
      RETURN NEW;
    END IF;

    -- Generar URL de tracking
    tracking_url := 'https://crediphone.com/tracking/' || cliente.token;

    -- Crear notificación
    INSERT INTO public.notificaciones (
      cliente_id,
      tipo,
      canal,
      estado,
      mensaje,
      telefono
    ) VALUES (
      NEW.cliente_id,
      'diagnostico_completado',
      'whatsapp',
      'pendiente',
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              config.plantilla_diagnostico,
              '{cliente}', cliente.nombre
            ),
            '{dispositivo}', NEW.marca_dispositivo || ' ' || NEW.modelo_dispositivo
          ),
          '{diagnostico}', COALESCE(NEW.diagnostico_tecnico, 'Ver en tracking')
        ),
        '{costo}', NEW.costo_total::TEXT
      ) || ' Revisa aquí: ' || tracking_url,
      cliente.whatsapp
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_diagnostico
  AFTER UPDATE ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION notificar_diagnostico_completado();

-- =====================================================
-- 4. FUNCIÓN: Notificar presupuesto aprobado
-- =====================================================

CREATE OR REPLACE FUNCTION notificar_presupuesto_aprobado()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  cliente RECORD;
  tecnico RECORD;
BEGIN
  -- Solo ejecutar si cambió a 'aprobado'
  IF OLD.estado != 'aprobado' AND NEW.estado = 'aprobado' THEN

    -- Obtener configuración
    SELECT * INTO config FROM public.config_notificaciones_reparacion LIMIT 1;

    IF config IS NULL OR NOT config.notificar_presupuesto_aprobado THEN
      RETURN NEW;
    END IF;

    -- Obtener datos del cliente
    SELECT * INTO cliente FROM public.clientes WHERE id = NEW.cliente_id;

    -- Notificar al cliente
    IF cliente.whatsapp IS NOT NULL THEN
      INSERT INTO public.notificaciones (
        cliente_id,
        tipo,
        canal,
        estado,
        mensaje,
        telefono
      ) VALUES (
        NEW.cliente_id,
        'presupuesto_aprobado',
        'whatsapp',
        'pendiente',
        REPLACE(
          REPLACE(
            REPLACE(
              config.plantilla_presupuesto_aprobado,
              '{cliente}', cliente.nombre
            ),
            '{dispositivo}', NEW.marca_dispositivo || ' ' || NEW.modelo_dispositivo
          ),
          '{folio}', NEW.folio
        ),
        cliente.whatsapp
      );
    END IF;

    -- Notificar al técnico
    SELECT * INTO tecnico FROM public.users WHERE id = NEW.tecnico_id;

    IF tecnico.telefono IS NOT NULL THEN
      INSERT INTO public.notificaciones (
        cliente_id,
        tipo,
        canal,
        estado,
        mensaje,
        telefono
      ) VALUES (
        NEW.cliente_id,
        'presupuesto_aprobado_tecnico',
        'whatsapp',
        'pendiente',
        'El cliente ' || cliente.nombre || ' ' || COALESCE(cliente.apellido, '') ||
        ' aprobó el presupuesto del folio ' || NEW.folio || '. Puedes proceder con la reparación.',
        tecnico.telefono
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_presupuesto_aprobado
  AFTER UPDATE ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION notificar_presupuesto_aprobado();

-- =====================================================
-- 5. FUNCIÓN: Notificar reparación completada
-- =====================================================

CREATE OR REPLACE FUNCTION notificar_reparacion_completada()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  cliente RECORD;
  vendedor RECORD;
BEGIN
  -- Solo ejecutar si cambió a 'completado'
  IF OLD.estado != 'completado' AND NEW.estado = 'completado' THEN

    -- Obtener configuración
    SELECT * INTO config FROM public.config_notificaciones_reparacion LIMIT 1;

    IF config IS NULL OR NOT config.notificar_reparacion_completada THEN
      RETURN NEW;
    END IF;

    -- Obtener datos del cliente
    SELECT * INTO cliente FROM public.clientes WHERE id = NEW.cliente_id;

    -- Notificar al cliente
    IF cliente.whatsapp IS NOT NULL THEN
      INSERT INTO public.notificaciones (
        cliente_id,
        tipo,
        canal,
        estado,
        mensaje,
        telefono
      ) VALUES (
        NEW.cliente_id,
        'reparacion_completada',
        'whatsapp',
        'pendiente',
        REPLACE(
          REPLACE(
            config.plantilla_reparacion_completada,
            '{cliente}', cliente.nombre
          ),
          '{dispositivo}', NEW.marca_dispositivo || ' ' || NEW.modelo_dispositivo
        ),
        cliente.whatsapp
      );
    END IF;

    -- Notificar al vendedor que creó la orden
    IF NEW.creado_por IS NOT NULL THEN
      SELECT * INTO vendedor FROM public.users WHERE id = NEW.creado_por;

      IF vendedor.telefono IS NOT NULL THEN
        INSERT INTO public.notificaciones (
          cliente_id,
          tipo,
          canal,
          estado,
          mensaje,
          telefono
        ) VALUES (
          NEW.cliente_id,
          'reparacion_completada_vendedor',
          'whatsapp',
          'pendiente',
          'La reparación del folio ' || NEW.folio || ' (' || NEW.marca_dispositivo || ' ' || NEW.modelo_dispositivo ||
          ') ha sido completada. Prepara la entrega para ' || cliente.nombre || '.',
          vendedor.telefono
        );
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_reparacion_completada
  AFTER UPDATE ON public.ordenes_reparacion
  FOR EACH ROW
  EXECUTE FUNCTION notificar_reparacion_completada();

-- =====================================================
-- 6. RLS para config_notificaciones_reparacion
-- =====================================================

ALTER TABLE public.config_notificaciones_reparacion ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer configuración
CREATE POLICY "Usuarios autenticados pueden ver configuración"
  ON public.config_notificaciones_reparacion FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo admin puede modificar configuración
CREATE POLICY "Solo admin puede modificar configuración"
  ON public.config_notificaciones_reparacion FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FIN DE MIGRACIÓN - FASE 8 EXTRAS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migración Fase 8 Extras completada exitosamente';
  RAISE NOTICE 'Tabla creada: config_notificaciones_reparacion';
  RAISE NOTICE 'Sistema de notificaciones automáticas: ACTIVO';
  RAISE NOTICE 'Sistema de escalación: ACTIVO';
  RAISE NOTICE 'Para ejecutar escalación manualmente: SELECT escalacion_notificacion_reparacion();';
  RAISE NOTICE 'RECOMENDACIÓN: Configurar cron job para ejecutar escalacion_notificacion_reparacion() cada hora';
END $$;
