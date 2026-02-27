-- CREDIPHONE - Schema de Base de Datos
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios (extendiendo la tabla auth.users de Supabase)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'cobrador')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Clientes
CREATE TABLE public.clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  direccion TEXT NOT NULL,
  curp TEXT NOT NULL UNIQUE,
  ine TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Productos
CREATE TABLE public.productos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Créditos
CREATE TABLE public.creditos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id),
  monto DECIMAL(10, 2) NOT NULL,
  plazo INTEGER NOT NULL, -- meses
  tasa_interes DECIMAL(5, 2) NOT NULL, -- porcentaje
  pago_quincenal DECIMAL(10, 2) NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'pagado', 'vencido', 'cancelado')),
  vendedor_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Pagos
CREATE TABLE public.pagos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  credito_id UUID NOT NULL REFERENCES public.creditos(id) ON DELETE CASCADE,
  monto DECIMAL(10, 2) NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'deposito')),
  referencia TEXT,
  cobrador_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_clientes_curp ON public.clientes(curp);
CREATE INDEX idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX idx_creditos_cliente ON public.creditos(cliente_id);
CREATE INDEX idx_creditos_estado ON public.creditos(estado);
CREATE INDEX idx_creditos_vendedor ON public.creditos(vendedor_id);
CREATE INDEX idx_pagos_credito ON public.pagos(credito_id);
CREATE INDEX idx_pagos_fecha ON public.pagos(fecha_pago);
CREATE INDEX idx_pagos_cobrador ON public.pagos(cobrador_id);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creditos_updated_at
  BEFORE UPDATE ON public.creditos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (RLS Policies)

-- Users: Solo pueden ver y actualizar su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Clientes: Todos los usuarios autenticados pueden ver y gestionar
CREATE POLICY "Usuarios autenticados pueden ver clientes"
  ON public.clientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar clientes"
  ON public.clientes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Productos: Todos pueden ver, solo autenticados pueden modificar
CREATE POLICY "Todos pueden ver productos"
  ON public.productos FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar productos"
  ON public.productos FOR ALL
  USING (auth.role() = 'authenticated');

-- Créditos: Los usuarios pueden ver los créditos que gestionan
CREATE POLICY "Usuarios pueden ver créditos relacionados"
  ON public.creditos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Vendedores pueden crear créditos"
  ON public.creditos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar créditos"
  ON public.creditos FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Pagos: Los cobradores pueden ver y registrar pagos
CREATE POLICY "Usuarios pueden ver pagos"
  ON public.pagos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden registrar pagos"
  ON public.pagos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Vistas útiles para reportes

-- Vista de créditos con información del cliente
CREATE OR REPLACE VIEW public.creditos_con_cliente AS
SELECT
  c.id,
  c.monto,
  c.plazo,
  c.tasa_interes,
  c.pago_quincenal,
  c.fecha_inicio,
  c.fecha_fin,
  c.estado,
  cl.nombre || ' ' || cl.apellido AS cliente_nombre,
  cl.telefono AS cliente_telefono,
  u.name AS vendedor_nombre,
  c.created_at
FROM public.creditos c
JOIN public.clientes cl ON c.cliente_id = cl.id
JOIN public.users u ON c.vendedor_id = u.id;

-- Vista de pagos con información de crédito y cliente
CREATE OR REPLACE VIEW public.pagos_detallados AS
SELECT
  p.id,
  p.monto,
  p.fecha_pago,
  p.metodo_pago,
  p.referencia,
  c.monto AS credito_monto,
  c.estado AS credito_estado,
  cl.nombre || ' ' || cl.apellido AS cliente_nombre,
  u.name AS cobrador_nombre,
  p.created_at
FROM public.pagos p
JOIN public.creditos c ON p.credito_id = c.id
JOIN public.clientes cl ON c.cliente_id = cl.id
JOIN public.users u ON p.cobrador_id = u.id;

-- Función para calcular el total pagado de un crédito
CREATE OR REPLACE FUNCTION public.total_pagado(credito_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
  SELECT COALESCE(SUM(monto), 0)
  FROM public.pagos
  WHERE credito_id = credito_uuid;
$$ LANGUAGE SQL STABLE;

-- Función para calcular el saldo pendiente de un crédito
CREATE OR REPLACE FUNCTION public.saldo_pendiente(credito_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
  SELECT c.monto - public.total_pagado(credito_uuid)
  FROM public.creditos c
  WHERE c.id = credito_uuid;
$$ LANGUAGE SQL STABLE;
