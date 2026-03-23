-- FASE 65: QR Bridge para POS
-- Tabla de sesiones de escaneo móvil → PC.
-- El cajero genera un QR desde la PC, el empleado escanea con el celular,
-- el celular escanea códigos de barras y los empuja a esta tabla,
-- la PC hace polling y agrega los productos al carrito.

CREATE TABLE IF NOT EXISTS pos_scan_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        NOT NULL UNIQUE,                -- token corto (12 chars) para la URL del móvil
  distribuidor_id UUID      REFERENCES distribuidores(id) ON DELETE CASCADE,
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  codigos       TEXT[]      NOT NULL DEFAULT '{}',          -- array de códigos escaneados (barras / QR)
  activa        BOOLEAN     NOT NULL DEFAULT true,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar por token (lookup frecuente)
CREATE INDEX IF NOT EXISTS idx_pos_scan_sessions_token    ON pos_scan_sessions(token);
-- Índice para limpiar sesiones vencidas (job o trigger)
CREATE INDEX IF NOT EXISTS idx_pos_scan_sessions_expires  ON pos_scan_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pos_scan_sessions_dist     ON pos_scan_sessions(distribuidor_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pos_scan_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pos_scan_sessions_updated_at
  BEFORE UPDATE ON pos_scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_pos_scan_session_timestamp();
