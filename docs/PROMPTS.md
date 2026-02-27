# 🤖 PROMPTS - Para Diferentes IAs

Prompts pre-hechos para usar en Google Gemini, ChatGPT, Cursor, etc.

---

## 🎯 PROMPT UNIVERSAL (Copiar/Pegar)

**Usar en CUALQUIER IA para empezar:**

```
Soy [NOMBRE_IA] trabajando en CREDIPHONE (Next.js 15 + Supabase).

PASO 1 - LEER CONTEXTO:
Lee estos archivos en orden:
1. docs/CURRENT_STATE.md (estado actual del proyecto)
2. docs/TASK_CHECKLIST.md (tareas pendientes)
3. CODE_PATTERNS.md (patrones obligatorios)
4. ARCHITECTURE.md (estructura del proyecto)

PASO 2 - MI TAREA:
[COPIAR UNA TAREA DE TASK_CHECKLIST.md - ejemplo: T03, T04, etc.]

PASO 3 - REGLAS OBLIGATORIAS:
- TypeScript: camelCase para variables, funciones, interfaces
- SQL: snake_case para tablas, columnas
- Supabase server-side: usar createAdminClient()
- NUNCA usar 'any' en TypeScript
- Seguir patrones en CODE_PATTERNS.md
- Leer archivos existentes antes de modificar

PASO 4 - ARCHIVOS A LEER (si aplica):
[Listar archivos creados por otras IAs que necesites consultar]

PASO 5 - AL TERMINAR:
1. Actualizar docs/CURRENT_STATE.md con:
   ✅ [Tarea]: [Descripción] ([Tu IA] - [Fecha y hora])

2. Marcar tarea en docs/TASK_CHECKLIST.md:
   - [x] **T##**: Descripción
     - Por: [Tu IA]
     - Fecha: YYYY-MM-DD HH:MM
     - Commit: [mensaje del commit]

3. Git commit con formato:
   "feat(payjoy): [descripción corta]"

COMENZAR AHORA.
```

---

## 🟢 GOOGLE GEMINI (Antigravity - GRATIS)

### Prompt para empezar sesión:

```
Hola Gemini, soy un desarrollador trabajando en CREDIPHONE.

CONTEXTO:
Estoy en FASE 20: Integración con Payjoy API para sincronizar pagos.
El proyecto usa Next.js 15, TypeScript, Supabase, y Tailwind CSS.
Hay un sistema de documentación compartida en docs/ para colaborar entre IAs.

ARCHIVOS CRÍTICOS A LEER PRIMERO:
1. docs/CURRENT_STATE.md - ¿Qué se ha hecho hasta ahora?
2. docs/TASK_CHECKLIST.md - ¿Qué tareas están pendientes?
3. CODE_PATTERNS.md - ¿Qué convenciones debo seguir?

TAREA:
Lee CURRENT_STATE.md y dime:
- ¿Qué porcentaje está completado de FASE 20?
- ¿Cuál es la próxima tarea pendiente?
- ¿Qué archivos necesito leer antes de empezar?

Después de tu análisis, te asignaré una tarea específica.
```

### Prompt para tarea específica (ejemplo T03):

```
Perfecto Gemini, tu tarea es:

T03: Crear src/types/payjoy.ts

REQUISITOS:
- Definir todas las interfaces TypeScript para Payjoy
- PayjoyConfig, PayjoyAuthResponse, PayjoyCustomer, PayjoyWebhookPayload, etc.
- Aproximadamente 200 líneas
- Usar camelCase para propiedades (NO snake_case)
- NO usar 'any'
- Documentar cada interface con comentarios JSDoc

REFERENCIAS:
- Payjoy API Docs: https://www.payjoy.com/apidocs/
- Ver plan completo en .claude/plans/enchanted-noodling-prism.md sección "Fase 2: Type Definitions"

ARCHIVOS A LEER PRIMERO:
- src/types/index.ts (ver estructura existente)
- supabase/migrations/fase20-payjoy-integration.sql (ver campos de DB)

AL TERMINAR:
1. Actualizar docs/CURRENT_STATE.md
2. Marcar T03 en docs/TASK_CHECKLIST.md
3. Decirme el código completo para que yo haga el commit
```

---

## 🔵 CHATGPT (GPT-4o Free)

### Prompt inicial:

```
Hola ChatGPT, estoy trabajando en CREDIPHONE (Next.js 15 + Supabase).

SITUACIÓN:
Estamos en FASE 20: Integración Payjoy. Otras IAs (Claude, Gemini) ya hicieron trabajo previo.
Necesito que continúes desde donde dejaron.

PASO 1 - CONTEXTO:
Lee estos archivos para entender el estado actual:
- docs/CURRENT_STATE.md
- docs/TASK_CHECKLIST.md
- CODE_PATTERNS.md

PASO 2 - ANÁLISIS:
Dime:
1. ¿Qué tareas están completadas?
2. ¿Qué tarea puedo hacer ahora?
3. ¿Qué archivos necesito consultar?

Después te asignaré una tarea específica del checklist.
```

### Prompt para tarea T04 (ejemplo):

```
Tu tarea es:

T04: Modificar src/types/index.ts

CAMBIOS NECESARIOS:
1. Agregar "payjoy" al enum Pago.metodoPago:
   metodoPago: "efectivo" | "transferencia" | "deposito" | "mixto" | "payjoy"

2. Extender interface Pago con campos opcionales:
   - payjoyTransactionId?: string
   - payjoyPaymentMethod?: string
   - payjoyCustomerName?: string
   - metodoPagoTienda?: string

3. Extender interface Credito con campos Payjoy:
   - payjoyFinanceOrderId?: string
   - payjoyCustomerId?: string
   - payjoySyncEnabled?: boolean
   - payjoyLastSyncAt?: Date

4. Extender interface Configuracion con:
   - payjoyEnabled?: boolean
   - payjoyWebhookUrl?: string
   - payjoyAutoSyncPayments?: boolean

REGLAS:
- Leer src/types/index.ts COMPLETO primero
- Seguir estructura existente
- camelCase para propiedades
- Documentar con comentarios

AL TERMINAR:
Muéstrame el código modificado y actualiza docs/CURRENT_STATE.md
```

---

## 🟣 CURSOR IDE (Cmd+K / Ctrl+K)

### Prompt en Cursor (inline):

```
Lee docs/CURRENT_STATE.md y continúa con la próxima tarea pendiente.

Tarea T05: Crear src/lib/payjoy/client.ts
- Clase PayjoyClient con métodos authenticate(), lookupCustomer(), testConnection()
- Factory: createPayjoyClient()
- ~300 líneas
- Seguir CODE_PATTERNS.md
```

### Prompt para revisar archivo:

```
Revisa este archivo siguiendo CODE_PATTERNS.md:
- ¿Está usando camelCase correctamente?
- ¿Hay algún 'any'?
- ¿Los imports están organizados?
- ¿Falta algún tipo?
```

---

## 🟠 CONTINUE.DEV (Ctrl+L)

### Prompt para Continue:

```
/read docs/CURRENT_STATE.md
/read docs/TASK_CHECKLIST.md

¿Qué tarea está pendiente de FASE 20?
Asigname la próxima tarea de TypeScript o API routes.
```

### Para implementar tarea:

```
Tarea: T11 - Crear src/app/api/payjoy/webhook/route.ts

CRÍTICO: Este es el webhook receiver.
- Verificar firma HMAC-SHA256
- Procesar payload
- Llamar processWebhook() de webhook-handler
- Retornar 200 OK

Referencia: .claude/plans/enchanted-noodling-prism.md sección "Fase 5: API Routes"

Usa createAdminClient() de Supabase.
```

---

## 🔴 CLAUDE (Cuando tenga créditos)

### Prompt para revisar trabajo de otras IAs:

```
Hola Claude, otras IAs (Gemini, ChatGPT) trabajaron en FASE 20: Payjoy.

REVISAR:
1. Lee docs/CURRENT_STATE.md
2. Lee docs/TASK_CHECKLIST.md
3. Verifica archivos creados contra CODE_PATTERNS.md
4. Identifica errores o inconsistencias

ARCHIVOS A REVISAR:
- src/types/payjoy.ts (creado por Gemini)
- src/types/index.ts (modificado por ChatGPT)
- src/lib/payjoy/client.ts (creado por Gemini)

REPORTA:
- ✅ Qué está correcto
- ⚠️ Qué necesita ajustes
- ❌ Qué está mal y cómo corregirlo

Después de revisar, continúa con tareas pendientes.
```

---

## 📝 PLANTILLAS POR TIPO DE TAREA

### Para crear archivo TypeScript nuevo:

```
Crear [ruta/archivo.ts]

Propósito: [descripción]
Exports: [listar funciones/clases]
Líneas aprox: [número]

REQUISITOS:
- Leer CODE_PATTERNS.md
- camelCase para todo TypeScript
- NO usar 'any'
- Documentar con JSDoc
- Imports organizados (React → Next → UI → Lib → Types)

REFERENCIAS:
- [Archivos similares existentes]
- [Sección del plan si aplica]

AL TERMINAR:
Actualizar docs/CURRENT_STATE.md y TASK_CHECKLIST.md
```

### Para modificar archivo existente:

```
Modificar [ruta/archivo.ts]

PASO 1: Leer archivo completo con Read tool
PASO 2: Hacer cambios específicos:
- [cambio 1]
- [cambio 2]

REGLAS:
- NO romper código existente
- Seguir estilo del archivo
- Agregar, NO reemplazar (a menos que sea necesario)

AL TERMINAR:
Actualizar docs/CURRENT_STATE.md
```

### Para crear API route:

```
Crear src/app/api/[ruta]/route.ts

Endpoints: [GET/POST/PUT/DELETE]

ESTRUCTURA:
- Imports (NextRequest, NextResponse)
- Validación de entrada
- Lógica con createAdminClient()
- Error handling con try/catch
- Retornar { success, data/error }

SEGURIDAD:
- Verificar auth si es necesario
- Validar parámetros
- Sanitizar inputs

Ver ejemplo en CODE_PATTERNS.md sección "API Routes"
```

---

## 🚨 CHECKLIST PRE-COMMIT (Para TODAS las IAs)

Antes de marcar tarea como completada, verificar:

```
✅ CHECKLIST:
- [ ] Leí archivo existente antes de modificar (si aplica)
- [ ] Seguí naming conventions (camelCase TS, snake_case SQL)
- [ ] NO usé 'any' en TypeScript
- [ ] Imports organizados
- [ ] Agregué comentarios donde sea necesario
- [ ] Probé el código (compiló sin errores)
- [ ] Actualicé docs/CURRENT_STATE.md
- [ ] Marqué tarea en docs/TASK_CHECKLIST.md
- [ ] Escribí mensaje de commit claro
```

---

## 💡 TIPS PARA CADA IA

### Google Gemini:
- ✅ Bueno para: Código repetitivo, types, interfaces
- 💡 Tip: Pide código completo, copia directamente
- ⚠️ Revisar: A veces usa 'any', verificar tipos

### ChatGPT:
- ✅ Bueno para: Lógica compleja, algoritmos
- 💡 Tip: Divide tareas grandes en pasos
- ⚠️ Revisar: Imports, asegurar que usen alias @/

### Claude:
- ✅ Bueno para: Arquitectura, revisión de código
- 💡 Tip: Usa para revisar trabajo de otras IAs
- ⚠️ Revisar: Costo de créditos

### Cursor:
- ✅ Bueno para: Ediciones rápidas, refactors
- 💡 Tip: Cmd+K en archivo abierto
- ⚠️ Revisar: A veces sugiere cambios innecesarios

### Continue.dev:
- ✅ Bueno para: Búsquedas en codebase
- 💡 Tip: Usa /read para cargar contexto
- ⚠️ Revisar: Configurar API key correctamente

---

## 🔗 REFERENCIAS

- Documentación completa: docs/README.md
- Estado actual: docs/CURRENT_STATE.md
- Tareas: docs/TASK_CHECKLIST.md
- Patrones: CODE_PATTERNS.md
- Arquitectura: ARCHITECTURE.md

---

**Última actualización:** 2026-02-15 00:00 UTC
