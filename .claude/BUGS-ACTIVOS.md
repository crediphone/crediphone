# Bugs Activos — CREDIPHONE
> Leer al inicio de sesión si la tarea toca BD, auth, caja o reparaciones.
> Última actualización: 2026-04-06

---

## 🔴 RLS-001 — 26 tablas sin Row Level Security
**Severidad:** CRÍTICO — Riesgo de seguridad en producción
**Estado:** ❌ Pendiente

Si alguien obtiene la `SUPABASE_ANON_KEY` (pública en el frontend), puede leer estas tablas directamente desde el navegador sin autenticación.

**Tablas críticas sin RLS:**
`configuracion` (tiene RFC, wa_access_token, comisiones), `confirmaciones_deposito`, `log_autorizaciones`, `traspasos_anticipo`, `servicios`, `devoluciones`

**Tablas completas afectadas (26):**
asistencia_sesiones, catalogo_servicios_precios_distribuidor, catalogo_servicios_reparacion, configuracion, confirmaciones_deposito, devoluciones, devoluciones_items, folios_reparacion, garantias_piezas, log_autorizaciones, lotes_piezas, lotes_piezas_items, ordenes_compra, ordenes_compra_items, permisos_empleado, plantillas_notificacion, pos_scan_sessions, promociones, push_subscriptions, reparacion_piezas, reparacion_tiempo_logs, servicios, solicitudes_piezas, subcategorias, traspasos_anticipo, whatsapp_mensajes

**Para resolver:** Auditoría Área 1 de Seguridad.

---

## 🟠 SECURITY-003 — wa_access_token en texto plano
**Severidad:** ALTO
**Estado:** ❌ Pendiente

La columna `wa_access_token` de la tabla `configuracion` guarda el token de WhatsApp Business API en texto plano. Si se explota RLS-001, este token queda expuesto.

**Fix sugerido:** Priorizar fix de RLS-001 para `configuracion`. A largo plazo: cifrar con `pgcrypto` o mover a variable de entorno por distribuidor.

---

## 🟢 PAGES-002 — Race condition en fetches
**Severidad:** BAJO
**Estado:** ❌ Pendiente

Varias páginas ejecutan `fetchData()` sin esperar confirmación de rol del usuario. La API devuelve 403 pero hay un request innecesario antes de que el guard de rol corra.

**Páginas afectadas:** empleados, dashboard principal, clientes.

**Fix:** Condicionar fetch dentro del useEffect que verifica rol: `if (user && hasRole) fetchData()`

---

## 🟢 DB-002 — servicios.distribuidor_id nullable
**Severidad:** BAJO
**Estado:** ❌ Pendiente

La tabla `servicios` tiene `distribuidor_id UUID NULLABLE`. Permite insertar servicios sin distribuidor, rompiendo el aislamiento multi-tenant.

**Fix:** Migración SQL: `ALTER TABLE servicios ALTER COLUMN distribuidor_id SET NOT NULL;`
Verificar que no haya filas con NULL antes de aplicar.

---

## ✅ Resueltos recientemente (referencia rápida)
Ver `ARCHIVO/BUGS-RESUELTOS.md` para historial completo.
- CAJA-001, CAJA-002 ✅ commit feedae4
- MULTITENANT-001 a 007 ✅ commits feedae4, 2026-03-29
- REACT-301 ✅ commit 8530a69
- SECURITY-001, 002 ✅ commit 7a5e4f5
- DOCBUG-001, 002, 003 ✅ sesión 2026-03-29
