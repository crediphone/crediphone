# 🤝 AI HANDOFF - Colaboración Multi-IA

Cómo pasar trabajo entre diferentes IAs sin perder contexto.

---

## 🔄 WORKFLOW UNIVERSAL

```
┌─────────────────┐
│ 1. IA lee       │
│ CURRENT_STATE.md│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. IA selecciona│
│ tarea de        │
│ CHECKLIST       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. IA implementa│
│ siguiendo       │
│ CODE_PATTERNS   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. IA actualiza │
│ CURRENT_STATE   │
│ y CHECKLIST     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Git commit   │
│ con mensaje     │
│ claro           │
└─────────────────┘
```

---

## 📖 EJEMPLO COMPLETO

### **Escenario:** Usuario tiene créditos en Google Gemini, ChatGPT y Cursor.

### **Paso 1: Usuario → Gemini**

**Usuario dice:**
```
Soy Gemini trabajando en CREDIPHONE (Next.js 15 + Supabase).

PASO 1 - LEER PRIMERO:
Lee docs/CURRENT_STATE.md
Lee docs/TASK_CHECKLIST.md
Lee CODE_PATTERNS.md

PASO 2 - MI TAREA:
T03: Crear src/types/payjoy.ts
- Definir interfaces completas para Payjoy
- Exportar PayjoyConfig, PayjoyWebhookPayload, etc.

PASO 3 - REGLAS:
- TypeScript: camelCase
- Seguir patrones en CODE_PATTERNS.md
- NUNCA usar 'any'

PASO 4 - AL TERMINAR:
1. Actualizar docs/CURRENT_STATE.md
2. Marcar T03 como completada en docs/TASK_CHECKLIST.md
3. Git commit: "feat(types): add Payjoy type definitions"

COMENZAR.
```

**Gemini hace:**
1. Lee CURRENT_STATE.md
2. Crea `src/types/payjoy.ts` con todas las interfaces
3. Actualiza CURRENT_STATE.md:
   ```markdown
   ### ✅ Completado:
   3. `src/types/payjoy.ts` creado (Gemini - 2026-02-15 00:15)
   ```
4. Actualiza TASK_CHECKLIST.md:
   ```markdown
   - [x] **T03**: Crear `src/types/payjoy.ts`
     - Por: Gemini
     - Fecha: 2026-02-15 00:15
     - Commit: feat(types): add Payjoy type definitions
   ```
5. Git commit

---

### **Paso 2: Usuario → ChatGPT**

**Usuario dice:**
```
Soy ChatGPT trabajando en CREDIPHONE.

PASO 1 - LEER PRIMERO:
Lee docs/CURRENT_STATE.md
Lee docs/TASK_CHECKLIST.md
Lee src/types/payjoy.ts (ya creado por Gemini)

PASO 2 - MI TAREA:
T04: Modificar src/types/index.ts
- Agregar "payjoy" a enum Pago.metodoPago
- Extender Pago interface con campos Payjoy
- Usar tipos de payjoy.ts

PASO 3 - REGLAS:
Leer CODE_PATTERNS.md
Seguir patrones existentes

PASO 4 - AL TERMINAR:
Actualizar docs/CURRENT_STATE.md
Marcar T04 en docs/TASK_CHECKLIST.md
Git commit

COMENZAR.
```

**ChatGPT hace:**
1. Lee CURRENT_STATE.md (ve que Gemini terminó T03)
2. Lee `src/types/payjoy.ts` creado por Gemini
3. Modifica `src/types/index.ts`
4. Actualiza docs
5. Git commit

---

### **Paso 3: Usuario → Cursor IDE**

**Usuario abre Cursor:**
- Cursor lee `.cursorrules` automáticamente
- Usuario presiona Cmd+K (o Ctrl+K)
- Usuario escribe:
  ```
  Tarea T05: Crear src/lib/payjoy/client.ts
  Lee CURRENT_STATE.md primero
  Usa tipos de src/types/payjoy.ts
  ```
- Cursor implementa
- Usuario hace commit manual

---

### **Paso 4: Usuario → Claude (cuando tenga créditos)**

**Usuario dice:**
```
Revisa el trabajo de Gemini, ChatGPT y Cursor.
Lee docs/CURRENT_STATE.md
Verifica que todo esté correcto.
Ajusta cualquier error.
Continúa con T06-T10.
```

**Claude hace:**
1. Lee CURRENT_STATE.md
2. Lee archivos creados por otras IAs
3. Verifica patrones
4. Corrige si hay errores
5. Continúa con siguientes tareas

---

## ⚠️ REGLAS CRÍTICAS

### ✅ HACER SIEMPRE:
1. ✅ Leer `CURRENT_STATE.md` ANTES de empezar
2. ✅ Leer `TASK_CHECKLIST.md` para ver qué está pendiente
3. ✅ Leer `CODE_PATTERNS.md` para seguir convenciones
4. ✅ Actualizar `CURRENT_STATE.md` cuando termines
5. ✅ Marcar tarea como completada en `TASK_CHECKLIST.md`
6. ✅ Git commit con mensaje descriptivo
7. ✅ Escribir en docs quién hizo qué y cuándo

### ❌ NUNCA HACER:
1. ❌ Empezar sin leer CURRENT_STATE.md
2. ❌ Modificar patrones existentes
3. ❌ Usar `any` en TypeScript
4. ❌ Modificar migraciones ya aplicadas
5. ❌ Cambiar nombres de archivos/carpetas sin razón
6. ❌ Dejar trabajo sin documentar en CURRENT_STATE.md

---

## 🎯 TEMPLATE DE PROMPT UNIVERSAL

**Copiar/pegar esto en CUALQUIER IA:**

```
Soy [NOMBRE_IA] trabajando en CREDIPHONE (Next.js 15 + Supabase).

PASO 1 - CONTEXTO:
Lee: docs/CURRENT_STATE.md
Lee: docs/TASK_CHECKLIST.md
Lee: CODE_PATTERNS.md

PASO 2 - TAREA:
[COPIAR TAREA DE CHECKLIST]

PASO 3 - REGLAS:
- TypeScript: camelCase
- SQL: snake_case
- Supabase server: createAdminClient()
- NUNCA usar 'any'
- Seguir CODE_PATTERNS.md

PASO 4 - ARCHIVOS A LEER (si aplica):
[Listar archivos creados por IAs anteriores]

PASO 5 - AL TERMINAR:
1. Actualizar docs/CURRENT_STATE.md con:
   - ✅ [Tarea]: [Descripción] ([IA] - [Fecha])
2. Marcar tarea en docs/TASK_CHECKLIST.md
3. Git commit: "[tipo]: [mensaje]"

COMENZAR AHORA.
```

---

## 📊 TRACKING DE PROGRESO

### Ver quién hizo qué:
```bash
# Git log
git log --oneline --all

# Ver CURRENT_STATE.md
cat docs/CURRENT_STATE.md

# Ver checklist
cat docs/TASK_CHECKLIST.md
```

---

## 🚨 QUÉ HACER SI ALGO SALE MAL

### Problema: IA no entiende el contexto
**Solución:**
1. Pedir a IA que lea docs/CURRENT_STATE.md
2. Explicar nuevamente la tarea
3. Referenciar archivos específicos

### Problema: IA rompe patrones existentes
**Solución:**
1. Revertir cambios: `git revert [commit]`
2. Pedir a otra IA que lo corrija
3. Referenciar CODE_PATTERNS.md explícitamente

### Problema: Conflicto entre archivos de diferentes IAs
**Solución:**
1. Resolver conflicto manualmente
2. Actualizar CURRENT_STATE.md con la resolución
3. Continuar

---

## 💡 TIPS DE EFICIENCIA

1. **Tareas pequeñas** = Mejor handoff
   - 1 tarea = 1 archivo o función
   - Más fácil de revisar
   - Menos conflictos

2. **Commits frecuentes**
   - Cada tarea = 1 commit
   - Mensaje claro
   - Fácil de revertir

3. **Documentar TODO**
   - Actualizar CURRENT_STATE.md siempre
   - Escribir quién, qué, cuándo
   - Facilita handoff

4. **Use la IA correcta para cada tarea**
   - Gemini: Gratis, bueno para código repetitivo
   - ChatGPT: Gratis, bueno para lógica compleja
   - Claude: De pago, bueno para arquitectura y revisión
   - Cursor: IDE, bueno para ediciones rápidas

---

**Última actualización:** 2026-02-15 00:00 UTC
