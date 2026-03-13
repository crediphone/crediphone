-- FASE 28: Notificaciones Push + Sonidos
-- Ejecutar en Supabase SQL Editor

-- 1. Columna sonidos_config en configuracion (una por distribuidor)
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS sonidos_config JSONB DEFAULT NULL;

-- 2. Tabla de suscripciones push (una por dispositivo/usuario)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distribuidor_id UUID REFERENCES distribuidores(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_distribuidor ON push_subscriptions(distribuidor_id);
