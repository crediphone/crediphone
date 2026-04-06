# Design System — CREDIPHONE
> ⚠️ NO LEAS este archivo a menos que vayas a:
> - Crear componentes UI nuevos
> - Refactorizar estilos existentes
> - Implementar dark mode en una página
> - Auditar el diseño visual de un módulo
>
> Los tokens CSS ya están implementados en `src/app/globals.css`.
> Este archivo es referencia de cómo usarlos.

---

## Principio fundamental

**NUNCA usar clases Tailwind de color directas.** Siempre usar `var(--color-...)` en `style={{}}`.

```tsx
// ❌ MAL — AI slop genérico
<div className="bg-blue-500 text-white">

// ✅ BIEN — tokens del sistema
<div style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}>
```

**Hover states:** Tailwind hover: no acepta CSS vars → usar `onMouseEnter`/`onMouseLeave` + `useState`.

---

## Colores prohibidos

- `bg-indigo-*` / `bg-violet-*` / `bg-purple-*`
- `from-blue-600 to-purple-600` (gradiente genérico)
- `#f8fafc` (Slate-50), `#0f172a` (Slate-900), `#0ea5e9` (Sky-500)
- Fuentes: Inter, Roboto, Open Sans

---

## Tokens disponibles (modo claro / modo oscuro en globals.css)

### Fondos (4 niveles)
```css
var(--color-bg-base)      /* suelo de la app — usar con clase app-bg */
var(--color-bg-surface)   /* cards, paneles */
var(--color-bg-elevated)  /* hover, seleccionados */
var(--color-bg-sunken)    /* inputs, áreas recesadas */
```

### Sidebar
```css
var(--color-sidebar-bg)       var(--color-sidebar-surface)
var(--color-sidebar-border)   var(--color-sidebar-text)
var(--color-sidebar-text-dim) var(--color-sidebar-active)
```

### Brand y Accent
```css
var(--color-primary)        /* azul marino oscuro */
var(--color-primary-mid)    /* hover del primary */
var(--color-accent)         /* cian petróleo */
var(--color-accent-hover)
var(--color-accent-vivid)
```

### Semánticos
```css
var(--color-success) / var(--color-success-bg) / var(--color-success-text)
var(--color-warning) / var(--color-warning-bg) / var(--color-warning-text)
var(--color-danger)  / var(--color-danger-bg)  / var(--color-danger-text)
var(--color-info)    / var(--color-info-bg)    / var(--color-info-text)
```

### Texto (4 niveles)
```css
var(--color-text-primary)    /* títulos */
var(--color-text-secondary)  /* subtítulos */
var(--color-text-muted)      /* texto secundario */
var(--color-text-inverted)   /* texto sobre fondos oscuros */
```

### Bordes y Sombras
```css
var(--color-border)          var(--color-border-strong)   var(--color-border-subtle)
var(--shadow-xs)  var(--shadow-sm)  var(--shadow-md)  var(--shadow-lg)  var(--shadow-xl)
```

---

## Fuentes

```css
var(--font-ui)    /* Geist — texto de interfaz (NUNCA Inter) */
var(--font-mono)  /* JetBrains Mono — folios, IMEIs, códigos */
var(--font-data)  /* Geist Mono — precios, tablas numéricas */
```

**Regla:** Números dinámicos (precios, folios, IMEIs, fechas) SIEMPRE en `font-mono` o `font-data`.

---

## Reglas por tipo de componente

### Cards
```
bg: var(--color-bg-surface)
border: 1px solid var(--color-border-subtle)
shadow: var(--shadow-sm) → hover: var(--shadow-md) + translateY(-1px)
```

### Botones primary
```
bg: var(--color-primary) → hover: var(--color-primary-mid)
transition: all 200ms cubic-bezier(0.34,1.56,0.64,1)  ← spring
```

### Inputs
```
bg: var(--color-bg-sunken)
border: var(--color-border)
focus: border → var(--color-border-strong) + ring rgba(0,153,184,0.15)
```

### Badges de estado
```
En espera:    warning-bg / warning-text
En proceso:   info-bg / info-text
Completado:   success-bg / success-text
Cancelado:    danger-bg / danger-text
```

---

## 4 estados obligatorios por componente

Todo componente de datos DEBE manejar:
```typescript
type UIState = 'loading' | 'error' | 'empty' | 'data'
```

- **Loading:** Skeleton con `animate-pulse` que refleje la forma real. NUNCA spinner genérico centrado.
- **Empty:** Ícono temático + mensaje específico + CTA de acción. NUNCA solo "No hay datos".
- **Error:** Mensaje específico + botón de retry.
- **Data:** Contenido real con todas las interacciones.

---

## Checklist antes de entregar una página

- [ ] CERO clases Tailwind de color directas
- [ ] Fondo usa `var(--color-bg-base)` con clase `app-bg`
- [ ] Cards usan `var(--color-bg-surface)`
- [ ] Números/folios/IMEIs/precios en font-mono o font-data
- [ ] Skeleton refleja forma real del contenido
- [ ] Dark mode funciona sin hardcodear colores
- [ ] 4 estados implementados (loading, error, empty, data)
- [ ] Sidebar en `var(--color-sidebar-bg)` — NO blanca
- [ ] CERO gradientes azul→morado
- [ ] CERO uso de Inter, Roboto, Open Sans
