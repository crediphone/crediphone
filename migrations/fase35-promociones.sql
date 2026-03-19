-- FASE 35: Tabla de promociones
CREATE TABLE IF NOT EXISTS promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribuidor_id UUID REFERENCES distribuidores(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  precio_normal DECIMAL(10,2),
  precio_promocion DECIMAL(10,2),
  categoria VARCHAR(50) DEFAULT 'general', -- 'accesorios' | 'combos' | 'celulares' | 'servicios' | 'general'
  activa BOOLEAN DEFAULT true,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campos de consentimiento presencial en clientes (si no existen)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS acepta_notificaciones_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS acepta_promociones_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS preferencias_promociones JSONB DEFAULT '{}';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_consentimiento TIMESTAMPTZ;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS consentimiento_canal VARCHAR(20) DEFAULT 'digital';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS consentimiento_fecha TIMESTAMPTZ;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS consentimiento_empleado_id UUID REFERENCES users(id);
