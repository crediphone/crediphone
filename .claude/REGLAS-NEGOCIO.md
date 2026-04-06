# Reglas de Negocio — CREDIPHONE
> Leer si la tarea toca caja, anticipos, reparaciones o flujos de dinero.
> Si encuentras código que parece raro pero funciona, pregunta a Trini antes de cambiar.
> Si Trini explica la lógica, documéntala aquí.

---

## 🏦 FILOSOFÍA FUNDAMENTAL — TODO el dinero pasa por caja

**Regla:** Cada peso que entra a la tienda, sin importar el concepto, DEBE tener un registro en caja con: empleado, hora, concepto y método de pago.

**Esto incluye:** anticipos de reparaciones, pagos finales de reparaciones, créditos, ventas POS, cualquier entrada de efectivo o transferencia.

**Razón de negocio:** El sistema fue creado para evitar que empleados (técnicos, vendedores, cobradores) se queden con dinero sin registrarlo. Es la prioridad #1 del sistema — no solo gestión de inventario.

---

## 🔒 REGLAS ANTI-FRAUDE DE EMPLEADOS

1. **Ningún empleado puede recibir dinero sin que quede en caja** — ni el técnico, ni el vendedor
2. **Los técnicos son el mayor riesgo** — son quienes más oportunidad tienen de recibir efectivo directo
3. **Si no hay caja abierta**, el anticipo se registra igual PERO queda marcado como `registradoEnCaja: false` — esto es una alerta implícita que el admin debe revisar
4. **El admin puede ver** quién recibió cada pago, cuándo, y en qué sesión de caja
5. **Si hay diferencia al cuadrar** → el sistema identifica la sesión, el empleado, y notifica

### Comportamiento INTENCIONAL — Anticipos sin sesión de caja
Los anticipos sin sesión activa se marcan con `registradoEnCaja: false`.
**NO es un bug** — es una alerta anti-fraude implícita.
El admin los revisa en el reporte de "anticipos sin sesión asignada".
**NO eliminar ni ocultar este estado.**

---

## 🔔 SISTEMA DE ALERTAS DE DESCUADRE (Implementado en FASE 40)

Si al cierre de sesión el monto declarado ≠ monto calculado:
- Diferencia mayor a `configuracion.tolerancia_descuadre` (default: $0 — cero tolerancia)
- Se genera notificación tipo `descuadre_caja` al admin y super_admin
- La alerta incluye: empleado, sesión, monto esperado, monto declarado, diferencia

---

## 💡 IDEAS DIFERIDAS (no iniciar hasta que Trini diga)

### Subdistribuidores
- Trini tiene 4 opciones de modelo de negocio
- Las columnas ya existen en BD: `modo_operacion`, `grupo_inventario`, `tipo_acceso`
- **No implementar** hasta recibir indicación explícita

### Cleanup de fotos huérfanas en R2
- Hay fotos "huérfanas" (temp sin orden, de órdenes canceladas) en Cloudflare R2
- **Pregunta pendiente para Trini:** ¿Cuántos meses conservar fotos post-entrega?
- No eliminar nada hasta tener respuesta

---

## ❓ Preguntas abiertas para Trini

1. **Fotos post-entrega:** ¿Cuánto tiempo conservar después de entregar la reparación? ¿6 meses, 12, indefinido?
2. **Reporte Z:** ¿Quieres cobros de reparación como sección separada de ventas POS, o todo junto?
3. **Anticipo para pieza:** Cuando el técnico usa dinero del anticipo para comprar pieza, ¿cómo registrarlo?

---

## 📌 Notas de comportamiento que Claude debe consultar con Trini

Si encuentras código que:
- Parece duplicar lógica → pregunta si hay razón de negocio
- Parece incompleto pero no genera error → puede ser intencional (como anticipos sin sesión)
- Tiene validaciones que parecen extrañas → puede ser anti-fraude

Pregunta: "Encontré que [módulo] hace X. ¿Tiene alguna razón de negocio o lo corrijo?"
Si Trini explica la razón → documenta aquí antes de continuar.
