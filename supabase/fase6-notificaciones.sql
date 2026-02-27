-- =====================================================
-- FASE 6: SISTEMA DE NOTIFICACIONES Y RECORDATORIOS
-- =====================================================
-- Fecha: 2026-02-07
-- Descripción: Tablas para gestión de recordatorios de pago
--             y seguimiento de notificaciones a clientes

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
-- Registra historial completo de notificaciones enviadas
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credito_id UUID NOT NULL REFERENCES public.creditos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,

  -- Tipo de notificación
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('proximo_vencer', 'vencido', 'mora_alta', 'pago_recibido')),

  -- Canal de comunicación
  canal VARCHAR(20) NOT NULL CHECK (canal IN ('whatsapp', 'email', 'sms', 'llamada', 'visita')),

  -- Estado de la notificación
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'entregado', 'fallido', 'respondido')),

  -- Contenido
  mensaje TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),

  -- Metadata de seguimiento
  enviado_por UUID REFERENCES public.users(id),
  fecha_programada TIMESTAMP WITH TIME ZONE,
  fecha_enviado TIMESTAMP WITH TIME ZONE,
  fecha_leido TIMESTAMP WITH TIME ZONE,
  respuesta TEXT, -- Notas del cobrador sobre respuesta del cliente

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_notificaciones_credito ON public.notificaciones(credito_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente ON public.notificaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON public.notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_programada ON public.notificaciones(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_canal ON public.notificaciones(canal);

-- Comentarios
COMMENT ON TABLE public.notificaciones IS 'Historial de notificaciones y recordatorios enviados a clientes';
COMMENT ON COLUMN public.notificaciones.tipo IS 'Tipo: proximo_vencer, vencido, mora_alta, pago_recibido';
COMMENT ON COLUMN public.notificaciones.canal IS 'Canal: whatsapp, email, sms, llamada, visita';
COMMENT ON COLUMN public.notificaciones.estado IS 'Estado: pendiente, enviado, entregado, fallido, respondido';
COMMENT ON COLUMN public.notificaciones.respuesta IS 'Notas del cobrador sobre la respuesta del cliente';

-- =====================================================
-- TABLA: notificacion_preferencias
-- =====================================================
-- Preferencias de notificación por cliente (para uso futuro)
CREATE TABLE IF NOT EXISTS public.notificacion_preferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE UNIQUE,

  -- Canales habilitados
  whatsapp_habilitado BOOLEAN DEFAULT TRUE,
  email_habilitado BOOLEAN DEFAULT TRUE,
  sms_habilitado BOOLEAN DEFAULT FALSE,

  -- Configuración de recordatorios
  dias_anticipacion INTEGER DEFAULT 3 CHECK (dias_anticipacion >= 0 AND dias_anticipacion <= 30),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda por cliente
CREATE INDEX IF NOT EXISTS idx_notif_pref_cliente ON public.notificacion_preferencias(cliente_id);

-- Comentarios
COMMENT ON TABLE public.notificacion_preferencias IS 'Preferencias de notificación por cliente';
COMMENT ON COLUMN public.notificacion_preferencias.dias_anticipacion IS 'Días antes de vencimiento para enviar recordatorio';

-- =====================================================
-- AGREGAR CAMPO WHATSAPP A CLIENTES
-- =====================================================
-- Campo para número de WhatsApp (puede diferir del teléfono principal)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

COMMENT ON COLUMN public.clientes.whatsapp IS 'Número de WhatsApp (puede diferir del teléfono principal)';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at en notificaciones
CREATE OR REPLACE FUNCTION update_notificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notificaciones_updated_at ON public.notificaciones;
CREATE TRIGGER trigger_update_notificaciones_updated_at
  BEFORE UPDATE ON public.notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_notificaciones_updated_at();

-- Trigger para updated_at en notificacion_preferencias
CREATE OR REPLACE FUNCTION update_notif_pref_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notif_pref_updated_at ON public.notificacion_preferencias;
CREATE TRIGGER trigger_update_notif_pref_updated_at
  BEFORE UPDATE ON public.notificacion_preferencias
  FOR EACH ROW
  EXECUTE FUNCTION update_notif_pref_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacion_preferencias ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: notificaciones
-- =====================================================

-- Policy: Usuarios autenticados pueden ver todas las notificaciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios autenticados pueden ver notificaciones"
  ON public.notificaciones FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden crear notificaciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios autenticados pueden crear notificaciones"
  ON public.notificaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Usuarios autenticados pueden actualizar notificaciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios autenticados pueden actualizar notificaciones"
  ON public.notificaciones FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden eliminar notificaciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios autenticados pueden eliminar notificaciones"
  ON public.notificaciones FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: notificacion_preferencias
-- =====================================================

-- Policy: Usuarios autenticados pueden ver preferencias
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver preferencias" ON public.notificacion_preferencias;
CREATE POLICY "Usuarios autenticados pueden ver preferencias"
  ON public.notificacion_preferencias FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden crear preferencias
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear preferencias" ON public.notificacion_preferencias;
CREATE POLICY "Usuarios autenticados pueden crear preferencias"
  ON public.notificacion_preferencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Usuarios autenticados pueden actualizar preferencias
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar preferencias" ON public.notificacion_preferencias;
CREATE POLICY "Usuarios autenticados pueden actualizar preferencias"
  ON public.notificacion_preferencias FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar preferencias por defecto para clientes existentes (opcional)
-- INSERT INTO public.notificacion_preferencias (cliente_id)
-- SELECT id FROM public.clientes
-- WHERE id NOT IN (SELECT cliente_id FROM public.notificacion_preferencias);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
