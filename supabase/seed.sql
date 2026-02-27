-- CREDIPHONE - Datos de Ejemplo (Seed)
-- IMPORTANTE: Ejecutar este script DESPUÉS de crear el esquema
-- Este script inserta datos de ejemplo para pruebas

-- Insertar productos de ejemplo
INSERT INTO public.productos (nombre, marca, modelo, precio, stock, descripcion) VALUES
('iPhone 15 Pro', 'Apple', '256GB', 25999.00, 10, 'iPhone 15 Pro con 256GB de almacenamiento'),
('Samsung Galaxy S24', 'Samsung', '256GB', 19999.00, 15, 'Samsung Galaxy S24 con 256GB'),
('Xiaomi Redmi Note 13', 'Xiaomi', '128GB', 5999.00, 25, 'Xiaomi Redmi Note 13 con 128GB'),
('Motorola Edge 40', 'Motorola', '256GB', 8999.00, 12, 'Motorola Edge 40 con 256GB'),
('iPhone 14', 'Apple', '128GB', 17999.00, 8, 'iPhone 14 con 128GB de almacenamiento'),
('Samsung Galaxy A54', 'Samsung', '128GB', 8499.00, 20, 'Samsung Galaxy A54 con 128GB'),
('OPPO Reno 11', 'OPPO', '256GB', 9999.00, 10, 'OPPO Reno 11 con 256GB'),
('OnePlus Nord 3', 'OnePlus', '256GB', 10999.00, 8, 'OnePlus Nord 3 con 256GB');

-- Insertar clientes de ejemplo
INSERT INTO public.clientes (nombre, apellido, telefono, email, direccion, curp, ine) VALUES
('Juan', 'Pérez García', '5512345678', 'juan.perez@example.com', 'Calle Principal 123, Col. Centro', 'PEGJ850101HDFRXN01', 'INE123456789'),
('María', 'López Martínez', '5523456789', 'maria.lopez@example.com', 'Av. Reforma 456, Col. Juárez', 'LOMM900215MDFLPR02', 'INE234567890'),
('Carlos', 'Sánchez Ramírez', '5534567890', 'carlos.sanchez@example.com', 'Calle Norte 789, Col. Roma', 'SARC880320HDFMRL03', 'INE345678901'),
('Ana', 'Hernández Torres', '5545678901', 'ana.hernandez@example.com', 'Av. Sur 321, Col. Condesa', 'HETA950705MDFRRN04', 'INE456789012'),
('Roberto', 'González Flores', '5556789012', 'roberto.gonzalez@example.com', 'Calle Poniente 654, Col. Polanco', 'GOFR870912HDFLBR05', 'INE567890123');

-- Nota: Los siguientes inserts requieren que primero crees usuarios en Supabase Auth
-- Para crear usuarios, ve a Authentication > Users en el dashboard de Supabase
-- Después, ejecuta estos inserts reemplazando los UUIDs con los IDs reales de los usuarios

-- Ejemplo de cómo insertar en la tabla users una vez que tengas usuarios auth:
-- INSERT INTO public.users (id, email, name, role) VALUES
-- ('uuid-del-usuario-auth', 'admin@crediphone.com', 'Administrador', 'admin');

-- DESCOMENTAR SOLO DESPUÉS DE CREAR USUARIOS EN AUTH
-- Ejemplo de créditos (reemplazar vendedor_id con UUID real)
-- INSERT INTO public.creditos (cliente_id, producto_id, monto, plazo, tasa_interes, pago_quincenal, fecha_fin, estado, vendedor_id)
-- SELECT
--   (SELECT id FROM public.clientes WHERE nombre = 'Juan' LIMIT 1),
--   (SELECT id FROM public.productos WHERE nombre = 'iPhone 15 Pro' LIMIT 1),
--   25999.00,
--   12,
--   15.00,
--   2380.00,
--   CURRENT_DATE + INTERVAL '12 months',
--   'activo',
--   'TU-UUID-DE-VENDEDOR-AQUI';

-- Verificar que los datos se insertaron correctamente
SELECT 'Productos insertados:', COUNT(*) FROM public.productos;
SELECT 'Clientes insertados:', COUNT(*) FROM public.clientes;
