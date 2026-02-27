# 📚 CREDIPHONE - Documentación

Sistema de documentación para colaboración multi-IA.

## 🎯 ARCHIVOS CRÍTICOS (LEER PRIMERO)

### **Para TODAS las IAs:**
1. **[CURRENT_STATE.md](./CURRENT_STATE.md)** ← Estado actual del proyecto
2. **[TASK_CHECKLIST.md](./TASK_CHECKLIST.md)** ← Tareas pendientes
3. **[../CODE_PATTERNS.md](../CODE_PATTERNS.md)** ← Patrones obligatorios
4. **[../ARCHITECTURE.md](../ARCHITECTURE.md)** ← Estructura del proyecto

### **Para el desarrollador:**
- **[AI_HANDOFF.md](./AI_HANDOFF.md)** ← Cómo pasar trabajo entre IAs
- **[PROMPTS.md](./PROMPTS.md)** ← Prompts pre-hechos para cada IA

### **Para IAs específicas:**
- **[../.cursorrules](../.cursorrules)** ← Cursor IDE
- **[../.continuerc.json](../.continuerc.json)** ← Continue.dev

## 🤖 IAs SOPORTADAS

✅ Google Gemini (Antigravity - GRATIS)
✅ ChatGPT (GPT-4o free)
✅ Claude (Sonnet/Opus)
✅ GitHub Copilot
✅ Cursor IDE
✅ Continue.dev
✅ Codeium

## 🔄 WORKFLOW BÁSICO

1. **IA lee** `CURRENT_STATE.md`
2. **IA selecciona tarea** de `TASK_CHECKLIST.md`
3. **IA implementa** siguiendo `CODE_PATTERNS.md`
4. **IA actualiza** `CURRENT_STATE.md` con su progreso
5. **IA marca tarea** como completada en `TASK_CHECKLIST.md`
6. **Git commit** con mensaje claro

## 📖 DOCUMENTACIÓN POR FASES

- **[payjoy/](./payjoy/)** - FASE 20: Integración Payjoy
- **[subdistribuidoras/](./subdistribuidoras/)** - FASE 21: Multi-distribuidor (futuro)

## ⚠️ REGLAS DE ORO

1. ✅ **SIEMPRE** leer `CURRENT_STATE.md` PRIMERO
2. ✅ **SIEMPRE** actualizar `CURRENT_STATE.md` AL TERMINAR
3. ✅ Seguir patrones en `CODE_PATTERNS.md`
4. ❌ NUNCA modificar patrones existentes sin consultar
5. ❌ NUNCA usar `any` en TypeScript
