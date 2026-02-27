-- =====================================================
-- FASE 8: ACTUALIZAR TABLA NOTIFICACIONES
-- Extender para soportar notificaciones de reparaciones
-- =====================================================

-- 1. Hacer credito_id y cliente_id opcionales (nullable)
ALTER TABLE public.notificaciones
  ALTER COLUMN credito_id DROP NOT NULL,
  ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. Agregar columnas para reparaciones
ALTER TABLE public.notificaciones
  ADD COLUMN IF NOT EXISTS orden_reparacion_id UUID REFERENCES public.ordenes_reparacion(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS destinatario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS datos_adicionales JSONB DEFAULT '{}'::jsonb;

-- 3. Agregar índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_notificaciones_orden_reparacion ON public.notificaciones(orden_reparacion_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON public.notificaciones(destinatario_id);

-- 4. Actualizar el CHECK constraint de tipo para incluir tipos de reparaciones
ALTER TABLE public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

ALTER TABLE public.notificaciones
  ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN (
    -- Tipos de créditos (existentes)
    'proximo_vencer', 'vencido', 'mora_alta', 'pago_recibido',
    -- Tipos de reparaciones (nuevos)
    'cliente_aprobo', 'cliente_rechazo', 'orden_actualizada',
    'orden_completada', 'orden_lista_entrega'
  ));

-- 5. Actualizar el CHECK constraint de canal para incluir "sistema"
ALTER TABLE public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_canal_check;

ALTER TABLE public.notificaciones
  ADD CONSTRAINT notificaciones_canal_check
  CHECK (canal IN ('whatsapp', 'email', 'sms', 'llamada', 'visita', 'sistema'));

-- 6. Agregar constraint para validar que tenga al menos un ID de referencia
ALTER TABLE public.notificaciones
  ADD CONSTRAINT notificaciones_referencia_check
  CHECK (
    credito_id IS NOT NULL OR orden_reparacion_id IS NOT NULL
  );

-- 7. Comentarios actualizados
COMMENT ON TABLE public.notificaciones IS 'Historial de notificaciones para créditos y reparaciones';
COMMENT ON COLUMN public.notificaciones.credito_id IS 'ID del crédito (opcional, solo para notificaciones de créditos)';
COMMENT ON COLUMN public.notificaciones.cliente_id IS 'ID del cliente (opcional, usado principalmente en notificaciones de créditos)';
COMMENT ON COLUMN public.notificaciones.orden_reparacion_id IS 'ID de la orden de reparación (opcional, solo para notificaciones de reparaciones)';
COMMENT ON COLUMN public.notificaciones.destinatario_id IS 'ID del usuario destinatario (técnico, vendedor, admin)';
COMMENT ON COLUMN public.notificaciones.datos_adicionales IS 'Información adicional en formato JSON (folio, origen, etc.)';
COMMENT ON COLUMN public.notificaciones.tipo IS 'Tipo: créditos (proximo_vencer, vencido, mora_alta, pago_recibido) | reparaciones (cliente_aprobo, cliente_rechazo, orden_actualizada, orden_completada, orden_lista_entrega)';
COMMENT ON COLUMN public.notificaciones.canal IS 'Canal: whatsapp, email, sms, llamada, visita, sistema';

-- =====================================================
-- Verificación
-- =====================================================

-- Mostrar estructura actualizada
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notificaciones'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ TABLA NOTIFICACIONES ACTUALIZADA';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora soporta:';
  RAISE NOTICE '  ✅ Notificaciones de créditos (credito_id)';
  RAISE NOTICE '  ✅ Notificaciones de reparaciones (orden_reparacion_id)';
  RAISE NOTICE '  ✅ Destinatarios específicos (destinatario_id)';
  RAISE NOTICE '  ✅ Datos adicionales en JSON (datos_adicionales)';
  RAISE NOTICE '  ✅ Nuevos tipos: cliente_aprobo, cliente_rechazo';
  RAISE NOTICE '  ✅ Nuevo canal: sistema';
  RAISE NOTICE '';
END $$;
