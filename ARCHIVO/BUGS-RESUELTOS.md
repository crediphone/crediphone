# Bugs Resueltos — Historial CREDIPHONE
> Archivo histórico. NO leer en sesiones normales.
> Para bugs activos pendientes: ver `.claude/BUGS-ACTIVOS.md`

---

| ID | Severidad | Commit | Descripción |
|---|---|---|---|
| REACT-301 | 🔴 CRÍTICO | 8530a69 | ModalWhatsAppEstado.tsx: handleClose() durante render → movido a useEffect |
| REACT-301b | 🔴 CRÍTICO | 8530a69 | OrdenDrawer.tsx: tabs definidos como componentes dentro del body → convertidos a funciones directas |
| SECURITY-001 | 🔴 CRÍTICO | 7a5e4f5 | 17 API routes sin autenticación → creado guard.ts + aplicado |
| SECURITY-002 | 🔴 CRÍTICO | 7a5e4f5 | Reportes no filtraban por distribuidor → multi-tenant corregido |
| REACT-001 | 🟠 ALTO | 1085bd5 | 27 errores ESLint: vars before declare, setState en effects, mutación state, Date.now en render |
| CAJA-001 | 🔴 CRÍTICO | feedae4 | caja_movimientos CHECK constraint con solo 2 tipos → expandido a 7 tipos + columnas faltantes |
| CAJA-002 | 🔴 CRÍTICO | feedae4 | Botones cobro ocultos cuando costo_total=0 → mostrar siempre en orden activa |
| MULTITENANT-001 | 🟡 MEDIO | feedae4 | super_admin siempre entraba como último distribuidor usado → borrar localStorage en logout |
| MULTITENANT-002 | 🟠 ALTO | feedae4 | getAllVerificaciones() sin filtro de distribuidor → agregado filtro |
| MULTITENANT-005 | 🟠 ALTO | 2026-03-29 | /api/empleados/vendedores devolvía todos los distribuidores → filtro agregado |
| MULTITENANT-006 | 🟠 ALTO | 2026-03-29 | /api/empleados/[id] sin validación de distribuidor → verificación previa en GET/PUT/DELETE |
| MULTITENANT-007 | 🟠 ALTO | 2026-03-29 | Funciones de inventario/ubicaciones sin filtro → distribuidor_id agregado |
| FOTO-001 | 🟡 MEDIO | 2026-03-28 | Fotos QR — path incorrecto → corregido a reparaciones/temp/{token}/% |
| URL-001 | 🟡 MEDIO | 2026-03-28 | WhatsApp apuntaba a localhost → .env.local actualizado a crediphone.com.mx |
| SIDEBAR-001 | 🟡 MEDIO | cerrado | Comportamiento intencional — module toggle controla acceso de vendedor a reparaciones |
| SIDEBAR-002 | 🟡 MEDIO | 2026-03-29 | Vendedor tenía acceso a Cartera Vencida en Sidebar → removido |
| PAGES-001 | 🟡 MEDIO | 2026-03-29 | Páginas sin guard de rol → distribuidores protegida, configuración ya tenía guard |
| DB-001 | 🟢 BAJO | cerrado | Tabla `usuarios` huérfana — tiene FKs activas, NO eliminar |
| DOCBUG-001 | 🟡 MEDIO | 2026-03-29 | BITACORA decía src/proxy.ts — corregido a src/middleware.ts |
| DOCBUG-002 | 🟡 MEDIO | 2026-03-29 | BITACORA decía kits/lotes_series "no existen" — verificado que SÍ existen |
| DOCBUG-003 | 🟡 MEDIO | 2026-03-29 | CLAUDE.md decía asistencia_registros — corregido a asistencia_sesiones |
| POS-001 | 🟡 MEDIO | cerrado | Tab Kits sin BD — tablas SÍ EXISTEN en Supabase (0 rows) |

---

## Reglas permanentes aprendidas de estos bugs

**De REACT-301:** NUNCA llamar setState durante el render. NUNCA definir componentes dentro del body de otro componente.

**De MULTITENANT:** Toda función de DB necesita recibir `distribuidorId` y filtrar cuando no es super_admin.

**De CAJA-001:** Al agregar nuevos tipos de movimiento de caja, actualizar primero el CHECK constraint en la migración SQL.

**De SECURITY-001:** Toda API route necesita `getAuthContext()` y validar rol. Usar `src/lib/auth/guard.ts`.
