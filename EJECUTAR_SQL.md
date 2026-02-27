# 🚀 Guía: Ejecutar Scripts SQL en Supabase

Esta guía te llevará paso a paso para configurar la base de datos de CREDIPHONE en Supabase.

---

## 📋 Requisitos Previos

- ✅ Cuenta de Supabase activa
- ✅ Proyecto de Supabase creado
- ✅ Variables de entorno configuradas en `.env.local`

---

## 🎯 Paso 1: Acceder al SQL Editor de Supabase

1. **Abre tu proyecto en Supabase:**
   - Ve a: https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp
   - O accede desde: https://app.supabase.com y selecciona tu proyecto

2. **Navega al SQL Editor:**
   - En el menú lateral izquierdo, busca el ícono `</>`
   - Click en **"SQL Editor"**

---

## 📝 Paso 2: Ejecutar el Schema (Estructura de la BD)

### 2.1. Crear Nueva Query

1. En el SQL Editor, click en **"+ New query"**
2. Dale un nombre: `CREDIPHONE - Schema`

### 2.2. Copiar el Schema

1. Abre el archivo: `supabase/schema.sql` en tu editor de código
2. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)

### 2.3. Pegar y Ejecutar

1. **Pega el contenido** en el SQL Editor de Supabase (Ctrl+V)
2. Click en el botón **"Run"** (esquina inferior derecha)
   - O presiona `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)

### 2.4. Verificar Ejecución

Deberías ver un mensaje de éxito:

```
Success. No rows returned
```

Esto es **NORMAL** porque el script solo crea tablas, no devuelve datos.

**¿Qué se creó?**
- ✅ 5 Tablas: `users`, `clientes`, `productos`, `creditos`, `pagos`
- ✅ 8 Índices para optimizar consultas
- ✅ 4 Triggers para actualizar `updated_at`
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de seguridad configuradas
- ✅ 2 Vistas útiles
- ✅ 3 Funciones de cálculo

---

## 🌱 Paso 3: Insertar Datos de Ejemplo (Seed)

### 3.1. Crear Nueva Query

1. En el SQL Editor, click en **"+ New query"**
2. Dale un nombre: `CREDIPHONE - Seed Data`

### 3.2. Copiar el Seed

1. Abre el archivo: `supabase/seed.sql`
2. **Copia TODO el contenido**

### 3.3. Pegar y Ejecutar

1. **Pega el contenido** en el SQL Editor
2. Click en **"Run"** o `Ctrl/Cmd + Enter`

### 3.4. Verificar Datos Insertados

Deberías ver al final:

```
| Productos insertados: | 8 |
| Clientes insertados:  | 5 |
```

**¿Qué se insertó?**
- ✅ 8 Productos (teléfonos de diferentes marcas)
- ✅ 5 Clientes de ejemplo

---

## ✅ Paso 4: Verificar la Instalación

### 4.1. Ejecutar Script de Verificación

1. En el SQL Editor, click en **"+ New query"**
2. Nombre: `CREDIPHONE - Verificación`
3. Abre el archivo: `supabase/verify.sql`
4. Copia y pega el contenido
5. Click en **"Run"**

### 4.2. Revisar los Resultados

El script te mostrará:

1. **Tablas creadas:** Debe mostrar `5`
2. **Índices creados:** Debe mostrar `8`
3. **Vistas creadas:** Debe mostrar `2`
4. **Funciones creadas:** Debe mostrar `3`
5. **Triggers creados:** Debe mostrar `4`
6. **RLS Status:** Todas las tablas deben mostrar "Habilitado ✓"
7. **Datos insertados:**
   - Productos: `8`
   - Clientes: `5`
   - Créditos: `0` (normal, se crean después)
   - Pagos: `0` (normal, se crean después)
   - Usuarios: `0` (se crean en el siguiente paso)

### 4.3. Verificación Visual en Table Editor

1. En el menú lateral, click en **"Table Editor"**
2. Deberías ver las siguientes tablas:
   - `users`
   - `clientes` ⭐ (con 5 registros)
   - `productos` ⭐ (con 8 registros)
   - `creditos`
   - `pagos`

3. Click en cada tabla para ver los datos insertados

---

## 👤 Paso 5: Crear el Primer Usuario Administrador

### Método 1: Desde el Dashboard (Recomendado)

#### 5.1. Ir a Authentication

1. En el menú lateral, click en **"Authentication"**
2. Click en **"Users"**

#### 5.2. Crear Usuario

1. Click en **"Add user"** (botón verde arriba a la derecha)
2. Selecciona **"Create new user"**
3. Completa el formulario:
   ```
   Email: admin@crediphone.com
   Password: [Una contraseña segura, ej: Admin123!@#]
   Auto Confirm User: ✓ (Activado/Checked)
   ```
4. Click en **"Create user"**

#### 5.3. Copiar el UUID del Usuario

1. Busca el usuario que acabas de crear en la lista
2. Click en el usuario para ver los detalles
3. **Copia el UUID** (algo como: `550e8400-e29b-41d4-a716-446655440000`)

#### 5.4. Insertar en la Tabla Users

1. Ve al **SQL Editor**
2. Crea una nueva query: `Crear Admin`
3. Pega este código (reemplazando el UUID):

```sql
-- REEMPLAZA 'TU-UUID-AQUI' con el UUID que copiaste
INSERT INTO public.users (id, email, name, role) VALUES
('TU-UUID-AQUI', 'admin@crediphone.com', 'Administrador', 'admin');
```

4. Reemplaza `'TU-UUID-AQUI'` con el UUID real
5. Ejecuta la query

#### 5.5. Verificar el Usuario

```sql
SELECT * FROM public.users;
```

Deberías ver tu usuario administrador creado.

---

### Método 2: Crear Múltiples Usuarios de Prueba

Si quieres crear usuarios de diferentes roles:

#### Usuario Admin
```
Email: admin@crediphone.com
Password: Admin123!
Role: admin
```

#### Usuario Vendedor
```
Email: vendedor@crediphone.com
Password: Vendedor123!
Role: vendedor
```

#### Usuario Cobrador
```
Email: cobrador@crediphone.com
Password: Cobrador123!
Role: cobrador
```

Para cada uno:
1. Créalo en **Authentication > Users** (con "Auto Confirm User" activado)
2. Copia el UUID
3. Inserta en la tabla `users`:

```sql
INSERT INTO public.users (id, email, name, role) VALUES
('UUID-ADMIN', 'admin@crediphone.com', 'Administrador', 'admin'),
('UUID-VENDEDOR', 'vendedor@crediphone.com', 'Juan Vendedor', 'vendedor'),
('UUID-COBRADOR', 'cobrador@crediphone.com', 'Pedro Cobrador', 'cobrador');
```

---

## 🎉 Paso 6: Verificación Final

### 6.1. Verificar desde SQL

```sql
-- Ver todas las tablas con datos
SELECT 'Productos:' as tabla, COUNT(*) as registros FROM public.productos
UNION ALL
SELECT 'Clientes:', COUNT(*) FROM public.clientes
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM public.users;

-- Ver los productos
SELECT nombre, marca, precio, stock FROM public.productos;

-- Ver los clientes
SELECT nombre, apellido, telefono FROM public.clientes;

-- Ver los usuarios
SELECT name, email, role FROM public.users;
```

### 6.2. Verificar desde Table Editor

1. Ve a **Table Editor**
2. Click en `productos` - Deberías ver 8 teléfonos
3. Click en `clientes` - Deberías ver 5 clientes
4. Click en `users` - Deberías ver 1 o más usuarios

---

## 📊 Datos Insertados de Ejemplo

### Productos (8)
- iPhone 15 Pro - $25,999
- Samsung Galaxy S24 - $19,999
- iPhone 14 - $17,999
- OnePlus Nord 3 - $10,999
- OPPO Reno 11 - $9,999
- Motorola Edge 40 - $8,999
- Samsung Galaxy A54 - $8,499
- Xiaomi Redmi Note 13 - $5,999

### Clientes (5)
- Juan Pérez García
- María López Martínez
- Carlos Sánchez Ramírez
- Ana Hernández Torres
- Roberto González Flores

---

## 🧪 Probar las APIs

Una vez completados todos los pasos, puedes probar las APIs:

```bash
# Iniciar el servidor
npm run dev
```

Luego en el navegador o Postman:

### Endpoints disponibles:

```
GET http://localhost:3000/api/hello
GET http://localhost:3000/api/productos
GET http://localhost:3000/api/clientes
GET http://localhost:3000/api/stats
```

---

## ❗ Solución de Problemas

### Error: "relation public.users does not exist"
- **Solución:** Asegúrate de ejecutar primero `schema.sql`

### Error: "duplicate key value violates unique constraint"
- **Solución:** Ya ejecutaste el seed antes, no es necesario ejecutarlo de nuevo

### No veo las tablas en Table Editor
- **Solución:** Refresca la página (F5) o cierra y vuelve a abrir el navegador

### Las políticas RLS bloquean las consultas
- **Solución:** Asegúrate de estar autenticado o temporalmente desactiva RLS para pruebas:
  ```sql
  ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
  ```

### Error al crear usuario en Authentication
- **Solución:** Verifica que el email sea único y válido

---

## 📚 Próximos Pasos

Ahora que la base de datos está configurada:

1. ✅ Probar las APIs existentes
2. ⬜ Implementar páginas de autenticación (login/registro)
3. ⬜ Crear el dashboard administrativo
4. ⬜ Implementar CRUD de clientes con interfaz
5. ⬜ Implementar gestión de créditos
6. ⬜ Implementar módulo de pagos

---

## 🔗 Enlaces Útiles

- [Dashboard del Proyecto](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp)
- [SQL Editor](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp/sql)
- [Table Editor](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp/editor)
- [Authentication](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp/auth/users)
- [Documentación Supabase](https://supabase.com/docs)

---

**¡Configuración completada! 🎉**

Tu base de datos de CREDIPHONE está lista para usar.
