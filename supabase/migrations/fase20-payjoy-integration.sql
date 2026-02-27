-- =====================================================
-- FASE 20: INTEGRACIÓN CON PAYJOY
-- =====================================================
-- Descripción: Integra Payjoy (plataforma de financiamiento) con CREDIPHONE
-- Incluye: Webhooks, sincronización de pagos, auditoría, comisiones
-- Fecha: 2026-02-14
-- =====================================================

-- =====================================================
-- 1. MODIFICAR TABLA CREDITOS - Agregar campos Payjoy
-- =====================================================

ALTER TABLE creditos
ADD COLUMN IF NOT EXISTS payjoy_finance_order_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payjoy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payjoy_sync_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payjoy_last_sync_at TIMESTAMP WITH TIME ZONE;

-- Índice para búsquedas rápidas por finance_order_id
CREATE INDEX IF NOT EXISTS idx_creditos_payjoy_finance_order_id
ON creditos(payjoy_finance_order_id)
WHERE payjoy_finance_order_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN creditos.payjoy_finance_order_id IS 'ID de orden de financiamiento en Payjoy';
COMMENT ON COLUMN creditos.payjoy_customer_id IS 'ID de cliente en Payjoy';
COMMENT ON COLUMN creditos.payjoy_sync_enabled IS 'Si está habilitada la sincronización automática con Payjoy';
COMMENT ON COLUMN creditos.payjoy_last_sync_at IS 'Última sincronización de pagos con Payjoy';

-- =====================================================
-- 2. MODIFICAR TABLA PAGOS - Extender método de pago y agregar campos Payjoy
-- =====================================================

-- Agregar 'payjoy' al constraint de método de pago
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_metodo_pago_check;
ALTER TABLE pagos
ADD CONSTRAINT pagos_metodo_pago_check
CHECK (metodo_pago IN ('efectivo', 'transferencia', 'deposito', 'mixto', 'payjoy'));

-- Agregar nuevos campos para pagos de Payjoy
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS payjoy_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payjoy_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payjoy_payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payjoy_customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS payjoy_webhook_id UUID;

-- Índice para idempotencia
CREATE INDEX IF NOT EXISTS idx_pagos_payjoy_transaction_id
ON pagos(payjoy_transaction_id)
WHERE payjoy_transaction_id IS NOT NULL;

-- Índice para búsquedas por webhook
CREATE INDEX IF NOT EXISTS idx_pagos_payjoy_webhook_id
ON pagos(payjoy_webhook_id)
WHERE payjoy_webhook_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN pagos.payjoy_transaction_id IS 'ID único de transacción en Payjoy (para idempotencia)';
COMMENT ON COLUMN pagos.payjoy_payment_date IS 'Fecha original del pago en Payjoy';
COMMENT ON COLUMN pagos.payjoy_payment_method IS 'Método usado en Payjoy: cash, card, transfer, mixed';
COMMENT ON COLUMN pagos.payjoy_customer_name IS 'Nombre del cliente desde webhook de Payjoy';
COMMENT ON COLUMN pagos.payjoy_webhook_id IS 'Referencia al webhook que creó este pago';

-- =====================================================
-- 3. MODIFICAR TABLA CONFIGURACION - Agregar settings Payjoy y comisiones
-- =====================================================

-- Configuración de Payjoy
ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS payjoy_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payjoy_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS payjoy_auto_sync_payments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS payjoy_last_connection_test TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payjoy_connection_status TEXT;

-- Configuración de comisiones
ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS comision_tipo VARCHAR(20) DEFAULT 'porcentaje'
  CHECK (comision_tipo IN ('fijo', 'porcentaje')),
ADD COLUMN IF NOT EXISTS comision_monto_fijo DECIMAL(10,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS comision_porcentaje_venta DECIMAL(5,2) DEFAULT 1.00;

-- Comentarios Payjoy
COMMENT ON COLUMN configuracion.payjoy_enabled IS 'Si está habilitada la integración con Payjoy';
COMMENT ON COLUMN configuracion.payjoy_webhook_url IS 'URL del webhook registrada en Payjoy';
COMMENT ON COLUMN configuracion.payjoy_auto_sync_payments IS 'Si los pagos se sincronizan automáticamente';
COMMENT ON COLUMN configuracion.payjoy_last_connection_test IS 'Última prueba de conexión con API de Payjoy';
COMMENT ON COLUMN configuracion.payjoy_connection_status IS 'Estado de la última conexión (Conectado/Error)';

-- Comentarios comisiones
COMMENT ON COLUMN configuracion.comision_tipo IS 'Tipo de comisión: fijo (monto por equipo) o porcentaje (% del monto)';
COMMENT ON COLUMN configuracion.comision_monto_fijo IS 'Monto fijo por equipo vendido (ej: $100)';
COMMENT ON COLUMN configuracion.comision_porcentaje_venta IS 'Porcentaje sobre monto de venta (ej: 1%)';

-- =====================================================
-- 4. CREAR TABLA PAYJOY_WEBHOOKS - Auditoría de webhooks
-- =====================================================

CREATE TABLE IF NOT EXISTS payjoy_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos del evento
  event_type VARCHAR(50) NOT NULL,
  finance_order_id TEXT,
  customer_id TEXT,
  transaction_id TEXT,
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'MXN',
  payment_date TIMESTAMP WITH TIME ZONE,

  -- Payload completo y validación
  raw_payload JSONB NOT NULL,
  signature TEXT,
  ip_address TEXT,

  -- Estado de procesamiento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Referencias
  pago_id UUID REFERENCES pagos(id) ON DELETE SET NULL,
  credito_id UUID REFERENCES creditos(id) ON DELETE SET NULL,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraint para idempotencia
  CONSTRAINT unique_payjoy_transaction_id UNIQUE(transaction_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_payjoy_webhooks_finance_order_id
ON payjoy_webhooks(finance_order_id)
WHERE finance_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payjoy_webhooks_transaction_id
ON payjoy_webhooks(transaction_id)
WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payjoy_webhooks_processed
ON payjoy_webhooks(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_payjoy_webhooks_credito_id
ON payjoy_webhooks(credito_id)
WHERE credito_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE payjoy_webhooks IS 'Auditoría completa de webhooks recibidos de Payjoy';
COMMENT ON COLUMN payjoy_webhooks.event_type IS 'Tipo de evento: payment.received, order.completed, etc.';
COMMENT ON COLUMN payjoy_webhooks.raw_payload IS 'Payload completo del webhook en formato JSON';
COMMENT ON COLUMN payjoy_webhooks.signature IS 'Firma HMAC-SHA256 para validación';
COMMENT ON COLUMN payjoy_webhooks.processed IS 'Si el webhook ha sido procesado correctamente';
COMMENT ON COLUMN payjoy_webhooks.error_message IS 'Mensaje de error si falló el procesamiento';

-- =====================================================
-- 5. CREAR TABLA PAYJOY_API_LOGS - Logs de llamadas API
-- =====================================================

CREATE TABLE IF NOT EXISTS payjoy_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos de la request
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_payload JSONB,

  -- Datos de la response
  response_status INT,
  response_body JSONB,
  error_message TEXT,
  duration_ms INT,

  -- Referencias
  credito_id UUID REFERENCES creditos(id) ON DELETE SET NULL,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payjoy_api_logs_credito_id
ON payjoy_api_logs(credito_id)
WHERE credito_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payjoy_api_logs_created_at
ON payjoy_api_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payjoy_api_logs_endpoint
ON payjoy_api_logs(endpoint, created_at DESC);

-- Comentarios
COMMENT ON TABLE payjoy_api_logs IS 'Registro de todas las llamadas salientes a la API de Payjoy';
COMMENT ON COLUMN payjoy_api_logs.duration_ms IS 'Duración de la llamada en milisegundos';

-- =====================================================
-- 6. CREAR TRIGGER - Auto-actualizar estado de crédito
-- =====================================================

-- Función que verifica si el crédito está pagado completamente
CREATE OR REPLACE FUNCTION check_credito_paid_status()
RETURNS TRIGGER AS $$
DECLARE
  v_credito_id UUID;
  v_monto_credito DECIMAL(10,2);
  v_total_pagado DECIMAL(10,2);
BEGIN
  -- Solo procesar si es un pago de Payjoy
  IF NEW.metodo_pago = 'payjoy' AND NEW.credito_id IS NOT NULL THEN
    v_credito_id := NEW.credito_id;

    -- Obtener monto del crédito
    SELECT monto INTO v_monto_credito
    FROM creditos
    WHERE id = v_credito_id;

    -- Calcular total pagado (todos los métodos, no solo Payjoy)
    SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
    FROM pagos
    WHERE credito_id = v_credito_id;

    -- Si el total pagado >= monto del crédito, marcar como pagado
    IF v_total_pagado >= v_monto_credito THEN
      UPDATE creditos
      SET
        estado = 'pagado',
        payjoy_last_sync_at = now()
      WHERE id = v_credito_id;

      RAISE NOTICE 'Crédito % marcado como pagado. Total pagado: % >= Monto: %',
        v_credito_id, v_total_pagado, v_monto_credito;
    ELSE
      -- Solo actualizar última sincronización
      UPDATE creditos
      SET payjoy_last_sync_at = now()
      WHERE id = v_credito_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_check_credito_paid ON pagos;
CREATE TRIGGER trigger_check_credito_paid
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION check_credito_paid_status();

-- Comentarios
COMMENT ON FUNCTION check_credito_paid_status() IS 'Actualiza automáticamente el estado del crédito cuando se recibe un pago de Payjoy';

-- =====================================================
-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE payjoy_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payjoy_api_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para payjoy_webhooks (solo admin puede ver)
CREATE POLICY "Admin puede ver webhooks"
  ON payjoy_webhooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin puede insertar webhooks"
  ON payjoy_webhooks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas para payjoy_api_logs (solo admin puede ver)
CREATE POLICY "Admin puede ver API logs"
  ON payjoy_api_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin puede insertar API logs"
  ON payjoy_api_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 8. MIGRACIÓN DE DATOS (si es necesario)
-- =====================================================

-- Inicializar campos en configuración existente
UPDATE configuracion
SET
  payjoy_enabled = FALSE,
  payjoy_auto_sync_payments = TRUE,
  comision_tipo = 'porcentaje',
  comision_monto_fijo = 100.00,
  comision_porcentaje_venta = 1.00
WHERE id IS NOT NULL
AND payjoy_enabled IS NULL;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ FASE 20 - Payjoy Integration Migration completada';
  RAISE NOTICE '  - Campos Payjoy agregados a: creditos, pagos, configuracion';
  RAISE NOTICE '  - Tablas creadas: payjoy_webhooks, payjoy_api_logs';
  RAISE NOTICE '  - Trigger creado: check_credito_paid_status';
  RAISE NOTICE '  - RLS habilitado en nuevas tablas';
  RAISE NOTICE '  - Campos de comisiones agregados a configuracion';
END $$;
