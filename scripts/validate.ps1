# ========================================
# Script de Validación - CREDIPHONE
# Ejecuta antes de cada commit
# ========================================

param(
    [switch]$SkipBuild,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$script:hasErrors = $false

Write-Host "`n🔍 VALIDACIÓN DE CAMBIOS - CREDIPHONE`n" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor DarkGray

# ========================================
# 1. TYPESCRIPT COMPILATION
# ========================================
Write-Host "1️⃣  Verificando TypeScript..." -ForegroundColor Yellow

$tscOutput = npx tsc --noEmit 2>&1
$tscExitCode = $LASTEXITCODE

if ($tscExitCode -ne 0) {
    Write-Host "❌ Errores de TypeScript encontrados:`n" -ForegroundColor Red
    Write-Host $tscOutput -ForegroundColor Red
    $script:hasErrors = $true
} else {
    Write-Host "✅ TypeScript: Sin errores`n" -ForegroundColor Green
}

# ========================================
# 2. BUILD (opcional con -SkipBuild)
# ========================================
if (-not $SkipBuild) {
    Write-Host "2️⃣  Compilando proyecto (Next.js)..." -ForegroundColor Yellow

    $buildOutput = npm run build 2>&1
    $buildExitCode = $LASTEXITCODE

    if ($buildExitCode -ne 0) {
        Write-Host "❌ Build falló:`n" -ForegroundColor Red
        if ($Verbose) {
            Write-Host $buildOutput -ForegroundColor Red
        } else {
            Write-Host "  (Usa -Verbose para ver detalles completos)`n" -ForegroundColor DarkGray
        }
        $script:hasErrors = $true
    } else {
        Write-Host "✅ Build: Exitoso`n" -ForegroundColor Green
    }
} else {
    Write-Host "2️⃣  Build: Omitido (flag -SkipBuild)`n" -ForegroundColor DarkGray
}

# ========================================
# 3. VERIFICAR PATRONES DE CÓDIGO
# ========================================
Write-Host "3️⃣  Verificando patrones de código..." -ForegroundColor Yellow

# Verificar que no se usen 'any' en archivos TypeScript modificados
$gitDiff = git diff --cached --name-only --diff-filter=ACM | Select-String -Pattern '\.tsx?$'

if ($gitDiff) {
    $anyUsages = @()

    foreach ($file in $gitDiff) {
        $content = Get-Content $file.ToString() -Raw
        if ($content -match '\bany\b') {
            $anyUsages += $file.ToString()
        }
    }

    if ($anyUsages.Count -gt 0) {
        Write-Host "⚠️  Archivos con 'any' detectado:" -ForegroundColor Yellow
        foreach ($file in $anyUsages) {
            Write-Host "   - $file" -ForegroundColor Yellow
        }
        Write-Host "   (Considera usar tipos específicos)`n" -ForegroundColor DarkGray
    } else {
        Write-Host "✅ Patrones: Sin uso de 'any'`n" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  No hay archivos TypeScript modificados`n" -ForegroundColor DarkGray
}

# ========================================
# 4. VERIFICAR MIGRACIONES
# ========================================
Write-Host "4️⃣  Verificando migraciones SQL..." -ForegroundColor Yellow

$sqlFiles = git diff --cached --name-only --diff-filter=M | Select-String -Pattern 'supabase/migrations/.*\.sql$'

if ($sqlFiles) {
    Write-Host "❌ ADVERTENCIA: Modificaste una migración existente!" -ForegroundColor Red
    Write-Host "   Archivos:" -ForegroundColor Red
    foreach ($file in $sqlFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host "   REGLA: NUNCA modificar migraciones ya aplicadas" -ForegroundColor Red
    Write-Host "   Solución: Crear nueva migración en su lugar`n" -ForegroundColor Yellow
    $script:hasErrors = $true
} else {
    Write-Host "✅ Migraciones: Sin modificaciones`n" -ForegroundColor Green
}

# ========================================
# 5. VERIFICAR DOCUMENTACIÓN
# ========================================
Write-Host "5️⃣  Verificando documentación..." -ForegroundColor Yellow

$modifiedDocs = git diff --cached --name-only --diff-filter=M | Select-String -Pattern 'docs/(CURRENT_STATE|TASK_CHECKLIST)\.md$'

if ($modifiedDocs) {
    Write-Host "✅ Documentación actualizada`n" -ForegroundColor Green
} else {
    $hasCodeChanges = git diff --cached --name-only --diff-filter=ACM | Select-String -Pattern '\.(ts|tsx)$'
    if ($hasCodeChanges) {
        Write-Host "⚠️  Cambios en código pero documentación no actualizada" -ForegroundColor Yellow
        Write-Host "   Considera actualizar:" -ForegroundColor Yellow
        Write-Host "   - docs/TASK_CHECKLIST.md" -ForegroundColor Yellow
        Write-Host "   - docs/CURRENT_STATE.md`n" -ForegroundColor Yellow
    } else {
        Write-Host "ℹ️  No hay cambios en código`n" -ForegroundColor DarkGray
    }
}

# ========================================
# RESUMEN FINAL
# ========================================
Write-Host "================================================`n" -ForegroundColor DarkGray

if ($script:hasErrors) {
    Write-Host "❌ VALIDACIÓN FALLIDA - Corrige los errores antes de commit`n" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ VALIDACIÓN EXITOSA - Puedes hacer commit`n" -ForegroundColor Green

    # Mostrar archivos a commitear
    Write-Host "📦 Archivos listos para commit:" -ForegroundColor Cyan
    git diff --cached --name-status | ForEach-Object {
        Write-Host "   $_" -ForegroundColor DarkGray
    }
    Write-Host ""

    exit 0
}
