# Historial de Fases — CREDIPHONE
> Archivo histórico. NO leer en sesiones normales.
> Para estado actual del proyecto: ver `.claude/SESION-ACTIVA.md`

---

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
| 27 | Campos equipo en productos (imei, color, ram, almacenamiento, folio_remision) + parser WINDCEL + PDF remisión | edf2b37 |
| 28 | POS + Caja unificados: modal abrir/cerrar turno, aviso caja abierta por otro empleado | 6a73b96 |
| 29 | POS dual mode — Standard (F-keys: F3/F4/F9/F10) + Visual (grid por categoría, touchscreen) | f69e173, 0952bbf |
| 30 | Selección cliente en POS + captura IMEI serializado + notas por venta/ítem | 32ddc77, 4ba6a5b |
| 31 | Reporte X (snapshot turno) + Reporte Z (cierre formal PDF) + exportar a Excel | b91e299 |
| 32 | Tickets térmicos 58mm: venta POS, recepción reparación con QR, entrega, pago crédito | 5fe292a |
| 33 | Devoluciones parciales por línea + pedidos flotantes (venta en espera) | db0b158, 4ff9c6e |
| 34 | Tarjetas interactivas + Drawer lateral en reparaciones | 68afa8d |
| 34b | Modal mixto + esperando_piezas + overdue WhatsApp | 98c9032 |
| 35 | Centro de Promociones con opt-in seguro + tracking page | 130e934, 956e207 |
| 36 | Servicios sin inventario — POS con carrito mixto productos+servicios | 4bc4c50 |
| 37 | Control traspasos anticipo técnico→vendedor (anti-fraude) | 07c89a8 |
| 38 | Confirmación de depósitos/transferencias | 97f5592 |
| 39 | Sistema autorización descuentos: zonas verde/amarillo/rojo, WhatsApp, panel admin | 614ede1 |
| 40 | Conteo ciego, fondo fijo, Pay In/Out, tolerancia descuadre, alerta admin | 68ae3fc |
| 41 | Bolsa virtual reparaciones en caja + Tab "Cobrar Rep." en POS | b540863 |
| 42 | Sidebar acordeones colapsables + Sistema Lotes de Piezas | 36a0994 |
| 43 | Aging report + tasa de mora real en cartera vencida | 72bff11 |
| 44 | Dashboard ejecutivo por rol (KPIs distintos por rol) | 1ede15d |
| 45 | Sistema WhatsApp — plantillas configurables + notificaciones automáticas | 63a8808 |
| 46 | Órdenes de Compra a Proveedores con recepción de mercancía | 2ee1daf |
| 47-lite | Resumen para contador — PDF/WhatsApp con ingresos del período | a97b166 |
| 48 | Portal tracking reparaciones para cliente final (link público) | 9892e0e |
| 49 | Exportar tablas a CSV: créditos, pagos, clientes, reparaciones | 3e3ebef |
| 50 | P&L mensual: Estado de Resultados en Reportes | a643108 |
| 51 | Sidebar reordenado en 8 grupos funcionales por prioridad | — |
| 52 | Liquid Glass en íconos del sidebar | — |
| 53 | Dashboard Ejecutivo Persistente con auto-refresh 3min | 25205bf |
| 54a | Catálogo de Servicios de Reparación — tabla BD, CRUD admin, precarga en órdenes | migraciones fase54a/b |
| 55 | Control de Asistencia / Reloj Checador — QR/PIN, WidgetChecador | migración fase55 |
| 61 | Kits y bundles — tablas kits + kits_items (aplicadas, 0 rows) | fase61_kits_bundles.sql |
| 62 | Series por Lote — tablas lotes_series + lotes_series_items (aplicadas, 0 rows) | fase62_lotes_series_imei.sql |

---

## Fases pendientes (no iniciadas)

| Fase | Descripción |
|---|---|
| 54 | Facturación CFDI (integración Facturapi) |
| 56 | WhatsApp Business API oficial (plantillas Meta, historial, doble tick) |
| 57 | Links de pago (Clip, Conekta) — cobro por WhatsApp |
