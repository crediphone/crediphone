-- FASE 63: Extiende traspasos_anticipo para soportar cualquier rol como creador
-- (antes solo técnicos, ahora admin/vendedor/super_admin sin sesión de caja también)

-- 1. Agregar columna creador_rol (indica quién tiene el dinero: técnico, admin, vendedor, etc.)
ALTER TABLE public.traspasos_anticipo
  ADD COLUMN IF NOT EXISTS creador_rol TEXT NOT NULL DEFAULT 'tecnico'
  CHECK (creador_rol IN ('tecnico','admin','vendedor','super_admin','cobrador'));

-- 2. Columna normal para fecha límite de entrega (calculada al insertar en la app)
ALTER TABLE public.traspasos_anticipo
  ADD COLUMN IF NOT EXISTS fecha_limite_entrega TIMESTAMPTZ;

-- 3. Índice para filtrar por rol en queries de dashboard
CREATE INDEX IF NOT EXISTS idx_traspasos_creador_rol
  ON public.traspasos_anticipo(creador_rol);

-- 4. Índice para alertas en tiempo real (estado + distribuidor + creado reciente)
CREATE INDEX IF NOT EXISTS idx_traspasos_estado_distribuidor
  ON public.traspasos_anticipo(estado, distribuidor_id, created_at DESC);

COMMENT ON COLUMN public.traspasos_anticipo.creador_rol IS
  'Rol del usuario que tiene el dinero (técnico, admin, vendedor, etc.)';

COMMENT ON COLUMN public.traspasos_anticipo.fecha_limite_entrega IS
  'SLA manual: 4 horas desde creación. La app calcula y guarda este valor al crear el traspaso.';
