# 🎯 FASE 20: Decisiones Técnicas - Payjoy Integration

**Última actualización:** 2026-02-15 00:00 UTC

Documentación completa de todas las decisiones tomadas durante el diseño de FASE 20.

---

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Integrar Payjoy API con CREDIPHONE para:
- Recibir webhooks de pagos automáticamente
- Sincronizar pagos de clientes Payjoy
- Rastrear métricas de clientes premium
- Visualizar desglose detallado en cierre de caja
- Importar clientes desde Payjoy

**Estado:** En progreso (5% completado)
**Inicio:** 2026-02-14
**Tareas totales:** 25
**Tareas completadas:** 3

---

## 🔑 DECISIONES ARQUITECTÓNICAS

### 1. Almacenamiento de Credenciales

**Decisión:** Variables de entorno en `.env.local` ✅

**Alternativas consideradas:**
- ❌ Base de datos encriptada: Complejidad innecesaria
- ❌ Secrets manager externo: Costo adicional

**Razones:**
- Patrón existente en CREDIPHONE
- No requiere encriptación extra
- Fácil de configurar en Vercel
- No expuesto al cliente (server-side only)

**Variables:**
```bash
PAYJOY_API_KEY=           # API key de Payjoy
PAYJOY_BASE_URL=          # https://partner.payjoy.com/v1
PAYJOY_WEBHOOK_SECRET=    # Secret para HMAC-SHA256
PAYJOY_AUTO_SYNC=         # true/false
```

---

### 2. Referencia de Payjoy en Créditos

**Decisión:** Campo dedicado `payjoy_finance_order_id` ✅

**Alternativas consideradas:**
- ❌ Tabla de relación many-to-many: Over-engineering
- ❌ Campo genérico `external_id`: No type-safe

**Razones:**
- Type-safe con constraint UNIQUE
- Indexado para búsquedas rápidas
- Permite futuras integraciones (ej: `mercadopago_id`)
- Query simple: `WHERE payjoy_finance_order_id = ?`

**Schema:**
```sql
ALTER TABLE creditos
ADD COLUMN payjoy_finance_order_id TEXT UNIQUE,
ADD COLUMN payjoy_customer_id TEXT,
ADD COLUMN payjoy_sync_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN payjoy_last_sync_at TIMESTAMP;

CREATE INDEX idx_creditos_payjoy_finance_order_id
ON creditos(payjoy_finance_order_id);
```

---

### 3. Método de Pago "payjoy"

**Decisión:** Agregar "payjoy" al enum de `metodo_pago` ✅

**Razones:**
- Consistente con métodos existentes (efectivo, transferencia, etc.)
- Permite filtrado y reportes específicos
- Trigger automático para actualizar estado de crédito

**Schema:**
```sql
ALTER TABLE pagos
DROP CONSTRAINT IF EXISTS check_metodo_pago;

ALTER TABLE pagos
ADD CONSTRAINT check_metodo_pago
CHECK (metodo_pago IN ('efectivo', 'transferencia', 'deposito', 'mixto', 'payjoy'));
```

---

### 4. Dual-Field Pattern para Métodos de Pago

**Decisión:** 2 campos separados - `payjoy_payment_method` + `metodo_pago_tienda` ✅

**Contexto del problema:**
- Payjoy reporta método original (cash, card, transfer, mixed)
- En tienda aceptamos pagos mixtos aunque Payjoy diga "cash"
- Empleados necesitan cuadrar caja física con lo real

**Solución:**
```sql
ALTER TABLE pagos
ADD COLUMN payjoy_payment_method VARCHAR(50),  -- READONLY del webhook
ADD COLUMN metodo_pago_tienda VARCHAR(20)      -- EDITABLE para cierre caja
  CHECK (metodo_pago_tienda IN ('efectivo', 'transferencia', 'tarjeta', 'mixto'));

COMMENT ON COLUMN pagos.payjoy_payment_method IS
  'READONLY: Método reportado por Payjoy (cash/card/transfer/mixed)';

COMMENT ON COLUMN pagos.metodo_pago_tienda IS
  'EDITABLE: Método real usado en tienda física para cuadre de caja';
```

**Flujo:**
1. Webhook llega → `payjoy_payment_method` = "cash"
2. Empleado edita → `metodo_pago_tienda` = "tarjeta" (lo que realmente pasó)
3. Cierre de caja usa `metodo_pago_tienda` para totales
4. Auditoría tiene ambos valores para reconciliación

**Ventajas:**
- ✅ Preserva dato original de Payjoy (auditoría)
- ✅ Permite ajuste manual sin corromper datos
- ✅ Cierre de caja refleja realidad de tienda
- ✅ Reconciliación semanal usa ambos campos

---

### 5. Almacenamiento de Webhooks

**Decisión:** Almacenar TODOS los eventos en `payjoy_webhooks` ✅

**Razones:**
- Auditoría completa
- Debugging cuando falla procesamiento
- Replay de eventos si hay error
- Compliance y reconciliación

**Schema:**
```sql
CREATE TABLE payjoy_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  transaction_id TEXT,
  amount DECIMAL(10,2),
  raw_payload JSONB NOT NULL,
  signature TEXT,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  pago_id UUID REFERENCES pagos(id),
  CONSTRAINT unique_payjoy_transaction_id UNIQUE(transaction_id)
);
```

**Ventajas:**
- Idempotencia por `transaction_id`
- Payload completo en JSONB para debugging
- Status de procesamiento
- Link a pago creado

---

### 6. Estrategia de Sincronización

**Decisión:** Webhooks primarios + Sync manual secundario ✅

**Alternativas consideradas:**
- ❌ Solo polling periódico: Latencia alta, carga API
- ❌ Solo webhooks: Sin fallback si webhook falla
- ❌ Solo manual: Requiere intervención constante

**Implementación:**
- **Primario:** Webhooks en tiempo real
  - Payjoy envía POST a `/api/payjoy/webhook`
  - Sistema procesa automáticamente
  - Crea pago, actualiza crédito

- **Secundario:** Botón "Sincronizar Pagos"
  - Disponible en panel de crédito
  - Llama `/api/payjoy/sync-payments`
  - Útil si webhook falla o se pierde

**NO implementado:**
- Polling periódico (innecesario con webhooks)

---

### 7. Cliente Metrics y Scoring

**Decisión:** Tabla `payjoy_cliente_metricas` con scoring y flags ✅

**Propósito:**
- Identificar clientes premium (buenos pagadores en Payjoy)
- Scoring visual aunque no puedan migrar todavía
- Flag `credito_payjoy_activo` para validación

**Schema:**
```sql
CREATE TABLE payjoy_cliente_metricas (
  cliente_id UUID PRIMARY KEY REFERENCES clientes(id),
  total_pagos INT DEFAULT 0,
  pagos_a_tiempo INT DEFAULT 0,
  scoring_payjoy INT DEFAULT 0,
  credito_payjoy_activo BOOLEAN DEFAULT FALSE,
  payjoy_customer_id TEXT,
  ultimo_pago_payjoy TIMESTAMP
);
```

**Uso:**
- Badge muestra scoring siempre (incentivo visual)
- Botón "Crear Crédito" deshabilitado si `credito_payjoy_activo = TRUE`
- Mensaje: "Cliente tiene crédito activo en Payjoy"

---

### 8. Validación: Un Crédito Activo a la Vez

**Decisión:** Prohibir crédito CREDIPHONE si tiene Payjoy activo ✅

**Razón del problema:**
- Cliente podría dividir pagos entre dos créditos
- Confusión en tracking
- Riesgo de sobre-endeudamiento

**Implementación:**
```typescript
// En función de crear crédito
const { data: metricas } = await supabase
  .from("payjoy_cliente_metricas")
  .select("credito_payjoy_activo")
  .eq("cliente_id", clienteId)
  .single();

if (metricas?.credito_payjoy_activo) {
  throw new Error("Cliente tiene crédito activo en Payjoy. Debe completar ese crédito primero.");
}
```

**UI:**
- Badge verde: "Payjoy Premium" (si scoring > 80)
- Botón disabled: "Crear Crédito"
- Tooltip: "Cliente tiene crédito activo en Payjoy"

---

### 9. Migración de Clientes de Payjoy

**Decisión:** Solo permitir cuando crédito Payjoy COMPLETADO ✅

**Reglas:**
1. Cliente puede estar en base de datos con scoring visible
2. NO puede crear crédito CREDIPHONE mientras tiene Payjoy activo
3. Cuando completa crédito Payjoy → flag cambia a FALSE
4. Ahora SÍ puede crear crédito CREDIPHONE
5. Badge sigue mostrando scoring como "cliente premium"

**Workflow:**
```
Cliente con Payjoy activo
  │
  ├─ Scoring: 95 (VISIBLE)
  ├─ Badge: "Premium Payjoy" ✅
  └─ Botón "Crear Crédito": DISABLED ❌
      └─ Tooltip: "Tiene crédito activo en Payjoy"

Cliente completa pago total en Payjoy
  │
  └─ Webhook: order.completed
      └─ UPDATE credito_payjoy_activo = FALSE

Cliente sin Payjoy activo
  │
  ├─ Scoring: 95 (VISIBLE)
  ├─ Badge: "Cliente Premium" ✅
  └─ Botón "Crear Crédito": ENABLED ✅
      └─ Pre-llenado con datos de Payjoy
```

---

### 10. Sistema de Comisiones (FASE 21)

**Decisión:** Campos en configuración, implementación en FASE 21 ⏳

**Modelo simplificado:**
- Tipo: Fijo ($100 por equipo) o Porcentaje (1% de venta)
- Solo por VENTAS de equipos (NO por cobros/pagos)
- Aplica a: Ventas POS + Créditos nuevos

**Schema:**
```sql
ALTER TABLE configuracion
ADD COLUMN comision_tipo VARCHAR(20) DEFAULT 'porcentaje'
  CHECK (comision_tipo IN ('fijo', 'porcentaje')),
ADD COLUMN comision_monto_fijo DECIMAL(10,2) DEFAULT 100.00,
ADD COLUMN comision_porcentaje_venta DECIMAL(5,2) DEFAULT 1.00;
```

**Cálculo:**
- Fijo: `num_equipos * monto_fijo`
- Porcentaje: `total_ventas * (porcentaje / 100)`

**Detalles de FASE 21:**
- Multi-distribuidor (sub-distribuidoras)
- Reportes semanales
- Reconciliación con Excel/XML de Payjoy

---

## 🎨 DECISIONES DE UX/UI

### 11. Cierre de Caja - Sección Payjoy

**Decisión:** Sección informativa separada con badge de advertencia ✅

**Diseño:**
```
┌─────────────────────────────────────────────┐
│ 💡 Payjoy (Informativo)                     │
│ Este dinero NO está en caja física          │
├─────────────────────────────────────────────┤
│ Pagos recibidos: 10 pagos - $1,267         │
│ Créditos nuevos: 2 créditos - Eng. $800   │
│                                             │
│ Detalle de Pagos:                           │
│ ┌────────┬─────────┬──────┬────────┬──────┐│
│ │TX ID   │Cliente  │Monto │Método  │Hora  ││
│ ├────────┼─────────┼──────┼────────┼──────┤│
│ │abc123..│Juan P.  │$150  │Efectivo│10:30 ││
│ │def456..│María G. │$200  │Tarjeta │11:45 ││
│ └────────┴─────────┴──────┴────────┴──────┘│
└─────────────────────────────────────────────┘
```

**Campos mostrados:**
- Transaction ID (primeros 8 caracteres + "...")
- Nombre del cliente (de webhook o búsqueda en créditos)
- Monto
- Método de pago Payjoy (cash/card/transfer/mixed)
- Hora del pago

**Nota importante:**
- Datos vienen AUTOMÁTICAMENTE del webhook
- NO requiere entrada manual del empleado

---

### 12. Importación de Clientes desde Payjoy

**Decisión:** Modal de búsqueda + formulario pre-llenado ✅

**Workflow:**
1. Empleado ve cliente en tienda
2. Click "Importar desde Payjoy"
3. Modal: Input teléfono/IMEI
4. Sistema busca en Payjoy API
5. Si existe: Pre-llena formulario
6. Empleado confirma y guarda

**Ventajas:**
- Reduce errores de transcripción
- Más rápido que entrada manual
- Valida contra base de Payjoy

---

## 🔐 DECISIONES DE SEGURIDAD

### 13. Validación de Webhooks

**Decisión:** HMAC-SHA256 signature validation ✅

**Implementación:**
```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Seguridad:**
- Firma invalida → 401 Unauthorized
- No procesamos eventos no verificados
- Secret en env var (NEVER hardcoded)

---

### 14. Idempotencia de Webhooks

**Decisión:** Constraint UNIQUE en `transaction_id` ✅

**Protección contra:**
- Webhooks duplicados
- Retry automático de Payjoy
- Pagos duplicados

**Flujo:**
```typescript
// 1. Verificar si ya existe
const existing = await supabase
  .from("pagos")
  .select("id")
  .eq("payjoy_transaction_id", transactionId)
  .single();

if (existing) {
  // Ya procesado, marcar webhook y retornar 200
  return { success: true, message: "Already processed" };
}

// 2. Crear pago solo si no existe
```

---

## 🚀 DECISIONES DE DEPLOYMENT

### 15. Variables de Entorno en Producción

**Vercel:**
```bash
# En Vercel Dashboard → Settings → Environment Variables
PAYJOY_API_KEY=sk_live_xxx
PAYJOY_BASE_URL=https://partner.payjoy.com/v1
PAYJOY_WEBHOOK_SECRET=whsec_xxx
PAYJOY_AUTO_SYNC=true
```

**HTTPS Requerido:**
- Payjoy solo envía webhooks a HTTPS
- Vercel provee SSL automáticamente
- Local dev: ngrok o similar para testing

---

### 16. Webhook URL Registration

**URL en Producción:**
```
https://crediphone.com/api/payjoy/webhook
```

**Configuración en Payjoy:**
- Admin console de Payjoy
- Agregar webhook URL
- Seleccionar eventos: payment.received, order.completed

---

## 🤖 DECISIONES DE COLABORACIÓN MULTI-IA

### 17. Sistema de Documentación

**Decisión:** Carpeta `docs/` con documentos living ✅

**Por qué NO `.claude/`:**
- Se lee automáticamente, consume créditos
- No apropiado para docs compartidos

**Estructura:**
```
docs/
├── README.md              # Índice
├── CURRENT_STATE.md       # Estado actual (living)
├── TASK_CHECKLIST.md      # Tareas atómicas
├── AI_HANDOFF.md          # Workflow colaboración
├── PROMPTS.md             # Prompts pre-hechos
└── payjoy/
    └── FASE20-DECISIONS.md  # Este archivo
```

---

### 18. División de Tareas

**Decisión:** 25 tareas atómicas, paralelizables ✅

**Categorías:**
- Base de datos (T01-T02)
- Types (T03-T04)
- Lib core (T05-T07)
- Database layer (T08-T10)
- API routes (T11-T16)
- UI components (T17-T19)
- UI pages (T20-T22)
- Config (T23)
- Testing (T24-T25)

**Prioridad:**
- Alta: T02, T03, T04, T11 (webhook crítico)
- Media: T05-T10, T12-T16
- Baja: T17-T25 (UI y testing)

---

### 19. IAs Soportadas

**Configuraciones creadas:**
- ✅ Google Gemini (Antigravity free)
- ✅ ChatGPT (GPT-4o free)
- ✅ Claude (Sonnet/Opus)
- ✅ Cursor IDE (.cursorrules)
- ✅ Continue.dev (.continuerc.json)
- ✅ GitHub Copilot
- ✅ Codeium

**Workflow universal:**
1. IA lee CURRENT_STATE.md
2. IA selecciona tarea de CHECKLIST
3. IA implementa con CODE_PATTERNS
4. IA actualiza documentos
5. Git commit

---

## 📊 MODELO DE NEGOCIO

### 20. Sub-distribuidoras (FASE 21)

**Ejemplo:** Celman con 3 empleados

**Flujo:**
1. Celman vende equipo con Payjoy
2. IMEI se registra automáticamente
3. Webhook llega a CREDIPHONE
4. Sistema asocia venta a Celman (por IMEI)
5. Comisión calculada: 10% fijo
6. Reporte semanal generado
7. Reconciliación con Excel/XML de Payjoy

**Implementación:** FASE 21 (futuro)

---

## 🎯 PRÓXIMOS PASOS

1. **Inmediato:**
   - Ejecutar migration (T02)
   - Crear types (T03-T04)
   - Implementar webhook endpoint (T11) ← CRÍTICO

2. **Corto plazo:**
   - Implementar core client (T05-T07)
   - Database functions (T08-T10)
   - Resto de API routes (T12-T16)

3. **Mediano plazo:**
   - UI components (T17-T22)
   - Testing (T24-T25)

4. **Largo plazo (FASE 21):**
   - Multi-distribuidor
   - Comisiones automáticas
   - Reportes semanales

---

## 📝 NOTAS FINALES

**Créditos consumidos (Claude):**
- 94% de créditos rápidos
- 87% de créditos estándar

**Razón de multi-IA:**
- Continuar FASE 20 con Gemini (gratis)
- ChatGPT para tareas complejas
- Cursor para ediciones rápidas
- Claude para revisión final (cuando recargue)

**Contacto original:**
- Plan completo: `.claude/plans/enchanted-noodling-prism.md`
- Conversación original en: `c891b7b2-f8fa-4b45-8a6b-e84b45d5f677.jsonl`

---

**Última actualización:** 2026-02-15 00:00 UTC
**Actualizado por:** Claude Sonnet 4.5
