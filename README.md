# CREDIPHONE - Sistema Administrativo

Sistema administrativo completo para gestión de créditos, ventas y cobros.

## Tecnologías

- **Next.js 16** - Framework React con renderizado del lado del servidor
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework de CSS utilitario
- **React 19** - Biblioteca de UI
- **Supabase** - Backend as a Service (Base de datos PostgreSQL + Auth)

## Estructura del Proyecto

```
crediphone/
├── src/
│   ├── app/              # Rutas y páginas (App Router)
│   │   ├── api/          # API Routes
│   │   │   ├── hello/    # Endpoint de prueba
│   │   │   ├── productos/# API de productos
│   │   │   ├── clientes/ # API de clientes
│   │   │   └── stats/    # API de estadísticas
│   │   ├── auth/         # [Pendiente] Autenticación
│   │   ├── dashboard/    # [Pendiente] Panel administrativo
│   │   ├── layout.tsx    # Layout principal
│   │   └── page.tsx      # Página de inicio
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/           # Button, Card
│   │   ├── forms/        # [Pendiente] Formularios
│   │   └── layout/       # Header
│   ├── lib/              # Utilidades y configuraciones
│   │   ├── supabase/     # Clientes de Supabase
│   │   ├── db/           # Funciones CRUD (clientes, créditos, pagos, productos)
│   │   └── utils.ts      # Funciones de utilidad
│   └── types/            # Tipos de TypeScript
├── supabase/             # Scripts SQL
│   ├── schema.sql        # Esquema de la base de datos
│   └── seed.sql          # Datos de ejemplo
├── public/               # Archivos estáticos
└── package.json
```

## Módulos del Sistema

1. **Gestión de Clientes** - Registro y administración de clientes
2. **Créditos** - Solicitud, aprobación y seguimiento de créditos
3. **Pagos** - Registro de pagos y cobros
4. **Inventario** - Control de productos (teléfonos)
5. **Reportes** - Estadísticas y reportes del sistema
6. **Usuarios** - Gestión de usuarios y roles (Admin, Vendedor, Cobrador)

## Comandos

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Linter
npm run lint
```

## Configuración

### 1. Base de Datos (Supabase)

✅ **Ya configurado** - Las credenciales están en `.env.local`

Para crear las tablas en Supabase:
1. Ve a tu [proyecto en Supabase](https://app.supabase.com/project/ihvjjfsefnvcrczrcmhp)
2. Abre el **SQL Editor**
3. Ejecuta el script [supabase/schema.sql](supabase/schema.sql)
4. (Opcional) Ejecuta [supabase/seed.sql](supabase/seed.sql) para datos de prueba

📖 **Guía completa:** Ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 2. Variables de Entorno

Ya están configuradas en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave
```

## Estado del Proyecto

### ✅ Completado

- [x] Estructura base de Next.js 16
- [x] Configuración de TypeScript y Tailwind CSS
- [x] Integración con Supabase
- [x] Esquema de base de datos completo
- [x] Funciones CRUD para todas las entidades
- [x] APIs de ejemplo (productos, clientes, estadísticas)
- [x] Componentes UI base (Button, Card, Header)
- [x] Middleware de autenticación
- [x] Row Level Security (RLS) policies

### 📋 Próximos Pasos

- [ ] Ejecutar scripts SQL en Supabase (ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
- [ ] Implementar páginas de autenticación (login/registro)
- [ ] Crear dashboard administrativo con estadísticas
- [ ] Implementar CRUD de clientes con interfaz
- [ ] Implementar gestión de créditos
- [ ] Implementar registro de pagos
- [ ] Crear módulo de inventario de productos
- [ ] Agregar reportes y gráficas
- [ ] Implementar notificaciones de pagos vencidos

## APIs Disponibles

Una vez ejecutado el schema.sql, estas APIs estarán funcionales:

- `GET /api/hello` - Endpoint de prueba
- `GET /api/productos` - Listado de productos
- `GET /api/clientes` - Listado de clientes
- `GET /api/stats` - Estadísticas del sistema

## Licencia

Privado - Todos los derechos reservados
