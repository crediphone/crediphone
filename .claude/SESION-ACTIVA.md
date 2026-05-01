# Sesión Activa — CREDIPHONE

## Estado: AUDITORÍA INTEGRAL — Fase 2 completada ✅ (2026-04-30)

**Última sesión:** 2026-04-30 — Auditoría integral: flujo de dinero, inventario, clientes y drawer
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

---

## Pendiente — Plan de auditoría (ver plan completo)

### Alta prioridad (requieren migración SQL o lógica compleja):
- **C3** — Crear tabla `movimientos_stock` (SQL migration en Supabase)
- **C1** — Descontar stock al entregar equipo + notificación pieza cancelada sin catálogo
- **C2** — UI ajuste manual con motivo obligatorio + vista admin movimientos
- **C7** — Cambio de precio por admin debe notificar al cliente (WhatsApp)
- **C8** — PDF congela snapshot de cotización inicial

### Media prioridad:
- **I4** — Sugerencia de OC desde alertas de inventario
- **I5** — Notificaciones fallidas: tabla + badge admin + reenvío
- **C9** — DELETE individual de anticipo (super_admin)
- **C11** — Historial de cambios de precio

### Deseables:
- **D3** — Carga de fotos vía QR (corregir ligar-sesion-qr)
- **D4** — Múltiples diagnósticos visibles en historial
- **D5** — Garantías: UI de reclamación
- **D6** — Dashboard super_admin: comparativa entre sucursales
- **D7** — Offline queue: conectar al reconectar

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
