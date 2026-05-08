# Sesión Activa — CREDIPHONE

## Estado: TICKETS / QR / ALMACENAJE / LEGAL ✅ (2026-05-07)

**Última sesión:** 2026-05-07 — Plan "Tickets, QR Entrega, Recordatorios y Protección Legal" completo
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
| C1 — Descontar stock al entregar | ✅ | entregar/route.ts fire-and-forget |
| C2 — Ajuste stock con motivo | ✅ | PATCH ajustar_stock con motivo obligatorio |

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

## Marco legal implementado

| Componente | Dónde |
|-----------|-------|
| Cláusula LFPC Art. 63 firmada por cliente | PDF de orden (T4) |
| Aviso 30 días en WA al marcar listo | generarMensajeListoEntrega (T6) |
| Banner de plazo en tracking del cliente | /tracking/[token] (T5) |
| Panel de alertas por días sin recoger | /dashboard/almacenaje (T3) |
| Cron automático días 15/25/30/60/90 | /api/cron/recordatorios-reparaciones (T3b) |

---

## Fases de implementación completadas esta sesión (2026-05-07)

- ✅ **T6** — WA: "15 días" → "30 días naturales" con aviso de tarifa
- ✅ **T4** — PDF: cláusula legal de resguardo (LFPC Art. 63)
- ✅ **T1** — Ticket 58mm: letra legible, QR de identificación, firma al entregar
- ✅ **T2** — /reparacion/{folio}: banner entrega para empleados autenticados
- ✅ **T3** — API + panel de almacenaje con WA por fila
- ✅ **T3b** — Cron endpoint automático (días objetivo: 15/25/30/60/90)
- ✅ **T5** — Tracking: banner de plazo cuando estado=listo_entrega
- ✅ **T7** — Sidebar: link "Almacenaje" para admin

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
