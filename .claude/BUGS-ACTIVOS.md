# Bugs Activos — CREDIPHONE
> Leer al inicio de sesión si la tarea toca BD, auth, caja o reparaciones.
> Última actualización: 2026-05-07

---

## BUG-TRACK-001 — Token de tracking no se genera si se salta estado "presupuesto"
**Severidad:** Alta | **Estado:** Pendiente de implementar
**Descripción:** `crearTrackingToken()` solo se invoca al transicionar a `"presupuesto"`. Si el técnico avanza directamente de `recibido` → `aprobado` o `en_reparacion` (cliente aprobó en tienda, o `requiereAprobacion = false`), nunca se genera el token. El cliente no tiene link de seguimiento.
**Archivo afectado:** `src/app/api/reparaciones/[id]/route.ts` (PUT handler)
**Fix propuesto:** Al cambiar a cualquier estado > recibido, si no existe token, generarlo automáticamente.

---

## BUG-TRACK-002 — Costo y cotización ocultos en tracking cuando requiereAprobacion = false
**Severidad:** Media | **Estado:** Pendiente de implementar
**Descripción:** Cuando `requiereAprobacion = false` y la orden está en estado `presupuesto`, el cliente accede al tracking pero ve una página casi vacía: el panel de autorización no aparece (porque `requiereAprobacion = false`) y el costo total tampoco (porque `mostrarCosto = tieneCosto && estado !== "presupuesto"`). Tampoco ve los servicios contizados.
**Archivo afectado:** `src/app/tracking/[token]/page.tsx` (líneas ~1206, ~1260)
**Fix propuesto:** Mostrar costo siempre si existe. Mostrar `piezasCotizacion` también en estado `presupuesto`.

---

## BUG-WA-001 — WhatsApp en OrdenCard abre sin mensaje precargado
**Severidad:** Media | **Estado:** Pendiente de implementar
**Descripción:** El botón WhatsApp en el PhoneMenu de OrdenCard abre `wa.me/52${phone}` sin mensaje. Anteriormente sí cargaba un mensaje de contexto. La función `generarMensajeSeguimiento(orden)` existe en `whatsapp-reparaciones.ts` y puede usarse.
**Archivo afectado:** `src/components/reparaciones/cards/OrdenCard.tsx` (PhoneMenu, línea ~71)
**Fix propuesto:** Importar `generarMensajeSeguimiento` y `generarLinkWhatsApp`, usarlos en el href del botón WA.

---

## BUG-PIEZAS-001 — PiezasPendientesPanel sin botón WhatsApp por pieza
**Severidad:** Baja | **Estado:** Pendiente de implementar
**Descripción:** El panel de piezas pendientes al proveedor muestra folio + botón para abrir la orden, pero no tiene botón de WhatsApp para notificar al cliente sobre el estado de la pieza. La función `generarMensajePiezaEnEspera()` existe.
**Archivo afectado:** `src/components/reparaciones/PiezasPendientesPanel.tsx`

---

## ✅ SECURITY-003 — wa_access_token cifrado
**Severidad:** RESUELTO
**Estado:** ✅ Implementado 2026-05-01

Cifrado AES-256-GCM aplicado al `wa_access_token` en `configuracion`.
Llave almacenada en Cloudflare secret `WA_ENCRYPTION_KEY`.
El frontend nunca recibe el token (retorna `undefined` en `configuracion.ts`).

---

## ✅ Resueltos recientemente (referencia rápida)

### Resueltos en sesión 2026-04-12
- **costo_total GENERATED ALWAYS** ✅ — eliminado de todos los INSERT/UPDATE en `reparaciones.ts`
- **PDF "orden no encontrada"** ✅ — join `tecnico_id` corregido a columna `name` (no `nombre/apellido`)
- **PDF error silencioso** ✅ — ahora muestra el error real al usuario
- **presupuestoTotal no mapeado** ✅ — `precio_total` ahora se mapea en `mapOrdenFromDB`
- **Ticket QR subía fotos** ✅ — ahora apunta a `/reparacion/{folio}` (consulta/entrega)

### Resueltos en sesión 2026-04-06
- RLS-001 ✅ — 17 políticas RLS cross-tenant corregidas
- PAGES-002 ✅ — Race condition en fetches (5 páginas corregidas)
- DB-002 ✅ — `servicios.distribuidor_id` NOT NULL aplicado

### Historial completo
Ver `ARCHIVO/BUGS-RESUELTOS.md`
- CAJA-001, CAJA-002 ✅ commit feedae4
- MULTITENANT-001 a 007 ✅ commits feedae4, 2026-03-29
- REACT-301 ✅ commit 8530a69
- SECURITY-001, 002 ✅ commit 7a5e4f5
- DOCBUG-001, 002, 003 ✅ sesión 2026-03-29
