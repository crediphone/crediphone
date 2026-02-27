# 🚀 Setup de IA Local para CREDIPHONE

**Última actualización:** 2026-02-15
**Hardware:** RTX 3060 12GB, 28GB RAM, Ryzen 5 3600

---

## 📋 CHECKLIST DE INSTALACIÓN

### ✅ Paso 1: Instalar Ollama (5 min)

```powershell
# Opción A: Con winget (recomendado)
winget install Ollama.Ollama

# Opción B: Descargar desde https://ollama.com/download
```

**Verificar instalación:**
```powershell
ollama --version
# Debe mostrar: ollama version is 0.x.x

# Iniciar servidor (se ejecuta en background)
ollama serve
```

**Verificar API:**
```powershell
curl http://localhost:11434/api/version
# Debe responder con JSON
```

---

### ✅ Paso 2: Descargar Modelos Optimizados (15-20 min)

**Modelo Principal (Implementación):**
```powershell
ollama pull deepseek-coder-v2:lite
# Tamaño: ~5.3GB de descarga, ~8.9GB en VRAM
# Tiempo: ~10-15 min dependiendo de tu conexión
```

**Modelo Rápido (Autocompletado):**
```powershell
ollama pull qwen2.5-coder:7b-instruct-q4_K_M
# Tamaño: ~2.7GB de descarga, ~4.5GB en VRAM
# Tiempo: ~5-8 min
```

**Verificar modelos instalados:**
```powershell
ollama list
# Debe mostrar:
# NAME                              ID            SIZE
# deepseek-coder-v2:lite            abc123...     5.3 GB
# qwen2.5-coder:7b-instruct-q4_K_M  def456...     2.7 GB
```

**Probar modelo:**
```powershell
ollama run deepseek-coder-v2:lite
# Escribe: "Hola, cómo estás?"
# Debe responder coherentemente
# Salir: /bye
```

---

### ✅ Paso 3: Instalar Continue en VS Code (2 min)

1. Abrir VS Code
2. Ir a Extensions (Ctrl+Shift+X)
3. Buscar: "Continue"
4. Instalar extensión oficial
5. Reiniciar VS Code

**Verificar instalación:**
- Debe aparecer ícono de Continue en la barra lateral
- Click en el ícono → debe abrir panel de chat

---

### ✅ Paso 4: Configurar Continue (YA HECHO ✅)

El archivo `.continue/config.yaml` ya está creado y optimizado.

**Ubicación:**
```
c:\Users\usuario 1\crediphone\.continue\config.yaml
```

**Verificar configuración:**
1. Abrir panel de Continue en VS Code
2. Click en ⚙️ (Settings) en la esquina superior derecha
3. Debe mostrar el config.yaml

**Probar conexión con Ollama:**
1. En el chat de Continue, escribir: `Hola`
2. Debe responder usando DeepSeek local
3. Verificar en la esquina inferior que dice: "DeepSeek Local (Principal)"

---

### ✅ Paso 5: Configurar Git (si no está configurado)

```powershell
# Verificar configuración
git config --global user.name
git config --global user.email

# Si no están configurados:
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 🎯 WORKFLOW DIARIO

### **Implementar Tarea con IA Local:**

```
1. Crear rama
   git checkout -b feat/task-XX

2. En Continue, usar comando /task:
   /task T20: Modificar configuracion/page.tsx

3. La IA leerá:
   - docs/CURRENT_STATE.md
   - docs/TASK_CHECKLIST.md
   - CODE_PATTERNS.md

4. Implementará la tarea siguiendo patrones

5. Validar cambios:
   npm run build
   npx tsc --noEmit

6. Commit:
   git add .
   git commit -m "feat: T20 - agregar tab Payjoy en configuración"

7. (Opcional) Review con Claude:
   git diff main...HEAD | claude -p "Revisa este diff"
```

---

## 🛠️ COMANDOS DISPONIBLES EN CONTINUE

### **/task** - Implementar tarea del checklist
```
/task T20: Modificar configuracion/page.tsx
```
La IA automáticamente:
- Lee docs/CURRENT_STATE.md
- Lee docs/TASK_CHECKLIST.md
- Lee CODE_PATTERNS.md
- Implementa la tarea
- Actualiza documentación

### **/fix** - Corregir error
```
/fix Error: Cannot read property 'id' of undefined en productos.ts:45
```
La IA:
- Analiza el error
- Propone solución siguiendo patrones
- Genera código corregido

### **/review** - Revisar cambios
```
/review (pega el diff de git aquí)
```
La IA busca:
- Violaciones de CODE_PATTERNS.md
- Bugs potenciales
- Edge cases
- Problemas de seguridad

### **/phase20** - Ayuda específica para Payjoy
```
/phase20 ¿Cómo implemento el webhook handler?
```

### **/phase22** - Ayuda específica para Inventario
```
/phase22 ¿Cómo creo el formulario de categorías?
```

---

## 🔍 VERIFICACIÓN POST-IMPLEMENTACIÓN

### Script de validación automática:

Crea: `scripts/validate.ps1`
```powershell
# Validación de cambios
Write-Host "🔍 Validando cambios..." -ForegroundColor Cyan

# 1. TypeScript compilation
Write-Host "`n1️⃣ Verificando TypeScript..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Errores de TypeScript encontrados" -ForegroundColor Red
    exit 1
}
Write-Host "✅ TypeScript OK" -ForegroundColor Green

# 2. Build
Write-Host "`n2️⃣ Compilando proyecto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falló" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build OK" -ForegroundColor Green

# 3. Verificar patrones (opcional)
Write-Host "`n3️⃣ Verificando patrones de código..." -ForegroundColor Yellow
# Aquí podrías agregar linting específico

Write-Host "`n✅ Todas las validaciones pasaron!" -ForegroundColor Green
```

**Uso:**
```powershell
.\scripts\validate.ps1
```

---

## 📊 MONITOREO DE RECURSOS

### Monitor de VRAM en tiempo real:

```powershell
# Terminal 1: Ollama serve
ollama serve

# Terminal 2: Monitor NVIDIA
nvidia-smi -l 1

# Terminal 3: VS Code con Continue
```

**Consumo esperado:**
- DeepSeek-V2 Lite activo: ~9GB VRAM
- Qwen 7B activo: ~4.5GB VRAM
- VS Code + Node: ~1-2GB RAM sistema

---

## ⚠️ TROUBLESHOOTING

### Problema: "Ollama no responde"
```powershell
# Reiniciar servicio
taskkill /F /IM ollama.exe
ollama serve
```

### Problema: "Out of memory"
```powershell
# Verificar VRAM disponible
nvidia-smi

# Si VRAM > 11GB:
# 1. Cerrar Chrome/Edge
# 2. Reiniciar Ollama
# 3. Usar modelo más pequeño (qwen2.5-coder:7b)
```

### Problema: "Continue no conecta con Ollama"
1. Verificar que Ollama está corriendo: `curl http://localhost:11434/api/version`
2. Reiniciar VS Code
3. Verificar `.continue/config.yaml` → `apiBase: http://localhost:11434`

### Problema: "Modelo muy lento"
- Cambiar a modelo más pequeño: `qwen2.5-coder:7b`
- Reducir `contextLength` en config.yaml a 8192
- Verificar que no hay otros procesos pesados

---

## 🎯 CHECKLIST ANTES DE EMPEZAR

- [ ] Ollama instalado y corriendo
- [ ] Modelos descargados (deepseek-coder-v2:lite + qwen2.5-coder:7b)
- [ ] Continue instalado en VS Code
- [ ] Config.yaml verificado
- [ ] Git configurado
- [ ] Script de validación creado
- [ ] Monitor de VRAM funcionando

---

## 📚 REFERENCIAS

- **Ollama:** https://ollama.com/library
- **Continue:** https://continue.dev/docs
- **DeepSeek:** https://github.com/deepseek-ai/DeepSeek-Coder
- **Qwen2.5:** https://github.com/QwenLM/Qwen2.5-Coder

---

## 🚀 PRÓXIMOS PASOS

Una vez completado el setup:

1. **Probar workflow completo:**
   ```
   git checkout -b test/local-ai
   /task T20: Modificar configuracion/page.tsx
   npm run build
   git commit -m "test: validar workflow IA local"
   git checkout main
   git branch -D test/local-ai
   ```

2. **Implementar primera tarea real:**
   - Empezar con FASE 22 (más simple)
   - T1: Crear `categorias/nueva/page.tsx`
   - Validar que funciona
   - Commit

3. **Continuar con checklist:**
   - Seguir orden de prioridad en docs/TASK_CHECKLIST.md
   - Usar Claude solo para review crítico

---

**¿Listo para empezar? 🚀**

Siguiente comando:
```powershell
winget install Ollama.Ollama
```
