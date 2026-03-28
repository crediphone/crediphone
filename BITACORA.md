# BITÁCORA DE DESARROLLO — CREDIPHONE
> **Para Claude:** Este es el PRIMER archivo que debes leer al inicio de cada sesión, ANTES que CLAUDE.md.
> Aquí está el estado real del proyecto: qué funciona, qué está roto, qué sigue.
> Si no ves instrucciones de sesión aquí, pídele a Trini que te diga en qué fase vas.

---

## 🔴 BUGS CRÍTICOS ACTIVOS — NO TOCAR HASTA RESOLVERLOS

### [SECURITY-001] 17 API Routes sin autenticación propia
**Severidad:** CRÍTICA
**Detectado:** 2026-03-18
**Estado:** ✅ RESUELTO — commit `7a5e4f5` (2026-03-18)
**Solución:** Creado `src/lib/auth/guard.ts` con helper `requireAuth(roles?)`.
Aplicado a las 17 rutas. tsc --noEmit: LIMPIO.

---

### [SECURITY-002] Multi-tenant roto en Reportes
**Severidad:** CRÍTICA
**Detectado:** 2026-03-18
**Estado:** ✅ RESUELTO — commit `7a5e4f5` (2026-03-18)
**Solución:** `/api/reportes/route.ts`, `/api/reportes/comisiones/route.ts` y
`/api/reportes/pdf/route.ts` ahora filtran por `distribuidor_id` cuando
el usuario no es super_admin.

---

### [REACT-001] 27 errores de ESLint — React/lógica
**Severidad:** ALTA
**Estado:** ✅ RESUELTO — commit `1085bd5` (2026-03-18)
**Archivos con errores CRÍTICOS (no solo warnings):**

| Archivo | Error | Impacto |
|---|---|---|
| `src/components/inventario/BarcodeScanner.tsx:32` | `stopCamera` usada antes de declarar | Crash en cleanup de cámara |
| `src/components/pos/ProductSearchBar.tsx:38` | Variable accedida antes de declarar | Comportamiento indefinido |
| `src/components/pos/PaymentMethodSelector.tsx:39` | Variable accedida antes de declarar | Comportamiento indefinido |
| `src/components/reparaciones/patron/CapturaPatron.tsx:37` | Mutación directa de valor inmutable | Error silencioso en React 19 |
| `src/components/reparaciones/cards/OrdenCard.tsx:185` | `Date.now()` llamado en render | Inconsistencia en hydration |
| `src/components/DistribuidorProvider.tsx:67` | `setState` síncrono en efecto | Renders en cascada, UI parpadea |
| `src/components/layout/DashboardShell.tsx:38` | `setState` síncrono en efecto | Renders en cascada |
| `src/components/layout/Header.tsx:16` | `setState` síncrono en efecto | Renders en cascada |
| `src/components/ui/Portal.tsx:16` | `setState` síncrono en efecto | Modales pueden parpadear |
| `src/components/reparaciones/confirmaciones/PanelConfirmacionesDeposito.tsx:279` | `setState` síncrono en efecto | Renders en cascada |
| `src/components/reparaciones/firma/SelectorTipoFirma.tsx:32` | `setState` síncrono en efecto | Renders en cascada |
| `src/app/catalogo/page.tsx:909,986` | Comillas sin escapar en JSX | Hydration error en prod |

**Warnings recurrentes (no bloquean pero deben resolverse):**
- 12 componentes con `useEffect` sin dependencias correctas (`react-hooks/exhaustive-deps`)
- 7 imágenes usando `<img>` en lugar de `<Image />` de Next.js (performance)

---

## ✅ FASES COMPLETADAS (no rehacer)

| Fase | Descripción | Commit |
|---|---|---|
| 1-10 | CRUD base: clientes, créditos, pagos, productos, empleados, reparaciones | — |
| 11-15 | POS, caja, inventario avanzado, scoring, recordatorios | — |
| 16-19 | Reparaciones avanzadas: fotos QR, piezas, garantías, anticipos, PDFs | — |
| 20 | Integración Payjoy: webhooks, sync pagos, panel config | — |
| 21 | Multi-tenant: tabla distribuidores, distribuidor_id en todas las tablas | — |
| 22-23 | Cartera vencida, recálculo mora automático | — |
| 24 | Solicitudes y garantías de piezas | — |
| 25 | Caja con distribuidor nullable | — |
| 26 | users.distribuidor_id nullable + fix crear empleados | — |
| 27 | Campos equipo en productos (imei, color, ram, almacenamiento, folio_remision) + parser WINDCEL + PDF remisión | `edf2b37` |
| 28 | POS + Caja unificados: modal abrir/cerrar turno desde POS, aviso si otro empleado tiene caja abierta, badge de estado en header | `6a73b96` |
| 29 | POS dual mode — Standard (F-keys: F3 búsqueda, F4 cantidad, F9/F10 cobro) + Visual (grid por categoría, touchscreen) | `f69e173`, `0952bbf` |
| 30 | Selección cliente en POS + captura IMEI al vender equipo serializado + notas por venta/ítem + alertas demanda | `32ddc77`, `4ba6a5b` |
| 31 | Reporte X (snapshot turno sin cerrar) + Reporte Z (cierre formal PDF) + exportar cualquier tabla a Excel | `b91e299` |
| 32 | Tickets térmicos 58mm en todos los módulos (venta POS, recepción reparación con QR, entrega, pago crédito) | `5fe292a` |
| 33 | Devoluciones parciales por línea en POS + pedidos flotantes (venta en espera) + regla Payjoy + config extendida | `db0b158`, `4ff9c6e` |
| 34 | Tarjetas interactivas + Drawer lateral en reparaciones | `68afa8d` |
| 34b | Modal mixto + esperando_piezas + overdue WhatsApp | `98c9032` |
| 36 | Servicios sin inventario — POS integrado con carrito mixto productos+servicios + categorías dinámicas | `4bc4c50` |
| 37 | Control de traspasos anticipo técnico → vendedor (anti-fraude) | `07c89a8` |
| 38 | Confirmación de depósitos/transferencias | `97f5592` |
| 39 | Sistema de autorización de descuentos: zonas verde/amarillo/rojo, polling, WhatsApp token, panel admin, config | `614ede1` |
| SEC | SECURITY-001 + SECURITY-002: 17 API routes con auth + multi-tenant reportes | `7a5e4f5` |
| REACT-001 | 12 errores críticos ESLint: vars before declare, setState en effects, mutación state, Date.now en render, JSX quotes | `1085bd5` |
| Sesión Visual | Íconos corregidos (7) + Sidebar reorganizado en 7 grupos | `a05a948` |
| 40 | Conteo ciego, fondo fijo, Pay In/Out, tolerancia descuadre, alerta admin | `68ae3fc` |
| 44 | Dashboard ejecutivo por rol (widgets distintos: admin ve KPIs completos, vendedor ve su turno, técnico sus órdenes) | `1ede15d` |
| 45 | Sistema WhatsApp — plantillas configurables + notificaciones automáticas por cambio estado reparación | `63a8808` |
| 46 | Órdenes de Compra a Proveedores — flujo completo con recepción de mercancía y actualización de stock | `2ee1daf` |
| 47-lite | Resumen para contador — descarga PDF/WhatsApp con ingresos del período configurable | `a97b166` |
| 48 | Portal de tracking de reparaciones para cliente final (link público por orden) | `9892e0e` |
| 49 | Exportar tablas a CSV — créditos, pagos, clientes, reparaciones | `3e3ebef` |
| 50 | P&L básico mensual: Estado de Resultados en Reportes (ingresos − costos = utilidad) | `a643108` |
| Iconos-1 | Iconos PNG en checklist condiciones reparación + campo centroCarga | `bf29094` |
| Iconos-2 | Marco+Bisel unificados en un botón + todos los iconos PNG en estado físico | `90a8dd9` |
| Iconos-3 | Iconos contenidos en su cuadro (overflow-hidden + fill) en ambos grids | `366f22c` |
| Iconos-4 | Iconos nuevos (apagado, mojado, batería hinchada, QR, subir-foto) + nombres cortos en componentes | `fa99d25` |
| 35 | Centro de Promociones con opt-in seguro + tracking page con promos reales desde BD | `130e934`, `956e207` |
| 41+ | Tab "Cobrar Rep." en POS: buscador, anticipo, cobro final, auto-entrega saldo=$0 | `b540863` |
| 42+ | Sistema Lotes de Piezas: tabla BD, recepción, verificación, distribución costo envío | `36a0994` |
| 51 | Sidebar reorganizado en 8 grupos funcionales por prioridad de negocio | — |
| 52 | Liquid Glass en íconos del sidebar | — |
| 53 | Dashboard Ejecutivo Persistente — Command Center con auto-refresh 3min | `25205bf` |
| FIX | Hydration mismatch WhatsApp + async params Next.js 15/16 en lotes-piezas | `6d22fe4` |
| 54a | Catálogo de Servicios de Reparación — tabla BD, CRUD admin, precarga en órdenes | migraciones `fase54a/b` |
| 55 | Control de Asistencia / Reloj Checador — QR/PIN, WidgetChecador, `/dashboard/asistencia` | migración `fase55` |
| FIX | mapProductoFromDB en productos.ts (todos los campos camelCase), codigoBarras/sku en updateProducto | `3799f21` |
| FIX | Etiquetas: QR más grande, borde de corte visible 1.5pt, precio más grande, CODE128 en printRef | `3d24152`, `8a43a91` |
| FIX | resumen-pos/route.ts: params como Promise (Next.js 16) — arreglaba build Vercel | `7ff4308` |
| FIX | npm audit fix: 0 vulnerabilidades (ajv, dompurify, flatted, minimatch) | `5f7a92f` |
| **MIGRACIÓN** | **Deploy completo a Cloudflare Workers + R2. Vercel abandonado.** | Ver sección abajo |

---

## 🚀 MIGRACIÓN VERCEL → CLOUDFLARE (2026-03-25 al 2026-03-28)

### Estado post-migración: ✅ COMPLETADA

**Stack nuevo:**
- **Deploy:** `@opennextjs/cloudflare` → Cloudflare Workers
- **Storage:** Cloudflare R2 bucket `crediphone-storage` (binding `R2_BUCKET`)
- **URL pública R2:** `https://pub-89451411d31c49d9959b166475cda47a.r2.dev`
- **Dominio:** `https://crediphone.com.mx` → Cloudflare Worker `crediphone`
- **Script deploy:** `npm run deploy:cf` en el directorio del proyecto
- **Token Cloudflare:** `crediphone-wrangler-deploy` (con permisos Workers Scripts + R2 + Builds)

**Comandos de deploy (desde VM o máquina con wrangler auth):**
```bash
CLOUDFLARE_API_TOKEN=<token> npx opennextjs-cloudflare build
CLOUDFLARE_API_TOKEN=<token> npx opennextjs-cloudflare deploy
```

**PROBLEMA CONOCIDO — Deploy desde VM:**
El `wrangler login` en la VM de Cowork no persiste entre sesiones. Solución: usar `CLOUDFLARE_API_TOKEN` explícito. El token `crediphone-wrangler-deploy` puede renovarse desde `dash.cloudflare.com/profile/api-tokens`.

---

### Fixes aplicados post-migración

| Commit | Fix | Problema original |
|---|---|---|
| `a3ae5d1` | QR fotos y scan-session usan `new URL(request.url)` en lugar de `NEXT_PUBLIC_BASE_URL` | QR apuntaba a `localhost:3000` en producción |
| `a5afa19` | `obtenerUrlImagen()` sirve imágenes antiguas desde Supabase Storage | Imágenes de productos no cargaban (URL vacía) |
| `a99dea4` | `obtenerUrlImagen()` distingue Supabase vs R2 por número de segmentos del path; `productos/page.tsx` y `clientes/page.tsx` guardan URL completa en BD | Nuevas subidas a R2 con path relativo de 3+ segmentos se mapeaban incorrectamente a Supabase |
| `dbdc50b` | Bug C3: stock insuficiente en reparaciones devuelve 409 con `sinStock:true` | Error 500 genérico al agregar pieza sin stock |
| (sesión anterior) | Bug C1+C2: bolsa virtual POS suma anticipos pendiente+aplicado; traspaso creado al cobrar sin sesión de caja | Saldo incorrecto mostrado al vendedor |

---

### Estado actual del storage de imágenes

| Tipo de imagen | Dónde vive | Cómo se identifica en BD |
|---|---|---|
| Productos legacy (antes Mar 25) | Supabase Storage bucket `productos` | Path plano: `productos/filename.jpg` (2 segmentos) |
| Productos nuevos (Mar 26+) | Cloudflare R2 | URL completa: `https://pub-89451.../productos/productos/...` |
| Reparaciones (fotos QR y admin) | Cloudflare R2 | URL completa: `https://pub-89451.../reparaciones/...` |
| Documentos clientes (INE, etc.) | Cloudflare R2 | URL completa: `https://pub-89451.../productos/documentos/...` |

**Imágenes perdidas:** 6 productos con imágenes que no existen ni en Supabase ni en R2 (subidas durante la transición Mar 25). Deben re-subirse manualmente desde el panel de edición de productos.

**`obtenerUrlImagen()` lógica actual (storage.ts):**
```
path.startsWith("http")       → devolver tal cual (R2 url completa)
path tiene 2 segmentos y empieza con "productos/" → Supabase Storage (legacy)
cualquier otro path            → R2 CDN (multi-nivel)
```

---

### Variables de entorno críticas (.env.local Y wrangler.jsonc vars)

```
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-89451411d31c49d9959b166475cda47a.r2.dev
NEXT_PUBLIC_BASE_URL=https://crediphone.com.mx   ← solo fallback, las rutas usan request.url
NEXT_PUBLIC_APP_URL=https://crediphone.com.mx    ← solo fallback
```

**IMPORTANTE:** Las variables `NEXT_PUBLIC_*` se inyectan en build time desde `.env.local`. Si cambia alguna, hay que reconstruir y redesplegar. Las vars en `wrangler.jsonc [vars]` NO sobreescriben las del build para variables `NEXT_PUBLIC_*` (son static inline).

---

## ⏳ PLAN DE ACCIÓN — PRÓXIMAS SESIONES

### 🔧 SESIÓN INMEDIATA PENDIENTE: Seguridad + React
**Lo que debes decirle a Claude:**
> "Lee BITACORA.md. Vamos a corregir SECURITY-001, SECURITY-002 y REACT-001. Empieza por las 17 routes sin auth, luego los errores de React críticos."

**Orden de trabajo:**
1. Crear helper `requireAuth(roles?)` en `src/lib/auth/guard.ts`
2. Aplicar a las 17 routes en orden: pagos → creditos → empleados → productos → reportes → reparaciones → resto
3. Corregir 7 errores React críticos (variables antes de declarar, setState en effects)
4. Ejecutar `tsc --noEmit` y `eslint` al final para verificar

---

### 🎨 SESIÓN VISUAL: Íconos + Sidebar
**Lo que debes decirle a Claude:**
> "Lee BITACORA.md. Sesión de UX: corrige los 5 íconos críticos en Sidebar.tsx y reorganiza el sidebar de 25 ítems a 7 grupos con separadores."

**Cambios específicos de íconos (Sidebar.tsx):**
```
MapPin       → ClipboardCheck      (Inventario/verificar)
AlertTriangle (×2) → CalendarX2 y PackageX  (Cartera Vencida / Alertas Stock)
Settings     → Cpu                 (Técnico panel)
ShoppingCart → Store               (POS)
DollarSign   → BadgeDollarSign     (Comisiones)
Landmark     → Vault               (Caja)
Layers       → WarehouseIcon       (Ubicaciones)
```

**Reorganización sidebar (25 ítems → 7 grupos):**
```
── INICIO ──────────────────────────
  Dashboard
  Distribuidores (solo super_admin)

── VENTAS ──────────────────────────
  POS — Venta
  Caja / Turno
  Historial Ventas
  Payjoy

── CRÉDITOS Y CLIENTES ─────────────
  Clientes
  Créditos
  Cobros y Pagos
  Recordatorios

── INVENTARIO ──────────────────────
  Catálogo (Productos + Categorías + Proveedores como tabs)
  Stock y Ubicaciones (Verificar + Ubicaciones + Alertas como tabs)

── REPARACIONES ────────────────────
  Órdenes
  Panel Técnico (antes: KPI Reparaciones + Técnico)

── REPORTES ────────────────────────
  Reportes Financieros
  Cartera y Mora

── ADMINISTRACIÓN ──────────────────
  Empleados
  Configuración
```

---

### 📊 FASE 40 — ✅ COMPLETADA (commit `68ae3fc`, 2026-03-18)
Conteo ciego por denominaciones, fondo fijo configurable, Pay In/Out, tolerancia descuadre, alerta admin si descuadre > tolerancia.

---

### 📊 FASE 35 — ✅ COMPLETADA (commits `130e934` + `956e207`, 2026-03-19)
Centro de Promociones con opt-in seguro: tabla `promociones`, CRUD admin, consentimiento presencial WhatsApp, endpoint público `/api/tracking/[token]/promociones`, integración en tracking page con promo cards dinámicas (descuento %, botón WhatsApp contextual).

---

### 📊 FASE 41 — ✅ COMPLETADA (commits `cf1b789` + `b540863`)
- Bolsa virtual de reparaciones en caja: `sesion_caja_id` en `anticipos_reparacion`, `getAnticiposBySesion()`, `getAnticiposSinSesion()` (anti-fraude), sección "Bolsa de Reparaciones" en vista sesión activa, banner de anticipos sin sesión para admin/super_admin.
- Tab "Cobrar Rep." en POS (`b540863`, 2026-03-21): `ReparacionesPOSPanel.tsx`, búsqueda por folio/cliente/teléfono, modal anticipo, modal cobro final, auto-estado "entregado" cuando saldo=$0. APIs: `/api/pos/reparacion-buscar` y `/api/pos/reparacion-cobro`.

---

### 📊 FASE 42 — ✅ COMPLETADA (commits `a4f78c8` + `36a0994`)
- Sidebar con acordeones colapsables: NavAccordion + AccordionNavItem. INVENTARIO colapsado en 2 grupos (Catálogo + Stock), REPARACIONES panel por rol, REPORTES simplificado.
- Sistema Lotes de Piezas (`36a0994`, 2026-03-21): tablas `lotes_piezas` + `lotes_piezas_items` (migración `fase42_lotes_piezas_v2` aplicada en Supabase). `src/lib/db/lotes-piezas.ts`, 5 rutas API, página `/dashboard/lotes-piezas`, `distribuirCostoEnvio()` proporcional. Sidebar: ícono Package en grupo INVENTARIO. FK correcta: `ordenes_reparacion` (NO `reparaciones`).

---

### 📊 FASE 43 — ✅ COMPLETADA (commit `72bff11`, 2026-03-18)
Aging report + tasa de mora real: `/api/creditos/aging` con 6 buckets (corriente/1-30/31-60/61-90/91-120/+120), tasaMoraConteo, tasaMoraMonto, moraAcumulada. UI: panel sobre la lista con KPIs + tabla de buckets color-coded.

---

### 📊 FASE 51 — ✅ COMPLETADA
Sidebar reordenado por prioridad de negocio en 8 grupos funcionales.

---

### 📊 FASE 52 — ✅ COMPLETADA
Liquid Glass en íconos del sidebar: backdrop-filter, glow activo.

---

### 📊 FASE 53 — ✅ COMPLETADA (commit `25205bf`)
Dashboard Ejecutivo Persistente: Command Center para admin/super_admin, KPIs en tiempo real, OrdenesWidget, AccionesRápidas, ActivityStream, auto-refresh 3 min.

---

### 🔧 FIX — hydration mismatch + async params (commit `6d22fe4`, 2026-03-21)
- Footer, CarritoFlotante, FormularioCotizacion: número WhatsApp unificado a `NEXT_PUBLIC_WHATSAPP_SOPORTE || "526181245391"` (eliminado placeholder `5215512345678`)
- Rutas API `lotes-piezas/[id]` y subrutas: params migrados a `Promise<{...}>` (Next.js 15/16)

---

### 📊 FASE 54a — ✅ COMPLETADA (migraciones `fase54a-catalogo-servicios-reparacion.sql` + `fase54b-orden-catalogo-servicio.sql`)
Catálogo de Servicios de Reparación: tabla `catalogo_servicios_reparacion`, CRUD admin en `/dashboard/admin/catalogo-reparaciones`, precarga de servicio al crear orden, API `/api/catalogo-servicios/`.

---

### 📊 FASE 55 — ✅ COMPLETADA (migración `fase55-asistencia-checador.sql`)
Control de Asistencia / Reloj Checador: tabla `asistencia_registros`, check-in/out por QR o PIN, `WidgetChecador.tsx`, página `/dashboard/asistencia/`, API `/api/asistencia/activa` + `/checkout`.

---

### 🔄 FASES PENDIENTES (no iniciadas — esperar indicación de Trini)
- FASE 54: Facturación CFDI (integración Facturapi)
- FASE 56: WhatsApp Business API oficial (plantillas aprobadas Meta, historial, doble tick) — infraestructura parcial ya existe (`/api/whatsapp/`, `WhatsAppAPITab.tsx`), falta integración Meta completa
- FASE 57: Links de pago (Clip, Conekta) — enviar link de cobro al cliente por WhatsApp

### ⚠️ CÓDIGO SIN MIGRACIÓN BD — fallan en producción hasta que se apliquen:
- **FASE 61 — Kits**: `src/lib/db/kits.ts`, `src/app/api/kits/`, `src/app/dashboard/productos/kits/`, `KitsPOSPanel.tsx` → tablas `kits` y `kits_items` NO existen en Supabase
- **FASE 62 — Series por Lote**: `src/lib/db/lotesSeries.ts` → tablas `lotes_series` y `lotes_series_items` NO existen en Supabase

---

## 📋 PROTOCOLO DE INICIO DE SESIÓN — Lo que Trini dice y Claude hace

### Frase de inicio que Trini debe usar:
```
"Lee BITACORA.md. [Objetivo de la sesión]."
```

### Lo que Claude DEBE hacer al leer eso:
1. Leer `BITACORA.md` (este archivo)
2. Leer `CLAUDE.md` (arquitectura del sistema)
3. Leer `NOTAS_TRINI.md` si la sesión involucra caja, reparaciones, o reglas de negocio
4. Hacer `git status` para ver qué hay sin commitear
5. Hacer `npx tsc --noEmit` para verificar que no hay errores TypeScript activos
6. Reportar a Trini: "Estoy listo. El estado actual es: [X bugs activos / Y errores TS / todo limpio]"
7. NUNCA empezar a codificar sin este chequeo

### Al TERMINAR cada sesión, Claude debe:
1. Actualizar BITACORA.md: mover tareas de PENDIENTE a COMPLETADO
2. Agregar nuevos bugs encontrados a la sección BUGS CRÍTICOS
3. Hacer `npx tsc --noEmit` y reportar resultado
4. Hacer el commit con el mensaje de fase correcto
5. Decirle a Trini: "Sesión terminada. [Resumen de lo hecho]. Próxima sesión: [qué sigue]."

---

## 🗂️ MAPA DE ARCHIVOS IMPORTANTES

| Archivo | Para qué leerlo |
|---|---|
| `BITACORA.md` | Estado actual del proyecto, bugs activos, plan de acción |
| `CLAUDE.md` | Arquitectura técnica, stack, convenciones de código |
| `NOTAS_TRINI.md` | Reglas de negocio, lógica de caja, bolsa virtual, anti-fraude |
| `src/lib/auth/server.ts` | Cómo funciona `getAuthContext()` — leer SIEMPRE antes de tocar auth |
| `src/types/index.ts` | Todos los tipos TypeScript — leer antes de crear tipos nuevos |
| `src/components/layout/Sidebar.tsx` | Navegación — leer antes de agregar rutas |
| `src/app/dashboard/configuracion/page.tsx` | Cómo agregar configuraciones nuevas |

---

## 📌 DECISIONES TÉCNICAS PERMANENTES (no revertir)

1. **Auth:** Siempre `getAuthContext()`, nunca `getDistribuidorId()` solo
2. **DB Server-side:** Siempre `createAdminClient()`, nunca `createClient()` en API routes
3. **Multi-tenant:** Toda tabla nueva necesita `distribuidor_id`
4. **Sidebar:** Usar `var(--color-...)` CSS tokens, NUNCA clases Tailwind de color directo
5. **Fuentes:** Geist (`--font-ui`), Geist Mono (`--font-data`), JetBrains Mono (`--font-mono`). NUNCA Inter
6. **Números/IMEIs/folios:** SIEMPRE `font-mono` en el UI
7. **Proxy/Middleware:** El archivo se llama `src/proxy.ts` (no `middleware.ts`) y la función se llama `proxy`
8. **Commits:** Formato `FASE XX: descripción concisa` o `fix: descripción`
9. **Checklist antes de terminar sesión:** `npx tsc --noEmit` debe pasar limpio

---

## 🧠 CONTEXTO QUE CLAUDE PIERDE ENTRE SESIONES

Claude no tiene memoria entre conversaciones. Cada sesión nueva empieza desde cero.
Por eso existe este archivo. Si algo importante pasa en una sesión (nueva decisión, bug nuevo, cambio de plan), **Trini debe pedirle a Claude que actualice BITACORA.md antes de terminar**.

**Qué información recupera Claude leyendo BITACORA.md + CLAUDE.md + NOTAS_TRINI.md:**
- ✅ Estado real del proyecto
- ✅ Bugs activos y severidad
- ✅ Qué fases están hechas
- ✅ Qué sigue en orden de prioridad
- ✅ Reglas de negocio críticas (anti-fraude, bolsa virtual)
- ✅ Decisiones técnicas que no se deben cambiar
- ✅ Qué archivos leer antes de tocar qué módulo

**Qué NO recupera (limitación real):**
- ❌ Código exacto que se escribió en sesiones anteriores (debe leer los archivos)
- ❌ Conversaciones previas (debe inferirlas del código)
- ❌ Tono de la sesión anterior

---

*Última actualización: 2026-03-23 — Trini + Claude (FASES 54a + 55 verificadas y marcadas como completadas, FASE 56 renumerada, FASES 61+62 documentadas como código sin migración BD, fixes de sesión 2026-03-22/23 registrados)*

---

## 🔴 BUGS ENCONTRADOS EN AUDITORÍA 2026-03-28

> Auditoría completa: POS, caja, reparaciones, inventario, bolsa virtual, fotos QR, URLs, super_admin distribuidor.
> Todos verificados con evidencia de código y migración SQL.

---

### [CAJA-001] `caja_movimientos` — esquema de BD no soporta los tipos de la FASE 41

**Severidad:** CRÍTICO — Silencioso, en producción ahora mismo
**Detectado:** 2026-03-28
**Estado:** ✅ RESUELTO — commit `feedae4` (2026-03-28)

**El problema central:** La tabla `caja_movimientos` fue definida en FASE 18 con solo 7 columnas y un CHECK que solo acepta 2 tipos:
```sql
tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'retiro'))
-- Solo acepta: 'deposito' | 'retiro'
-- Columnas reales: id, sesion_id, tipo, monto, concepto, autorizado_por, created_at
```

Pero en FASES 37, 38, 40, 41 el código intenta insertar tipos y columnas que NO existen:
- `tipo: "cobro_reparacion"` → inválido (CHECK constraint)
- `tipo: "entrada_anticipo"` → inválido
- `tipo: "anticipo_reparacion"` → inválido
- `tipo: "pay_in"` / `"pay_out"` → inválidos
- `tipo: "devolucion_anticipo"` → inválido
- Columna `referencia_id` → NO EXISTE en la tabla
- Columna `distribuidor_id` → NO EXISTE en la tabla
- Columna `descripcion` → NO EXISTE (el correcto es `concepto`)
- Columna `registrado_por` → NO EXISTE

**Archivos afectados con fallo silencioso:**
1. `src/app/api/pos/reparacion-cobro/route.ts` líneas 149-160 → try-catch silencia el error
2. `src/lib/db/traspasos.ts` líneas 231-242 → try-catch silencia el error
3. `src/lib/db/confirmaciones.ts` líneas 186-195 → sin try-catch pero resultado no se destructura → silencioso

**Archivos afectados con lógica inservible:**
4. `src/lib/db/caja.ts` líneas 230-233 → `cerrarCaja()` busca tipos `"entrada_anticipo"`, `"pay_in"`, `"pay_out"` que NUNCA pueden existir en BD → totales de depositos/retiros siempre incorrectos

**Impacto real:**
- Los pagos de reparaciones cobrados desde el POS (FASE 41) NO quedan en el registro de caja
- Los traspasos anticipo técnico→vendedor (FASE 37) NO quedan en registro de caja
- Los depósitos/transferencias confirmados (FASE 38) NO quedan en registro de caja
- El Reporte Z siempre muestra un saldo incompleto (falta todo el dinero de reparaciones)
- El cuadre de caja al cierre de turno está mal cada vez que hay anticipos de reparación

**Fix requerido (migración SQL):**
```sql
-- 1. Eliminar el CHECK constraint viejo
ALTER TABLE caja_movimientos
  DROP CONSTRAINT IF EXISTS caja_movimientos_tipo_check;

-- 2. Agregar CHECK con todos los tipos válidos
ALTER TABLE caja_movimientos
  ADD CONSTRAINT caja_movimientos_tipo_check
  CHECK (tipo IN (
    'deposito',
    'retiro',
    'cobro_reparacion',
    'entrada_anticipo',
    'devolucion_anticipo',
    'pay_in',
    'pay_out'
  ));

-- 3. Agregar columnas faltantes
ALTER TABLE caja_movimientos
  ADD COLUMN IF NOT EXISTS referencia_id UUID,
  ADD COLUMN IF NOT EXISTS distribuidor_id UUID REFERENCES distribuidores(id);
```

**Fix en código (`confirmaciones.ts` línea 191):** Cambiar `descripcion` por `concepto`.

**Pregunta para Trini:** ¿Quieres que también agregue `registrado_por UUID` (quien confirmó)?

---

### [CAJA-002] Botones de cobro ocultos en órdenes con `costo_total = 0`

**Severidad:** CRÍTICO — Bloquea cobro de anticipos en órdenes nuevas
**Detectado:** 2026-03-28
**Estado:** ✅ RESUELTO — commit `feedae4` (2026-03-28)

**Archivo:** `src/components/pos/ReparacionesPOSPanel.tsx`

**Qué pasa:** El panel calcula:
```typescript
const saldoPendiente = costoTotal - totalAnticipos;
const hayDeuda = saldoPendiente > 0;
// Cuando hayDeuda = false → botones "Registrar anticipo" y "Cobrar saldo" se ocultan
```

Si la orden tiene `costo_total = 0` (nueva orden donde no se ha cotizado precio), `hayDeuda = false` y desaparecen TODOS los botones de cobro. El vendedor no puede registrar un anticipo aunque el cliente quiera pagar.

**Ejemplo real en producción:** ORD-20260326-0004 muestra "$0.00 PAGADO" con -$300 de anticipos porque fue ingresado sin poder actualizar el saldo.

**Fix propuesto:** Mostrar el botón "Registrar anticipo" siempre que la orden esté en estado activo (no entregado, no cancelado), independientemente del saldo.

---

### [MULTITENANT-001] Super admin siempre entra como el último distribuidor usado

**Severidad:** MEDIA — Confusión operativa para Trini
**Detectado:** 2026-03-28
**Estado:** ✅ RESUELTO — commit `feedae4` (2026-03-28)

**Archivo:** `src/components/DistribuidorProvider.tsx` líneas 78-87

**Qué pasa:**
```typescript
const savedId = localStorage.getItem(LS_KEY);
if (savedId) {
  const found = dists.find(d => d.id === savedId);
  if (found) {
    setDistribuidorActivoState(found); // ← Siempre usa el guardado
    return; // ← Nunca llega al "primer activo"
  }
}
// Esta línea solo se ejecuta si no hay nada guardado:
const primero = dists.find(d => d.activo) ?? dists[0] ?? null;
```

Si Trini usó CELLMAN en la sesión anterior, la próxima vez entra como CELLMAN. Trini quiere siempre entrar como CREDIPHONE Principal por defecto.

**Fix:** Borrar el localStorage al hacer logout, o siempre iniciar con el primer distribuidor activo y solo guardar el cambio cuando el usuario lo selecciona explícitamente durante la sesión.

---

### [MULTITENANT-002] `getAllVerificaciones()` sin filtro de distribuidor

**Severidad:** MEDIA — Admin de CELLMAN puede ver inventario de CREDIPHONE
**Detectado:** 2026-03-28
**Estado:** ✅ RESUELTO — commit `feedae4` (2026-03-28)

**Archivo:** `src/lib/db/verificaciones.ts` función `getAllVerificaciones()`

La función retorna las 100 verificaciones más recientes sin filtrar por distribuidor. Un admin de CELLMAN puede ver las verificaciones de inventario de CREDIPHONE Principal y viceversa.

**Fix:** Pasar `distribuidorId` como parámetro y agregar `.eq("distribuidor_id", distribuidorId)` cuando el rol no es super_admin.

---

### [FOTO-001] Fotos QR — path incorrecto en búsqueda ✅ RESUELTO

**Estado:** ✅ CORREGIDO y desplegado 2026-03-28
**Archivos corregidos:**
- `src/app/api/reparaciones/qr/[token]/fotos/route.ts`
- `src/app/api/reparaciones/fotos/ligar-sesion-qr/route.ts`
**Fix:** Cambiar `temp/${token}/%` por `reparaciones/temp/${token}/%` en ambos filtros

---

### [URL-001] WhatsApp y tracking apuntaban a localhost ✅ RESUELTO

**Estado:** ✅ CORREGIDO y desplegado 2026-03-28 (build `2321b3fe`)
**Fix:** `.env.local` — `NEXT_PUBLIC_BASE_URL` y `NEXT_PUBLIC_APP_URL` → `https://crediphone.com.mx`

---

### [POS-001] KitsPOSPanel — tablas `kits` y `kits_items` no existen en BD

**Severidad:** MEDIA — Tab Kits en POS siempre falla silenciosamente
**Detectado:** 2026-03-28
**Estado:** ❌ PENDIENTE (FASE 61 — esperar indicación de Trini)

El componente `src/components/pos/KitsPOSPanel.tsx` llama APIs que consultan tablas que no tienen migración SQL aplicada. Resultado: la pestaña de Kits no muestra nada y no da error visible.

---

## 📋 INFORMACIÓN DE NEGOCIO — Bolsa Virtual (para Claude al reanudar)

### Flujo completo de la bolsa virtual (reparaciones en caja):

```
SITUACIÓN: Cliente trae dispositivo a reparar.

1. SE CREA LA ORDEN
   - Admin/vendedor crea nueva orden en /dashboard/reparaciones/nueva
   - costo_total = 0 al inicio (aún no hay diagnóstico)
   - BUG-CAJA-002: si se intenta cobrar anticipo antes de poner precio → botones ocultos

2. COBRO DE ANTICIPO (desde POS → Tab "Cobrar Rep.")
   - Vendedor busca orden por folio/nombre/teléfono
   - Registra anticipo con método de pago
   - anticipo se guarda en anticipos_reparacion ✅
   - Si hay sesión de caja → intenta entrar a caja_movimientos ❌ (BUG-CAJA-001: falla)
   - Si no hay sesión y es efectivo → crea traspasos_anticipo ✅

3. TRASPASO TÉCNICO→VENDEDOR (sin sesión de caja)
   - Técnico cobró efectivo directo (sin caja abierta)
   - Sistema notifica al vendedor (WhatsApp/sistema)
   - Vendedor confirma monto real
   - traspasos_anticipo se actualiza ✅
   - Intento de registrar en caja_movimientos ❌ (BUG-CAJA-001: falla)

4. DEPÓSITO/TRANSFERENCIA (FASE 38)
   - Cliente hace transferencia bancaria
   - Admin confirma desde /dashboard/reparaciones/[id]
   - confirmaciones_deposito se actualiza ✅
   - Intento de registrar en caja_movimientos ❌ (BUG-CAJA-001: falla)

5. COBRO FINAL (desde POS)
   - Cuando saldo = 0 → orden auto-pasa a "entregado" ✅
   - Registro en caja_movimientos ❌ (BUG-CAJA-001: falla)

6. CIERRE DE CAJA (Reporte Z)
   - cerrarCaja() lee caja_movimientos
   - NUNCA encuentra pagos de reparaciones (no existen por BUG-CAJA-001)
   - Saldo final siempre incompleto ❌
```

### Impacto financiero real:
Cada anticipo de reparación cobrado = dinero que NO aparece en el Reporte Z del turno.
Si en un turno se cobran $1,500 en anticipos de reparación → el cuadre de caja estará $1,500 "corto" y generará falsa discrepancia.

---

## 💡 IDEAS Y DESEOS DE TRINI (no perder)

### Fotos a largo plazo:
- Comprimir bien (ya se hace en cliente) ✅
- **Pendiente decidir:** ¿Cuántos meses conservar fotos post-entrega antes de eliminar?
- Hay fotos "huérfanas" en R2 (temp sin orden, de órdenes canceladas) → cleanup job pendiente
- Trini quiere eficiencia de storage sin perder calidad

### Bolsa virtual — visibilidad deseada:
- Ver en tiempo real cuánto dinero está "en reparaciones" vs liquidado
- Saber qué anticipos ya fueron cuadrados con caja
- Si se usa anticipo para pedir pieza: registrar de qué anticipo sale
- Si hay costo de envío en lote de piezas: ya se distribuye proporcionalmente (FASE 42) ✅
- Al cierre de turno: ver línea separada de "cobros por reparaciones" en Reporte Z

### Subdistribuidores (DIFERIDO — no iniciar hasta que Trini diga):
- Trini tiene 4 opciones de modelo
- Las columnas ya existen en BD: `modo_operacion`, `grupo_inventario`, `tipo_acceso`, etc.

---

## ❓ PREGUNTAS ABIERTAS PARA TRINI

1. **`caja_movimientos` fix:** ¿Aplico la migración SQL para ampliar el esquema y de una vez arreglar los 4 bugs de caja? ¿Quieres que agregue también columna `registrado_por` para saber quién confirmó cada movimiento?
2. **Fotos post-entrega:** ¿Cuánto tiempo quieres conservar las fotos después de que una orden se entrega? ¿6 meses, 12 meses, indefinido?
3. **Default distribuidor:** ¿Siempre CREDIPHONE Principal al entrar, o configurable?
4. **Anticipo para pieza:** Cuando el técnico usa dinero del anticipo para comprar pieza, ¿cómo quieres registrarlo en el sistema?
5. **Reporte Z:** ¿Quieres los cobros de reparación como una sección separada del efectivo de ventas POS, o todo junto?

---

*Última actualización: 2026-03-28 — Claude (Auditoría completa: POS, caja, reparaciones, fotos QR, URLs, inventario. Bugs CAJA-001/002, MULTITENANT-001/002, POS-001 documentados. FOTO-001 y URL-001 resueltos y desplegados.)*
