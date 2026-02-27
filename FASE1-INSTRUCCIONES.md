# 🚀 FASE 1: Sistema de Créditos Mejorado - Instrucciones

## ✅ Progreso Actual

### Completado:
1. ✅ **Tipos actualizados** (`src/types/index.ts`)
   - Agregados campos: folio, enganche, montoOriginal, frecuenciaPago, mora, etc.

2. ✅ **Scripts SQL creados**:
   - `supabase/fase1-creditos-mejorados.sql` - Script principal
   - `supabase/update-creditos-frecuencia.sql` - Actualización de frecuencias

3. ✅ **Utilidades de cálculo** (`src/lib/calculosCredito.ts`)
   - Cálculo de enganche
   - Tasas de interés dinámicas según plazo
   - Generación de tabla de amortización
   - Cálculo de CAT (Costo Anual Total)
   - Formateo de moneda y fechas

### En Progreso:
4. 🔄 **Formulario de créditos actualizado**
   - Selector de frecuencia de pago
   - Cálculo de enganche automático
   - Tasas dinámicas (20-60%)
   - Tabla de amortización visual
   - Información legal y CAT

---

## 📋 PASOS PARA IMPLEMENTAR

### 1. Ejecutar Scripts SQL

**⚠️ IMPORTANTE: Ejecutar en orden**

```sql
-- Paso 1: Ejecutar en Supabase Dashboard > SQL Editor
-- Archivo: supabase/fase1-creditos-mejorados.sql
```

Este script:
- ✅ Crea campo `folio` con generación automática
- ✅ Agrega campos de enganche
- ✅ Agrega frecuencia de pago
- ✅ Agrega sistema de mora
- ✅ Crea funciones de cálculo de CAT
- ✅ Crea vista `v_creditos_detalle`
- ✅ Crea índices de rendimiento

**Verificación:**
```sql
-- Verificar que los campos existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'creditos';

-- Debería mostrar: folio, monto_original, enganche, frecuencia_pago, etc.
```

### 2. Reiniciar Servidor de Desarrollo

```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### 3. Actualizar Funciones DB (Próximo paso)

Actualizar `src/lib/db/creditos.ts` para incluir nuevos campos al crear/actualizar créditos.

---

## 🎯 NUEVAS FUNCIONALIDADES

### 1. **Generación Automática de Folio**
- Formato: `CRED-2024-00001`
- Autoincremental por año
- Único para cada crédito

### 2. **Sistema de Enganche**
- Porcentaje configurable (10-50%)
- Por defecto: 10%
- Se resta del monto total
- Cliente con mora: enganche más alto (30%+)

### 3. **Frecuencias de Pago**
- **Semanal**: 52 pagos al año (4 por mes)
- **Quincenal**: 24 pagos al año (2 por mes)
- **Mensual**: 12 pagos al año (1 por mes)

### 4. **Tasas de Interés Dinámicas**
- Rango: 20% a 60% (incrementos de 5%)
- **Ajuste por plazo:**
  - 3-6 meses: Tasa base
  - 7-12 meses: Tasa base + 5%
  - 13-18 meses: Tasa base + 10%
  - 19+ meses: Tasa base + 15%

### 5. **Sistema de Mora**
- Tracking de días en mora
- Cobro mínimo: $50 MXN/día
- Actualización automática
- Alertas visuales

### 6. **Tabla de Amortización**
- Calendario completo de pagos
- Desglose: Capital + Interés
- Fechas específicas
- Saldo pendiente por período

### 7. **Cálculo de CAT**
- Costo Anual Total (requerido por ley)
- Incluye intereses y comisiones
- Mostrado en formato legal

---

## 🧮 EJEMPLO DE CÁLCULO

### Escenario:
- **Producto**: iPhone 15 Pro - $25,000 MXN
- **Enganche**: 10% = $2,500 MXN
- **Monto a financiar**: $22,500 MXN
- **Plazo**: 12 meses
- **Tasa base**: 20%
- **Ajuste por plazo**: +5% (7-12 meses)
- **Tasa final**: 25%
- **Frecuencia**: Quincenal

### Resultados:
```
Enganche:              $  2,500.00
Monto a financiar:     $ 22,500.00
Interés (25%):        $  5,625.00
Total a pagar:         $ 28,125.00
Pago quincenal:        $  1,171.88 (24 pagos)
CAT estimado:          ~28.5%
```

---

## 📊 FUNCIONES SQL DISPONIBLES

### `calcular_cat_credito(monto, tasa, plazo, comisiones)`
Calcula el Costo Anual Total de un crédito.

**Ejemplo:**
```sql
SELECT calcular_cat_credito(22500, 25, 12, 0);
-- Resultado: 28.47
```

### `actualizar_mora_creditos()`
Actualiza automáticamente los días y montos de mora.

**Uso:**
```sql
SELECT actualizar_mora_creditos();
```

### Vista: `v_creditos_detalle`
Vista completa con información del cliente y cálculos.

**Ejemplo:**
```sql
SELECT * FROM v_creditos_detalle WHERE estado = 'activo';
```

---

## 🔄 SIGUIENTE FASE

Una vez completado todo:

### FASE 2: Catálogo E-Commerce
- Página de catálogo visual
- Sistema de carrito
- Integración con WhatsApp
- Gestión de imágenes

### FASE 3: Registro Avanzado de Clientes
- OCR de INE (escaneo automático)
- Referencias personales y laborales
- Captura de fotografía
- Actualización de datos

---

## 💡 NOTAS IMPORTANTES

1. **Compatibilidad**: Los campos antiguos (`pago_quincenal`) se mantienen por compatibilidad
2. **Migración**: Los créditos existentes se actualizan automáticamente
3. **Folio**: Se genera automáticamente al crear nuevo crédito
4. **Enganche**: Por defecto 10%, ajustable según cliente
5. **Mora**: Cálculo automático para créditos vencidos

---

## 🆘 SOPORTE

Si encuentras errores:
1. Verifica que el script SQL se ejecutó completamente
2. Revisa que no hay errores en la consola de Supabase
3. Confirma que el servidor se reinició después de ejecutar SQL
4. Verifica que los tipos en TypeScript coinciden con la BD

---

**Estado:** ✅ Scripts creados, listos para ejecutar
**Próximo paso:** Actualizar formulario de créditos con nueva UI
