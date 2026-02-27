# Configuración de Supabase para CREDIPHONE

## Estado Actual

✅ Cliente de Supabase configurado
✅ Variables de entorno agregadas
✅ Middleware de autenticación implementado
✅ Scripts SQL creados
✅ Utilidades de consultas implementadas

## Próximos Pasos

### 1. Ejecutar el Schema SQL en Supabase

1. Ve a tu proyecto en Supabase: https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp
2. En el menú lateral, selecciona **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de [supabase/schema.sql](supabase/schema.sql)
5. Ejecuta el script (botón "Run" o Ctrl+Enter)

Esto creará:
- ✅ Tabla `users` (perfiles de usuario)
- ✅ Tabla `clientes` (clientes del sistema)
- ✅ Tabla `productos` (inventario de teléfonos)
- ✅ Tabla `creditos` (créditos otorgados)
- ✅ Tabla `pagos` (registro de pagos)
- ✅ Índices para optimizar consultas
- ✅ Triggers para actualizar `updated_at`
- ✅ Row Level Security (RLS) policies
- ✅ Vistas útiles para reportes
- ✅ Funciones para cálculos (total_pagado, saldo_pendiente)

### 2. Insertar Datos de Ejemplo (Opcional)

Si quieres tener datos de prueba:

1. En el **SQL Editor** de Supabase
2. Copia y pega el contenido de [supabase/seed.sql](supabase/seed.sql)
3. Ejecuta el script

Esto insertará:
- 8 productos de ejemplo (teléfonos)
- 5 clientes de ejemplo

**Nota:** Para insertar créditos y pagos de ejemplo, primero necesitas crear usuarios en Authentication.

### 3. Crear el Primer Usuario Administrador

#### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. Ve a **Authentication** > **Users**
2. Click en **Add User**
3. Ingresa:
   - Email: `admin@crediphone.com`
   - Password: (tu contraseña segura)
   - Auto Confirm User: ✅ (activado)
4. Click en **Create User**
5. Copia el UUID del usuario que se generó
6. Ve al **SQL Editor** y ejecuta:

```sql
INSERT INTO public.users (id, email, name, role) VALUES
('TU-UUID-AQUI', 'admin@crediphone.com', 'Administrador', 'admin');
```

#### Opción B: Mediante API

Usa el endpoint de registro en `/app/auth/signup` (una vez implementado).

### 4. Configurar Autenticación (Opcional pero Recomendado)

Para implementar login/registro completo:

```bash
cd crediphone
npm install @supabase/auth-helpers-nextjs
```

Luego crea las páginas:
- `/app/auth/login/page.tsx` - Página de login
- `/app/auth/signup/page.tsx` - Página de registro
- `/app/auth/callback/route.ts` - Callback de autenticación

### 5. Verificar la Configuración

Puedes verificar que todo funciona correctamente:

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Las tablas deben estar visibles en:
   - **Table Editor** de Supabase
   - Cada tabla debe tener datos si ejecutaste el seed

3. Puedes probar consultas directamente en el SQL Editor:

```sql
-- Ver todos los productos
SELECT * FROM public.productos;

-- Ver todos los clientes
SELECT * FROM public.clientes;

-- Ver la vista de créditos con cliente
SELECT * FROM public.creditos_con_cliente;
```

## Estructura de Archivos Creados

### Configuración de Supabase
```
src/lib/supabase/
├── client.ts       # Cliente para componentes del cliente
├── server.ts       # Cliente para componentes del servidor
└── middleware.ts   # Middleware para autenticación
```

### Utilidades de Base de Datos
```
src/lib/db/
├── clientes.ts     # CRUD de clientes
├── creditos.ts     # CRUD de créditos
├── pagos.ts        # CRUD de pagos
└── productos.ts    # CRUD de productos
```

### Scripts SQL
```
supabase/
├── schema.sql      # Esquema completo de la base de datos
└── seed.sql        # Datos de ejemplo
```

## Funciones Disponibles

### Clientes
- `getClientes()` - Obtener todos los clientes
- `getClienteById(id)` - Obtener un cliente por ID
- `createCliente(cliente)` - Crear nuevo cliente
- `updateCliente(id, cliente)` - Actualizar cliente
- `deleteCliente(id)` - Eliminar cliente
- `searchClientes(query)` - Buscar clientes

### Créditos
- `getCreditos()` - Obtener todos los créditos
- `getCreditoById(id)` - Obtener un crédito por ID
- `getCreditosByCliente(clienteId)` - Créditos de un cliente
- `getCreditosActivos()` - Solo créditos activos
- `createCredito(credito)` - Crear nuevo crédito
- `updateCredito(id, credito)` - Actualizar crédito
- `calcularTotalPagado(creditoId)` - Total pagado de un crédito
- `calcularSaldoPendiente(creditoId)` - Saldo pendiente

### Pagos
- `getPagos()` - Obtener todos los pagos
- `getPagosByCredito(creditoId)` - Pagos de un crédito
- `getPagosDelDia()` - Pagos de hoy
- `getTotalPagosDelDia()` - Total cobrado hoy
- `createPago(pago)` - Registrar nuevo pago

### Productos
- `getProductos()` - Obtener todos los productos
- `getProductoById(id)` - Obtener un producto por ID
- `getProductosEnStock()` - Solo productos disponibles
- `createProducto(producto)` - Crear nuevo producto
- `updateProducto(id, producto)` - Actualizar producto
- `deleteProducto(id)` - Eliminar producto
- `searchProductos(query)` - Buscar productos

## Ejemplo de Uso

### En un Server Component

```typescript
import { getClientes } from "@/lib/db/clientes";
import { getProductos } from "@/lib/db/productos";

export default async function DashboardPage() {
  const clientes = await getClientes();
  const productos = await getProductos();

  return (
    <div>
      <h1>Clientes: {clientes.length}</h1>
      <h1>Productos: {productos.length}</h1>
    </div>
  );
}
```

### En un API Route

```typescript
import { NextResponse } from "next/server";
import { createCliente } from "@/lib/db/clientes";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const cliente = await createCliente(body);
    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
```

## Seguridad (Row Level Security)

Las políticas de seguridad ya están configuradas:

- ✅ Los usuarios solo pueden ver su propio perfil
- ✅ Usuarios autenticados pueden gestionar clientes
- ✅ Todos pueden ver productos, solo autenticados modifican
- ✅ Los créditos solo son visibles para usuarios autenticados
- ✅ Los pagos solo pueden ser registrados por usuarios autenticados

## Próximos Pasos Después de la Configuración

1. **Implementar Autenticación Completa**
   - Páginas de login/registro
   - Protección de rutas
   - Gestión de sesiones

2. **Crear Páginas del Sistema**
   - Dashboard con estadísticas
   - CRUD de clientes
   - CRUD de productos
   - Gestión de créditos
   - Registro de pagos

3. **Agregar Funcionalidades**
   - Calculadora de créditos
   - Reportes y gráficas
   - Notificaciones de pagos vencidos
   - Exportación de datos (PDF, Excel)

## Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Tu Proyecto en Supabase](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp)

## Notas Importantes

- Las credenciales están en [.env.local](.env.local) (no se suben a git)
- El ejemplo está en [.env.local.example](.env.local.example)
- Supabase maneja automáticamente las migraciones y backups
- Puedes ver logs en tiempo real en el Dashboard de Supabase
