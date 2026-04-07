# Sesión Activa — CREDIPHONE

## Estado: BLOQUE 3 PARCIALMENTE COMPLETO ✅

## Última actualización — 2026-04-07

---

## REGLAS DE NEGOCIO CONFIRMADAS POR TRINI (nunca cambiar sin consultar)

### Dinero y Caja
- TODO el dinero que entra a la tienda debe pasar por caja, sin excepción
- Los anticipos NO son ingresos directos — son prepagos del cliente para un servicio específico
- Un anticipo siempre está vinculado a UNA sola orden de reparación (no se mezclan)
- El técnico y el vendedor pueden estar en la misma área física, pero el flujo de dinero debe quedar registrado con quién lo recibió

### Anticipos sin caja abierta
- Si se recibe un anticipo y la caja del vendedor está cerrada:
  → El anticipo se registra y queda asignado al vendedor que inició sesión en ese momento
  → Se muestra mensaje: "Este anticipo se agregará a la caja de [Vendedor X] cuando la abra"
  → Al abrir caja, esos anticipos pendientes se suman automáticamente
- Si el anticipo se registró en un turno diferente al cobro final: ambos quedan en sus respectivas sesiones (es normal, las reparaciones pueden durar más de un mes)

### Técnico registra efectivo
- El efectivo que cobra el técnico entra DIRECTO a caja (sin "traspaso pendiente" complicado)
- Solo se envía una notificación: "Técnico [Nombre] recibió $X del cliente [Y] para la orden #FOLIO"
- Esto reemplaza el flujo complejo actual de traspasos y confirmaciones

### Cancelación de reparación
- PUEDE cancelar: el vendedor desde el POS (sin necesitar al técnico ni al admin)
- CONDICIÓN: Solo si las piezas NO están instaladas aún
- Si ya están instaladas: no se puede cancelar desde POS (requiere admin)
- COSTO DE CANCELACIÓN: ~$100 MXN (cargo mínimo de envío/diagnóstico)
  → Se configura al CREAR la orden (campo en el modal de creación)
  → Aparece en el PDF/documento final de la orden
  → Al cancelar: se devuelve el anticipo MENOS el cargo de cancelación
- El vendedor busca la orden en POS por: folio, nombre del cliente o teléfono

### Precio de piezas en cotización (INTENCIONAL — NO CAMBIAR)
- El `precioUnitario` de cada pieza incluye TODO: costo de la pieza + instalación + envío
- Es un precio "all-in" para el cliente — no se desglosa por componente
- La etiqueta en UI dice: "Precio all-in (pieza + instalación + envío)"
- En el PDF: cada pieza dice "(incl. instalación y envío)"
- El campo global "Mano de Obra" es SOLO para diagnóstico/trabajo general (no ligado a piezas)

### Garantía y responsabilidad
- Cada reparación tiene un técnico responsable asignado
- Ese técnico debe aparecer en el documento final
- La garantía aplica sobre el trabajo realizado (días configurables)

### PDF / Documento de la orden
El PDF es un documento legal (México, LFPC). DEBE contener:
  ✅ Ya tiene: folio, fecha, QR de seguimiento, T&C dinámicos, datos del cliente
  ✅ Ya tiene: diagnóstico técnico, técnico responsable, piezas, presupuesto desglosado,
              anticipos con método de pago, cargo cancelación, garantía (Bloque 2 P1 COMPLETO)
  ✅ QR codes con separación correcta (10mm de gap)
  ✅ Cotización estimada si no hay piezas; definitiva si hay piezas

---

## ESTADO DE IMPLEMENTACIÓN

### ✅ BLOQUE 1 — Reparaciones y Caja — COMPLETO
| Item | Estado |
|------|--------|
| R1 — Simplificar flujo técnico → caja | ✅ COMPLETO |
| R2 — Doble conteo cierre de caja | ✅ COMPLETO |
| R3 — Anticipos sin sesión | ✅ COMPLETO |
| R4 — Cancelación desde POS + cargo | ✅ COMPLETO |
| R5 — Validar transiciones estado | ✅ COMPLETO |
| R6 — Validar costo piezas vs BD | ✅ COMPLETO |

### ✅ BLOQUE 2 — PDF de la orden — COMPLETO
| Item | Estado |
|------|--------|
| P1 — Campos faltantes en PDF | ✅ COMPLETO |
| P2 — PDF automático al aprobar/entregar | ⏳ PENDIENTE (baja prioridad) |

### 🔄 BLOQUE 3 — Inventario — EN PROGRESO
| Item | Estado |
|------|--------|
| I1 — Productos sin ubicación | ✅ COMPLETO |
| I2 — Conflicto ubicacion_id vs ubicacion_fisica | ✅ COMPLETO |
| I3 — Kits no descuentan stock | ✅ YA ESTABA IMPLEMENTADO (FASE 61) |
| I4 — stockMinimo NULL sin alerta | ✅ COMPLETO |
| I5 — IMEI no obligatorio en serializados | ✅ COMPLETO |
| I6 — Alertas/ubicaciones entre distribuidores | ✅ COMPLETO |
| I7 — Devoluciones todo-o-nada | ⏳ PENDIENTE (baja) |
| I8 — Productos legacy sin categoría | ⏳ PENDIENTE (baja) |

---

## PENDIENTE SIGUIENTE SESIÓN

### BLOQUE 3 restante (baja prioridad, NO urgente)
- I7: Devoluciones solo funcionan todo-o-nada
- I8: Productos legacy sin categoría no aparecen en filtros

### BLOQUE 4 — Visual/UI
- Creditos: filas clickeables + stat cards con hover (pendiente del TODO anterior)

### BLOQUE 5 — POS y Funcionalidades Perdidas
- PO1: Sistema de Puntos / Loyalty (diseñar desde cero)
- PO2: Promociones visibles en el POS
- PO3: Límite de tiempo para órdenes sin recoger (ley mexicana)

### BUGS PENDIENTES (Bloque 5)
- BUGS-ACTIVOS.md: RLS-001, SECURITY-003, PAGES-002, DB-002

---

## ORDEN DE PRIORIDAD PARA SIGUIENTE SESIÓN

1. **Preguntar a Trini** qué quiere hacer primero:
   - ¿Terminar Bloque 3 (I7, I8 — baja prioridad)?
   - ¿Pasar a Bloque 4 (UI visual)?
   - ¿Iniciar Bloque 5 (POS loyalty, promociones)?
   - ¿Alguna funcionalidad nueva que necesite?

2. Si Trini dice "continúa donde quedamos" → empezar con I7 (baja) o pasar a Bloque 4

---

**Si pierdes contexto:** Di "Lee SESION-ACTIVA y continúa con el plan"
