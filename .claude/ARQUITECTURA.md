# Arquitectura del Sistema — CREDIPHONE
> Leer si vas a crear un módulo nuevo, agregar tablas, o entender cómo funciona un área.

---

## Módulos del sistema (14)

| # | Módulo | Ruta | Descripción |
|---|---|---|---|
| 1 | Clientes | `/dashboard/clientes` | CRUD con scoring crediticio, historial, docs |
| 2 | Créditos | `/dashboard/creditos` | Créditos con enganche, mora, estados, PDF |
| 3 | Pagos | `/dashboard/pagos` | Registro de pagos (efectivo, transferencia, Payjoy) |
| 4 | Productos | `/dashboard/productos` | Catálogo con IMEI, SKU, escaneo QR |
| 5 | POS | `/dashboard/pos` | Venta de contado, carrito, escaneo barras |
| 6 | Caja | `/dashboard/pos/caja` | Apertura/cierre, corte, Reporte X/Z |
| 7 | Inventario | `/dashboard/inventario/*` | Verificación física, ubicaciones, alertas stock |
| 8 | Empleados | `/dashboard/empleados` | CRUD + crea cuenta en Supabase Auth automáticamente |
| 9 | Reparaciones | `/dashboard/reparaciones` | Órdenes, técnico, piezas, fotos QR, anticipos |
| 10 | Reportes | `/dashboard/reportes` | Financieros, comisiones, P&L mensual |
| 11 | Configuración | `/dashboard/configuracion` | Empresa, módulos, mora, comisiones, WhatsApp |
| 12 | Distribuidores | `/dashboard/admin/distribuidores` | Solo super_admin — CRUD de tiendas |
| 13 | Panel Técnico | `/dashboard/tecnico` | Vista específica para técnicos |
| 14 | Recordatorios | `/dashboard/recordatorios` | WhatsApp/SMS a clientes |

---

## Tablas principales de BD

```
distribuidores          - Tiendas/franquicias de la red
users                   - Empleados (referencia auth.users)
clientes                - Clientes con créditos
creditos                - Créditos de equipos
pagos                   - Pagos de créditos
productos               - Catálogo de productos
ventas                  - Ventas POS de contado
ventas_items            - Items de cada venta
caja_sesiones           - Sesiones de apertura/cierre de caja
caja_movimientos        - Movimientos de caja (tipos: deposito, retiro, cobro_reparacion, entrada_anticipo, devolucion_anticipo, pay_in, pay_out)
reparaciones / ordenes_reparacion  - Órdenes de reparación
reparacion_piezas       - Piezas usadas
reparacion_fotos        - Fotos de reparaciones
reparacion_historial    - Log de cambios de estado
anticipos_reparacion    - Anticipos cobrados (sesion_caja_id nullable = sin sesión activa)
solicitudes_piezas      - Solicitudes de piezas a proveedor
garantias_piezas        - Garantías de piezas
lotes_piezas            - Lotes de piezas de proveedor
lotes_piezas_items      - Items de cada lote
kits / kits_items       - Kits de productos (tablas existen, 0 rows)
lotes_series / lotes_series_items - Series por lote (tablas existen, 0 rows)
configuracion           - Config del sistema (una fila por distribuidor)
categorias              - Categorías de productos
proveedores             - Proveedores de productos
servicios               - Servicios sin inventario (POS)
asistencia_sesiones     - Registros de asistencia (check-in/out) — ⚠️ NO es asistencia_registros
catalogo_servicios_reparacion - Catálogo de servicios de reparación
scoring_clientes        - Scoring crediticio
notificaciones          - Sistema de notificaciones
```

---

## Archivos clave por dominio

### Auth
- `src/lib/auth/server.ts` — `getAuthContext()` (SIEMPRE usar esto)
- `src/lib/supabase/admin.ts` — `createAdminClient()` (server-side)
- `src/components/AuthProvider.tsx` — contexto en cliente
- `src/middleware.ts` — protege rutas /dashboard (Edge Runtime)

### DB Layer
- `src/lib/db/clientes.ts`, `creditos.ts`, `pagos.ts`, `productos.ts`
- `src/lib/db/empleados.ts` — `createEmpleado()` crea en auth.users primero
- `src/lib/db/caja.ts`, `distribuidores.ts`, `configuracion.ts`

### Layout
- `src/app/dashboard/layout.tsx` → `DashboardShell`
- `src/components/layout/DashboardShell.tsx` — wrappea Auth + Config + Sidebar
- `src/components/layout/Sidebar.tsx` — filtra por rol Y módulos habilitados

### Tipos TypeScript
- `src/types/index.ts` — todos los tipos principales

---

## Flujo de creación de empleados (CRÍTICO)

```typescript
// PASO 1: Crear en Supabase Auth (genera UUID)
const { data: authData } = await supabase.auth.admin.createUser({
  email, password: tempPassword, email_confirm: true
});
const userId = authData.user.id;

// PASO 2: Insertar en public.users con ese UUID como id
await supabase.from("users").insert({ id: userId, ...datos, distribuidor_id });

// Si PASO 2 falla → rollback: deleteUser(userId)
// Retorna tempPassword al frontend para mostrar al admin
```

---

## Regla multi-tenant

- **Toda tabla nueva necesita columna `distribuidor_id`** (excepto la tabla `distribuidores` misma)
- La tabla `configuracion` tiene UNA FILA POR DISTRIBUIDOR (no es singleton global)
- Tabla `usuarios` huérfana (0 rows) — tiene FKs activas, NO eliminar

---

## Storage de imágenes — lógica de `obtenerUrlImagen()` en `src/lib/storage.ts`

```
path.startsWith("http")     → URL completa de R2 → devolver tal cual
path con 2 segmentos y
  empieza "productos/"      → Supabase Storage (legacy, antes Mar 25, 2026)
cualquier otro path         → Cloudflare R2
```

Al guardar en BD: usar siempre la `url` (no el `path`) del resultado de `subirImagen()`.
