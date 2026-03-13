-- FASE 30: Bitácora de tiempo para técnicos
-- Cada fila representa una sesión de trabajo (inicio → fin) en una orden de reparación

CREATE TABLE IF NOT EXISTS reparacion_tiempo_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES reparaciones(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distribuidor_id UUID REFERENCES distribuidores(id) ON DELETE CASCADE,
  inicio_trabajo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fin_trabajo TIMESTAMP WITH TIME ZONE,           -- NULL mientras la sesión está activa
  duracion_minutos INTEGER,                        -- calculado al cerrar la sesión
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tiempo_logs_orden ON reparacion_tiempo_logs(orden_id);
CREATE INDEX IF NOT EXISTS idx_tiempo_logs_tecnico ON reparacion_tiempo_logs(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_tiempo_logs_distribuidor ON reparacion_tiempo_logs(distribuidor_id);
CREATE INDEX IF NOT EXISTS idx_tiempo_logs_activo ON reparacion_tiempo_logs(orden_id, tecnico_id) WHERE fin_trabajo IS NULL;

-- Constraint: solo una sesión activa por técnico a la vez (en toda la plataforma)
-- Se valida en aplicación, no a nivel DB para mayor flexibilidad
