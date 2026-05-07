# Sesión Activa — CREDIPHONE

## Estado: TRANSPARENCIA DEL SERVICIO — PLAN COMPLETO ✅ (2026-05-06)

**Última sesión:** 2026-05-06 — Plan "Transparencia del Servicio" completo (M1-M9)
**Historial:** `ARCHIVO/HISTORIAL-SESIONES.md`

---

## Módulos activos y funcionales

| Módulo | Estado | Notas |
|--------|--------|-------|
| Reparaciones (órdenes, drawer, stepper) | ✅ | F1-A/B/C corregidos |
| PDF de orden (firma en 1a hoja) | ✅ | maybeBreak 38mm |
| PDF versionado | ✅ | v1 al crear, v2+ en aprobaciones y entrega |
| Tracking cliente | ✅ | Token 64-char hex; piezas en_camino visibles al cliente |
| Bolsa Virtual en POS | ✅ | Tab "Órdenes activas" + tab "En disputa" |
| Movimientos bolsa virtual | ✅ | gasto_pieza / devolucion_cliente / ingreso_caja / en_disputa |
| Ciclo de vida de piezas | ✅ | pendiente→en_camino→recibida→verificada/defectuosa→instalada |
| Verificación de piezas (técnico) | ✅ | /verificar: llegó bien→instalada, defectuosa→congela bolsa |
| Badge piezas en OrdenCard | ✅ | "X por verificar" (amarillo) + "X en camino" (azul) |
| UI en OrdenDrawer — piezas | ✅ | Botones En camino / Recibida / Verificar inline |
| Resolución piezas no_reparable | ✅ | ModalCambiarEstado: paso extra con lista de piezas pendientes |
| Piezas sin catálogo al cancelar | ✅ | ModalCambiarEstado: lista de piezas físicas sin producto_id |
| Stock en sugerencias diagnóstico | ✅ | Badge azul "✓N" en ModalDiagnostico cuando hay existencia |
| Offline reparaciones | ✅ | Cola IndexedDB en ModalCambiarEstado, página reparaciones y técnico |
| Control de precio (aprobación admin) | ✅ | Vendedor propone → admin aprueba/rechaza |
| POS + Caja | ✅ | Bolsa virtual, corte con "Reparaciones cobradas este turno" |
| Badge "precio pendiente" en OrdenDrawer | ✅ | Header badge + tarjeta aprobación en tab presupuesto |
| Panel piezas pendientes (vendedor) | ✅ | PiezasPendientesPanel en página reparaciones |
| C4 — Columnas anticipo/saldo en POS | ✅ | Lista "Listos para cobrar" con anticipo + saldo por fila |
| C1 — Descontar stock al entregar equipo | ✅ | Fire-and-forget en entregar/route.ts; devuelve stock al cancelar |
| C2 — Ajuste stock con motivo + historial | ✅ | PATCH ajustar_stock; UI en ProductoForm; página /inventario/movimientos |
| C7 — Admin cambia precio → notifica al cliente | ✅ | WhatsApp + historial si hay tracking token |
| C8 — PDF snapshot cotización inicial | ✅ | columna snapshot_cotizacion_inicial JSONB (inmutable) |
| I4 — OC sugerida desde alertas inventario | ✅ | Botón "Crear OC sugerida" en /inventario/alertas |
| I5 — Notificaciones fallidas | ✅ | Tabla + captura errores WA + badge dashboard + página reenvío |
| SECURITY-003 — Cifrado wa_access_token | ✅ | AES-256-GCM, llave en CF secret WA_ENCRYPTION_KEY |
| PO1 — Sistema de puntos / loyalty | ✅ | $50=1pt, 1pt=$1 descuento, reseteo anual, visible en tracking |
| B0 — Bug esperando_piezas | ✅ | estadosValidos en PUT /api/reparaciones/[id] |
| C6 — Eliminación limpia de orden | ✅ | DELETE elimina pedidos_pieza + movimientos_bolsa_virtual |
| V3 — Tracking: Servicios Contratados | ✅ | Muestra piezasCotizacion con precio al cliente |
| B1 — Flujo retraso de pieza | ✅ | PATCH /api/reparaciones/[id]/pedidos-pieza/[pedidoId] + tracking |
| I1 — Resumen financiero por cliente | ✅ | GET /api/clientes/[id]/resumen + panel expandible en tabla |
| I7 — Reasignar técnico (admin) | ✅ | Selector inline en "Técnico Asignado" del OrdenDrawer |
| I6 — Puntos lealtad visible en POS | ✅ | Chip verde "X pts = $X descuento" en panel cliente POS |
| D1 — Margen de utilidad por reparación | ✅ | Panel rentabilidad en tab Presupuesto (solo admin) |
| D5 — Garantías: UI de reclamación | ✅ | Banner verde en OrdenDrawer si orden entregada + form reclamación |
| D6 — Dashboard comparativa sucursales | ✅ | SucursalKpiCard grid en DashboardEjecutivo (solo super_admin) |
| D7 — Offline queue conectada | ✅ | OfflineBanner con onSyncComplete en tecnico y reparaciones |
| M8 — Topbar ← Atrás + logout dropdown | ✅ | DashboardShell.tsx |
| M9 — Mobile bottom nav | ✅ | MobileBottomNav.tsx (por rol, 5 tabs) |
| M5 — KPI cards técnico como filtros | ✅ | tecnico/page.tsx |
| M2 — Link tracking en OrdenDrawer | ✅ | Copiar/abrir con un click |
| M1 — Historial WA en OrdenDrawer | ✅ | API + UI sección "Comunicaciones enviadas" |
| M4 — Contexto cliente en OrdenDrawer | ✅ | Nª reparación, puntos, saldo pendiente |
| M3 — Cotización original vs modificada | ✅ | Chip warning + details colapsable |
| M6 — Hub inventario | ✅ | /dashboard/inventario/page.tsx |
| M7 — Reparaciones en VendedorDashboard | ✅ | Acciones rápidas |

---

## Pendiente — Plan de auditoría (ver plan completo)

### Completados esta sesión (2026-05-06) — Plan Transparencia del Servicio:
- ✅ **M8** — Topbar: botón ← Atrás + logout movido a dropdown de usuario
- ✅ **M9** — MobileBottomNav: barra inferior fija para acceso rápido mobile (por rol)
- ✅ **M5** — KPI cards del panel técnico como filtros activos (click = filtro)
- ✅ **M2** — OrdenDrawer: link de tracking copiable en header (Click=copiar, Ctrl+Click=abrir)
- ✅ **M1** — Historial de comunicaciones WA en tab Resumen del OrdenDrawer
         + API GET /api/reparaciones/[id]/comunicaciones (whatsapp_mensajes + notificaciones_fallidas)
- ✅ **M4** — Card "Cliente" con contexto: Nª reparación, puntos lealtad, saldo pendiente
- ✅ **M3** — Chip "Cotización modificada" en tab Presupuesto con snapshot original colapsable
- ✅ **M6** — Hub /dashboard/inventario: grid de 7 subpáginas + badge alertas dinámico
- ✅ **M7** — VendedorDashboard: shortcut "Reparaciones → Órdenes de servicio"

### ✅ Push a master completado (2026-05-06)
Token renovado: ghp_LY29... válido 3 meses. Remote actualizado en worktree y repo principal.

### Plan de auditoría integral: COMPLETO
Todos los ítems C1-C11, I1-I7, D1-D7, B0-B1, V3 implementados.

### Completados sesión 2026-05-07 (mañana):
- ✅ **E1** — ModalOrden: confirmación siempre al cerrar
- ✅ **E2** — ModalOrden: panel post-creación con PDF/WA/imprimir/ver ficha
- ✅ **E3** — Inputs cliente en mobile: grid 1 col, font 1rem (sin zoom iOS)
- ✅ **E4** — Nombre del cliente nuevo propaga a firma digital (1 línea)
- ✅ **E5** — Card Cliente en OrdenDrawer: botones WA/Llamar/Copiar inline
- ✅ **E6** — Fila acciones rápidas en tab Resumen del OrdenDrawer (PDF, ticket, tracking, WA)

### 🔴 PENDIENTE — Bugs identificados en auditoría (2026-05-07):
- ❌ **BUG-WA-001** — WhatsApp en OrdenCard sin mensaje precargado
- ❌ **BUG-TRACK-001** — Token de tracking no se genera si se salta estado "presupuesto"
- ❌ **BUG-TRACK-002** — Costo/servicios ocultos en tracking con requiereAprobacion=false
- ❌ **E7** — Botón "Cliente aprobó en tienda" en drawer (aprobar-presencial)
- ❌ **E8** — Notificación automática WA al cambiar estado
- ❌ **BUG-PIEZAS-001** — PiezasPendientesPanel sin botón WA por pieza

### REGLA PERMANENTE (2026-05-07)
**NUNCA eliminar funcionalidades existentes. Solo agregar.**
Antes de editar: verificar con git diff qué existía antes.
Documentar en SESION-ACTIVA y BUGS-ACTIVOS todo lo encontrado.

---

## PRÓXIMA SESIÓN — Plan de Auditoría con Cliente Ficticio (2026-05-07)

### METODOLOGÍA
Crear cliente ficticio con sufijo " — Prueba de Servicios" en el nombre.
Abrir la web en vivo y recorrer el sistema como: cliente, técnico y administrador.
Verificar que lo implementado REALMENTE funciona end-to-end. Corregir lo que falle.

---

### BLOQUE A — Creación de orden de servicio
**Errores conocidos a verificar:**
- [ ] Al crear cliente: nombre y teléfono aparecen muy pequeños, no caben en mobile
- [ ] Modal de creación de cliente tiene detalles en versión mobile
- [ ] Al presionar "firma digital" en creación de orden, el cliente NO se arrastra automáticamente
- [ ] Revisar todos los campos del formulario de nueva orden — ¿qué falta? ¿qué lógica no está clara?

---

### BLOQUE B — Flujo de tracking cuando el cliente NO necesita aprobar nada
**El problema central:**
Cuando la cotización coincide con el presupuesto inicial (sin cambios) o cuando `requiereAprobacion = false`,
el cliente nunca recibe el WA de presupuesto → no genera token de tracking → la página de tracking
existe pero está vacía o no muestra las funciones de:
- Ver el estado actual y cotización
- Aceptar/rechazar presupuesto
- Ver piezas en camino
- Recibir ofertas y promociones
- Ver si hay cambios de precio posteriores

**Preguntas de lógica de negocio que Trini debe responder:**
1. ¿Cuándo se genera el token de tracking? ¿Solo al cambiar a estado "presupuesto"?
2. ¿Qué pasa si el cliente aprobó en persona y el técnico avanza sin pasar por presupuesto?
3. ¿Debe el cliente poder ver su tracking SIEMPRE, independientemente del flujo?
4. ¿La sección de "¿deseas recibir promociones?" debe aparecer en CUALQUIER punto del proceso?
5. ¿Qué información debe estar siempre visible (precio, estado) vs. qué requiere aprobación?

**A verificar en producción:**
- [ ] ¿El token se genera si el orden salta de "recibido" directo a "en_reparacion"?
- [ ] ¿Si `requiereAprobacion = false`, el cliente recibe algún mensaje con el link de tracking?
- [ ] ¿Aparecen las ofertas/promociones cuando el cliente entra al tracking con orden ya completada?
- [ ] ¿El precio final es visible en tracking aunque no haya habido aprobación del cliente?
- [ ] ¿Qué ve el cliente en tracking si la orden ya fue entregada?

---

### BLOQUE C — Auditoría visual y funcional completa (con preview del navegador)
Recorrer como técnico:
- [ ] Crear orden nueva desde panel técnico
- [ ] Agregar diagnóstico
- [ ] Cambiar estados: diagnostico → presupuesto → aprobado → en_reparacion → completado → listo_entrega → entregado
- [ ] Verificar que cada cambio de estado envía (o intenta enviar) el WA correcto
- [ ] Verificar historial de comunicaciones en OrdenDrawer (M1 nuevo)
- [ ] Verificar link de tracking en drawer (M2)
- [ ] Verificar badge de Nª reparación y puntos del cliente (M4)
- [ ] Verificar cotización original vs modificada (M3)

Recorrer como administrador:
- [ ] Aprobar/rechazar solicitud de cambio de precio
- [ ] Ver historial de precios
- [ ] Ver margen de utilidad
- [ ] Reasignar técnico
- [ ] Verificar panel de comunicaciones WA fallidas

Recorrer como cliente (página tracking):
- [ ] Abrir URL de tracking
- [ ] Ver estado, cotización, piezas
- [ ] Aprobar/rechazar presupuesto
- [ ] Ver sección de promociones
- [ ] Verificar que la página funciona ANTES y DESPUÉS de la aprobación

---

### BLOQUE D — Problemas silenciosos y "en el limbo"
- [ ] Órdenes que nunca generan token de tracking — ¿quedan sin seguimiento para el cliente?
- [ ] Notificaciones fallidas — ¿hay forma de reenviarlas desde el drawer?
- [ ] ¿Qué pasa si el cliente pierde el link de tracking? ¿Puede el empleado reenviarlo?
- [ ] Estados intermedios que no notifican al cliente (esperando_piezas, retraso de pieza)
- [ ] ¿El anticipo se aplica correctamente al precio final en la vista del cliente?

---

### NOTAS DE METODOLOGÍA PARA LA SESIÓN
- Usar preview del navegador (preview_start → preview_screenshot/snapshot) para verificar visualmente
- Corregir errores encontrados EN EL MOMENTO, no acumularlos
- Al final: commit + push de todas las correcciones
- Cliente ficticio a crear: "Juan Prueba de Servicios" + teléfono ficticio

---

## Reglas de negocio clave (NUNCA cambiar sin preguntar)

- Precio all-in: `precioUnitario` incluye pieza + instalación + envío, no se desglosa
- Bolsa Virtual: anticipos independientes de caja (`sesion_caja_id` puede ser null)
- Ingreso neto: `precio_total - sum(costo_pieza + costo_envio)` — solo ESO va a caja al entregar
- Cancelación + pieza llegó: costo de pieza SE RETIENE del anticipo (entra al inventario)
- Cancelación + pieza no llegó: se devuelve TODO el anticipo al cliente
- Pieza defectuosa: monto queda `en_disputa=true` en bolsa hasta resolver con distribuidor
- no_reparable: piezas pendientes requieren resolución manual (inventario o devolución)
- NUNCA eliminar funcionalidades existentes — solo agregar

---

## TypeScript / Deploy

```bash
# Verificar TypeScript (desde la raíz del repo):
node "C:\Users\usuario 1\crediphone\node_modules\typescript\bin\tsc" --noEmit

# Deploy: push a master → GitHub Actions → Cloudflare Workers automático
git push origin HEAD:master
```
