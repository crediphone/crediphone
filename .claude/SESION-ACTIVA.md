# Sesión Activa — CREDIPHONE

## Estado: TRAZABILIDAD + COBRO POS + DEPLOY FIXES ✅ (2026-05-09)

**Última sesión:** 2026-05-09 — P1/P2/P5 implementados + 3 bugs de deploy + 1 bug de cobro resueltos
**Historial:** `ARCHIVO/HISTORIAL-SESIONES.md`

---

## Módulos activos y funcionales

| Módulo | Estado | Notas |
|--------|--------|-------|
| Reparaciones (órdenes, drawer, stepper) | ✅ | Completo |
| PDF de orden | ✅ | Con cláusula legal almacenaje (T4) |
| Tracking cliente | ✅ | Banner almacenaje en listo_entrega (T5) |
| Ticket térmico 58mm | ✅ | Con QR de entrega en header (T1) |
| /reparacion/{folio} — QR entrega | ✅ | Banner empleado con botón al dashboard (T2) |
| Panel Almacenaje | ✅ | /dashboard/almacenaje — con WA por fila (T3) |
| Cron recordatorios | ✅ | POST /api/cron/recordatorios-reparaciones (T3b) |
| Sidebar Almacenaje | ✅ | Link "Almacenaje" para admin/super_admin (T7) |
| WA listo_entrega | ✅ | Corregido "15 días" → "30 días naturales" (T6) |
| movimientos_stock en ventas POS | ✅ | P1 — fire-and-forget en createVenta() |
| Flujo entrega completo desde POS | ✅ | P2 — ejecutarEntregaCompleta() en reparacion-cobro |
| Campo costo envío en piezas | ✅ | P5 — input en OrdenDrawer, guarda a DB |
| Cobro reparación POS | ✅ | Bug presupuesto_total resuelto |
| Filtro ubicación en /dashboard/productos | ✅ | window.location.search (sin useSearchParams) |

---

## ⚠️ PENDIENTE — Aplicar migración en Supabase

**Archivo:** `supabase/migrations/fase70-almacenaje-recordatorios.sql`

Contiene:
1. `ALTER TABLE configuracion ADD COLUMN tarifa_almacenaje_diaria NUMERIC(10,2) DEFAULT 30.00`
2. `CREATE TABLE recordatorios_enviados (...)` con RLS

**Sin esta migración:**
- Panel de almacenaje funciona (con fallback $30/día)
- Los recordatorios NO se guardan en BD (error al hacer POST)
- Ajustar en Supabase Dashboard → SQL Editor

---

## ⚠️ PENDIENTE — Cron en producción (opcional)

Para activar el cron automático de recordatorios:
1. Agregar a `wrangler.toml`:
   ```toml
   [triggers]
   crons = ["0 16 * * *"]   # 10am CDT (UTC-6)
   ```
2. Agregar variable de entorno `CRON_SECRET` en Cloudflare
3. Configura el cron para llamar a `POST /api/cron/recordatorios-reparaciones`
   con header `Authorization: Bearer {CRON_SECRET}`

---

## ⏳ PENDIENTE — Plan de mejoras (aprobado por Trini, no implementado aún)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| P3 | Piezas verificadas → opción de ingresar al inventario | Media |
| P4 | Venta de teléfonos en POS (contado vs crédito con IMEI) | Media |
| W3 | Rediseño íconos POS para móvil (productos primero) | Baja |

---

## Implementado esta sesión (2026-05-09)

### P1 — Trazabilidad stock en ventas POS
- **Archivo:** `src/lib/db/ventas.ts`
- Después de insertar `ventas_items`, inserta fire-and-forget en `movimientos_stock`
- Tipo: `"venta_pos"`, incluye stock_antes/stock_despues, referencia al folio de venta

### P2 — Flujo completo de entrega desde POS cobro
- **Archivo:** `src/app/api/pos/reparacion-cobro/route.ts`
- Función `ejecutarEntregaCompleta()` se ejecuta cuando `tipo === "saldo_final"` y `nuevoSaldo <= 0`
- Acciones: marca anticipos como aplicados, calcula ingreso neto, inserta movimientos_bolsa_virtual, descuenta stock de piezas instaladas, acumula puntos loyalty, registra historial_estado_orden

### P5 — Campo costo envío en formulario de piezas
- **Archivo:** `src/components/reparaciones/drawer/OrdenDrawer.tsx`
- Input nuevo "Costo envío" junto a "Costo pieza", lado a lado
- Guarda `costoEnvio` al DB vía `handleGuardarPedido`

### DEPLOY-BUG-006 — useSearchParams rompe build Turbopack
- **Archivos afectados:** `/dashboard/productos/page.tsx`, `/dashboard/reparaciones/page.tsx`
- Turbopack 16.2.1 detecta `useSearchParams()` en build-time aunque esté en `"use client"`
- **Solución:** `window.location.search` en `useEffect` con `useRef` para ejecutar solo una vez
- Documentado en `.claude/DEPLOY.md` y en memory `feedback_usesearchparams_turbopack.md`

### BUG-COBRO-001 — "Orden no encontrada" al cobrar desde POS
- **Archivo:** `src/app/api/pos/reparacion-cobro/route.ts`
- La columna `presupuesto_total` NO existe en `ordenes_reparacion`
- PostgREST devolvía error en el SELECT → el código lo interpretaba como 404
- **Fix:** Removida del SELECT y del fallback. Solo usa `precio_total || costo_total`

---

## Marco legal implementado

| Componente | Dónde |
|-----------|-------|
| Cláusula LFPC Art. 63 firmada por cliente | PDF de orden (T4) |
| Aviso 30 días en WA al marcar listo | generarMensajeListoEntrega (T6) |
| Banner de plazo en tracking del cliente | /tracking/[token] (T5) |
| Panel de alertas por días sin recoger | /dashboard/almacenaje (T3) |
| Cron automático días 15/25/30/60/90 | /api/cron/recordatorios-reparaciones (T3b) |

---

## Reglas de negocio clave (NUNCA cambiar sin preguntar)

- Precio all-in: `precioUnitario` incluye pieza + instalación + envío
- Bolsa Virtual: anticipos independientes de caja
- Ingreso neto: `precio_total - sum(costo_pieza + costo_envio)`
- Cancelación + pieza llegó: costo de pieza SE RETIENE del anticipo
- Cancelación + pieza no llegó: se devuelve TODO el anticipo
- Pieza defectuosa: monto queda `en_disputa=true` en bolsa
- no_reparable: piezas pendientes requieren resolución manual
- **Almacenaje: 30 días gratis → tarifa diaria → 90 días → disposición (LFPC Art. 63)**
- NUNCA eliminar funcionalidades existentes — solo agregar

---

## TypeScript / Deploy

```bash
# Verificar TypeScript (desde la raíz del repo):
node "C:\Users\usuario 1\crediphone\node_modules\typescript\bin\tsc" --noEmit

# Deploy: push a master → GitHub Actions → Cloudflare Workers automático
git push origin HEAD:master
```
