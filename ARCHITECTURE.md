# 🏗️ ARCHITECTURE - Estructura del Proyecto

**Última actualización:** 2026-02-15 00:00 UTC

---

## 📁 ESTRUCTURA DE CARPETAS

```
crediphone/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── dashboard/          # Rutas protegidas (admin/empleado)
│   │   │   ├── pos/            # Punto de Venta
│   │   │   │   ├── caja/       # Sistema de caja
│   │   │   │   └── venta/      # Ventas
│   │   │   ├── creditos/       # Gestión de créditos
│   │   │   ├── clientes/       # Gestión de clientes
│   │   │   ├── inventario/     # Sistema de inventario
│   │   │   ├── configuracion/  # Configuración general
│   │   │   └── reportes/       # Reportes y analíticas
│   │   └── api/                # API Routes
│   │       ├── payjoy/         # ← FASE 20: Endpoints Payjoy
│   │       │   ├── webhook/    # Recibir webhooks de Payjoy
│   │       │   ├── test-connection/
│   │       │   ├── lookup-customer/
│   │       │   ├── import-customer/
│   │       │   ├── link-credit/
│   │       │   └── export/
│   │       ├── creditos/
│   │       ├── clientes/
│   │       ├── productos/
│   │       └── reportes/
│   │
│   ├── components/             # Componentes React
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── payjoy/             # ← FASE 20: Componentes Payjoy
│   │   │   ├── PayjoyConfigSection.tsx
│   │   │   └── PayjoyBadge.tsx
│   │   ├── clientes/
│   │   │   └── ImportPayjoyModal.tsx  # ← FASE 20
│   │   ├── creditos/
│   │   ├── pos/
│   │   └── inventario/
│   │
│   ├── lib/                    # Lógica de negocio
│   │   ├── payjoy/             # ← FASE 20: Core Payjoy
│   │   │   ├── client.ts       # API client class
│   │   │   ├── logger.ts       # API call logger
│   │   │   └── webhook-handler.ts  # Procesamiento webhooks
│   │   ├── db/                 # Database functions
│   │   │   ├── payjoy.ts       # ← FASE 20: CRUD Payjoy
│   │   │   ├── creditos.ts
│   │   │   ├── clientes.ts
│   │   │   ├── productos.ts
│   │   │   ├── caja.ts
│   │   │   └── configuracion.ts
│   │   ├── supabase/           # Supabase clients
│   │   │   ├── admin.ts        # Server-side admin client
│   │   │   ├── client.ts       # Browser client
│   │   │   └── server.ts       # Middleware client
│   │   └── utils/              # Utilidades
│   │
│   └── types/                  # TypeScript types
│       ├── payjoy.ts           # ← FASE 20: Tipos Payjoy
│       ├── index.ts            # Tipos principales
│       └── database.ts         # Tipos generados de Supabase
│
├── supabase/
│   └── migrations/             # SQL migrations
│       ├── fase20-payjoy-integration.sql  # ← FASE 20
│       └── ...
│
├── docs/                       # ← Sistema multi-IA
│   ├── README.md               # Índice de documentación
│   ├── CURRENT_STATE.md        # Estado actual (living doc)
│   ├── TASK_CHECKLIST.md       # Checklist de tareas
│   ├── AI_HANDOFF.md           # Workflow colaboración
│   ├── PROMPTS.md              # Prompts pre-hechos
│   └── payjoy/                 # Docs específicos de FASE 20
│       └── FASE20-DECISIONS.md
│
├── .claude/                    # Claude plans
│   └── plans/
│       └── enchanted-noodling-prism.md
│
├── CODE_PATTERNS.md            # ← Patrones obligatorios
├── ARCHITECTURE.md             # ← Este archivo
├── .cursorrules                # Reglas para Cursor IDE
├── .continuerc.json            # Config Continue.dev
└── .env.local                  # Variables de entorno
```

---

## 🗄️ MODELO DE BASE DE DATOS

### Tablas Principales:

#### **users** (Supabase Auth)
- Autenticación y roles
- Roles: `admin`, `empleado`
- RLS por role

#### **clientes**
- Información de clientes
- Campos: nombre, apellido, telefono, direccion, etc.
- **FASE 20**: Link a `payjoy_cliente_metricas`

#### **creditos**
- Créditos otorgados
- Estados: activo, pagado, vencido, cancelado
- **FASE 20**: Campos Payjoy agregados
  - `payjoy_finance_order_id` (UNIQUE)
  - `payjoy_customer_id`
  - `payjoy_sync_enabled`
  - `payjoy_last_sync_at`

#### **pagos**
- Pagos de créditos
- Métodos: efectivo, transferencia, deposito, mixto, **payjoy** ← FASE 20
- **FASE 20**: Campos Payjoy agregados
  - `payjoy_transaction_id` (UNIQUE, idempotencia)
  - `payjoy_payment_method` (readonly, del webhook)
  - `metodo_pago_tienda` (editable, para cierre de caja)
  - `payjoy_customer_name`
  - `payjoy_webhook_id`

#### **productos**
- Inventario de productos
- Códigos de barras (Code128, EAN13, IMEI)
- Ubicaciones

#### **ventas**
- Ventas de POS
- Múltiples métodos de pago
- Tickets

#### **cajas**
- Sesiones de caja
- Cierre de caja con totales por método

#### **configuracion** (singleton)
- Configuración global del sistema
- **FASE 20**: Campos Payjoy agregados
  - `payjoy_enabled`
  - `payjoy_webhook_url`
  - `payjoy_auto_sync_payments`
  - Campos de comisiones

### Tablas Nuevas (FASE 20):

#### **payjoy_webhooks**
- Auditoría de webhooks recibidos
- Payload completo en JSONB
- Idempotencia por `transaction_id`
- Status de procesamiento

#### **payjoy_api_logs**
- Logs de llamadas salientes a Payjoy API
- Request/response completos
- Duración, errores

#### **payjoy_cliente_metricas**
- Métricas de clientes de Payjoy
- Scoring, historial de pagos
- Flag `credito_payjoy_activo` (validación)

---

## 🔄 FLUJOS CRÍTICOS

### 1. Webhook Payjoy → Pago Automático

```
┌─────────────────┐
│ Cliente paga en │
│ Payjoy (externo)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Payjoy envía webhook                    │
│ POST /api/payjoy/webhook                │
│ { transaction_id, amount, payment_method}│
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Sistema verifica firma HMAC-SHA256      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Almacena webhook en payjoy_webhooks     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Verifica idempotencia (transaction_id)  │
│ Si ya existe → 200 OK, no duplica       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Busca crédito por payjoy_finance_order_id│
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Crea registro en tabla pagos            │
│ - metodo_pago = 'payjoy'                │
│ - payjoy_payment_method = del webhook   │
│ - metodo_pago_tienda = NULL (editable)  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Trigger automático check_credito_paid   │
│ Suma total pagado                       │
│ Si >= monto → estado = 'pagado'         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Marca webhook como procesado            │
│ Retorna 200 OK a Payjoy                 │
└─────────────────────────────────────────┘
```

### 2. Cierre de Caja con Payjoy

```
┌─────────────────┐
│ Empleado cierra │
│ caja            │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Query pagos del turno                   │
│ Agrupa por metodo_pago_tienda           │
│ (efectivo, transferencia, tarjeta, etc) │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Query pagos Payjoy (INFORMATIVO)        │
│ WHERE metodo_pago = 'payjoy'            │
│ SELECT desglose completo:               │
│ - TX ID                                 │
│ - Cliente nombre                        │
│ - Monto                                 │
│ - payjoy_payment_method                 │
│ - Hora                                  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ UI muestra:                             │
│ - Totales de caja física (cuadre)      │
│ - Sección Payjoy con badge informativo │
│ - Tabla detallada de pagos Payjoy      │
│ - Alert: "Este dinero NO en caja física"│
└─────────────────────────────────────────┘
```

### 3. Validación: Un Crédito Activo a la Vez

```
┌─────────────────┐
│ Crear crédito   │
│ nuevo           │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Verificar payjoy_cliente_metricas       │
│ WHERE cliente_id = ?                    │
│ AND credito_payjoy_activo = TRUE        │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    │ Tiene?  │
    └─┬────┬──┘
  NO  │    │ SI
      │    │
      │    └──────────────────────────────┐
      │                                   ▼
      │                           ┌──────────────────┐
      │                           │ Mostrar error:   │
      │                           │ "Cliente tiene   │
      │                           │ crédito activo   │
      │                           │ en Payjoy"       │
      │                           └──────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Permitir crear crédito CREDIPHONE       │
└─────────────────────────────────────────┘
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Supabase Client Patterns:

#### **Server-side (API Routes, Server Components):**
```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();
// Bypass RLS, acceso completo
```

#### **Client-side (Browser):**
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
// Respeta RLS basado en auth.uid()
```

#### **Middleware:**
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
// Para verificar sesión en middleware
```

### Row Level Security (RLS):

- **users**: Solo su propio registro
- **configuracion**: Solo admin
- **productos**: Admin = ALL, Empleado = SELECT
- **clientes**: Admin = ALL, Empleado = SELECT + INSERT
- **creditos**: Admin = ALL, Empleado = SELECT + INSERT + UPDATE (solo sus créditos)
- **pagos**: Admin = ALL, Empleado = SELECT + INSERT
- **cajas**: Solo su propia sesión
- **payjoy_***: Solo admin (excepto webhooks, que son públicos vía API)

---

## 🎨 STACK TECNOLÓGICO

### Frontend:
- **Next.js 15** - App Router, Server Components
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icons

### Backend:
- **Next.js API Routes** - Endpoints
- **Supabase** - PostgreSQL database + Auth + RLS
- **Payjoy API** - Integración externa (FASE 20)

### Integraciones:
- **Payjoy Webhooks** - HMAC-SHA256 signature
- **Payjoy REST API** - OAuth 2.0 con access tokens

### Development:
- **Git** - Version control
- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Code formatting

---

## 📝 CONVENCIONES DE CÓDIGO

### Naming:
- **TypeScript**: `camelCase`
- **SQL**: `snake_case`
- **Componentes React**: `PascalCase`
- **Archivos componentes**: `PascalCase.tsx` o `kebab-case.tsx`
- **Archivos lógica**: `camelCase.ts`

### Imports:
- Usar alias `@/` para imports absolutos
- Agrupar: React → Next → UI → Lib → Types

### Database:
- Mapeo snake_case ↔ camelCase en `mapXxxFromDB()`
- NUNCA modificar migrations ya aplicadas
- Siempre comentarios en SQL

### Tipos:
- NUNCA usar `any`
- Interfaces para objetos públicos
- Types para uniones/helpers

---

## 🚀 DEPLOYMENT

### Producción:
- **Vercel** - Hosting Next.js
- **Supabase Cloud** - Database
- **HTTPS** requerido para webhooks

### Variables de Entorno:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payjoy (FASE 20)
PAYJOY_ENABLED=true
PAYJOY_API_KEY=
PAYJOY_BASE_URL=https://partner.payjoy.com/v1
PAYJOY_WEBHOOK_SECRET=
PAYJOY_AUTO_SYNC=true
```

---

## 🔄 FASES DEL PROYECTO

### ✅ Completadas:
- **FASE 18**: Sistema POS (ventas, caja, tickets)
- **FASE 19**: Inventario Avanzado (códigos barras, ubicaciones)

### 🔄 En Progreso:
- **FASE 20**: Integración Payjoy (5% completado)

### ⏳ Futuras:
- **FASE 21**: Sistema Multi-Distribuidor (sub-distribuidoras)
- **FASE 22**: Reportes Avanzados
- **FASE 23**: Notificaciones y Alertas

---

## 📚 REFERENCIAS

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Payjoy API Docs](https://www.payjoy.com/apidocs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Para más detalles, ver:**
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Patrones de código
- [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) - Estado actual
- [docs/TASK_CHECKLIST.md](./docs/TASK_CHECKLIST.md) - Tareas pendientes
