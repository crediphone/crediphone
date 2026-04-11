# Sesión Activa — CREDIPHONE

## Estado: BLOQUES 3 Y 4 COMPLETOS ✅ — Listo para Bloque 5

## Última actualización — 2026-04-10

---

## REGLAS DE NEGOCIO CONFIRMADAS POR TRINI (nunca cambiar sin consultar)

### Dinero y Caja
- TODO el dinero que entra a la tienda debe pasar por caja, sin excepción
- Los anticipos NO son ingresos directos — son prepagos del cliente para un servicio específico
- Un anticipo siempre está vinculado a UNA sola orden de reparación (no se mezclan)

### Precio de piezas en cotización (INTENCIONAL — NO CAMBIAR)
- El `precioUnitario` de cada pieza incluye TODO: costo de la pieza + instalación + envío
- Es un precio "all-in" para el cliente — no se desglosa por componente
- En UI: "Precio all-in (pieza + instalación + envío)"
- En PDF: cada pieza dice "(incl. instalación y envío)"

### PDF / Documento de la orden
- ✅ Completo: folio, fecha, QRs, T&C, datos del cliente, diagnóstico, técnico,
  piezas, presupuesto desglosado, anticipos con método, cargo cancelación, garantía

---

## ESTADO DE IMPLEMENTACIÓN

### ✅ BLOQUE 1 — Reparaciones y Caja — COMPLETO
| R1 | R2 | R3 | R4 | R5 | R6 |
|----|----|----|----|----|-----|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### ✅ BLOQUE 2 — PDF de la orden — COMPLETO (P1)
P2 (PDF automático al aprobar/entregar) — pendiente baja prioridad

### ✅ BLOQUE 3 — Inventario — COMPLETO
| I1 | I2 | I3 | I4 | I5 | I6 | I7 | I8 |
|----|----|----|----|----|----|----|-----|
| ✅ | ✅ | ✅* | ✅ | ✅ | ✅ | N/A | ✅ |

*I3 ya estaba implementado (FASE 61). I7 no era bug real.

### ✅ BLOQUE 4 — Visual/UI — COMPLETO
| Página | Estado |
|--------|--------|
| Créditos — stat cards interactive + hover botones | ✅ |
| Reparaciones — StatPill con useState hover | ✅ |
| Empleados — stat cards interactive | ✅ |
| Historial POS — stat cards + hover botones | ✅ |

---

## PRÓXIMO BLOQUE — Bloque 5 (POS y Funcionalidades Perdidas)

### Orden recomendado:
1. **PO3** — Límite de tiempo para órdenes sin recoger (ley mexicana) — Jurídico
   - Campo en `configuracion`: `dias_maximos_sin_recoger` (default: 30)
   - Alerta visual cuando una orden lleva X días en `listo_entrega`
   - No requiere jobs automáticos (mostrar badge/alerta en dashboard)

2. **PO2** — Promociones visibles en el POS al vender
   - La tabla `promociones` ya existe
   - Solo falta conectarla al carrito del POS (mostrar banner + opción de agregar)

3. **PO1** — Sistema de Puntos / Loyalty (diseñar desde cero)
   - Tabla `puntos_cliente` nueva
   - Regla de acumulación configurable
   - Canje en POS
   - Mayor esfuerzo — mejor dejar para cuando Trini lo pida explícitamente

### Bugs pendientes (BUGS-ACTIVOS.md):
- RLS-001, SECURITY-003, PAGES-002, DB-002 — revisar si siguen vigentes

---

**Si pierdes contexto:** Di "Lee SESION-ACTIVA y continúa con el plan"
