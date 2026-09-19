# Design System — MASTER

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Expenses
**Generated:** 2026-09-18 (base generada con `ui-ux-pro-max`, reconciliada a marca)
**Category:** Personal finance — mobile-first, shared couple budget
**Stack:** React 19 + Vite + Tailwind 4 + shadcn (`new-york`, neutral)

> **Reconciliation note.** La recomendación automática de la skill clasificó el
> producto como *Banking/Traditional Finance* y devolvió navy/gold + "Exaggerated
> Minimalism" + "App Store Style Landing" + tipografía handwritten (*Caveat*).
> Eso no encaja con una app móvil de gastos compartidos con marca rosa propia.
> Se conserva de la skill: estructura mobile-first, checklist de accesibilidad,
> estados hover/focus, spacing y depth tokens. Se **reemplazan** paleta, estilo
> de página y tipografía según las reglas de marca de abajo.

---

## 1. Marca y color

### Primario

El primario de marca es **rosa `#F8359B`** (obligatorio). No se sustituye por
azul/navy aunque la recomendación automática lo sugiriera.

| Role | Hex | CSS Variable | Notas |
|------|-----|--------------|-------|
| Primary (brand) | `#F8359B` | `--primary` | Relleno de botones, chips activos, acentos |
| Primary foreground | `oklch(0.985 0 0)` (≈ blanco `#FAFAFA`) | `--primary-foreground` | Contraste 3.52:1 sobre `#F8359B` → AA para texto grande/negrita; por debajo de AA en texto normal |
| Ring / focus | `#F8359B` | `--ring` | 3.5:1 sobre blanco → AA non-text ✔ |

**Decisión de marca (revisada):** por preferencia de producto, el texto de los
botones primarios es **blanco** sobre rosa (se percibe con mejor contraste visual
que el casi-negro). Nota técnica: blanco sobre `#F8359B` es **3.52:1**, por
debajo de WCAG AA para texto normal (<18.66px); se acepta porque los botones usan
tamaño/negrita suficiente y el casi-negro (`oklch(0.145 0 0)`, 5.63:1) queda como
alternativa si se requiere AA estricto en texto pequeño.

### Escala rosa (útil para superficies, hover y estados)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary-50` | `#FFF0F7` | Fondo suave / selección |
| `--color-primary-100` | `#FFE0EF` | Hover de superficies suaves |
| `--color-primary-200` | `#FFC2DF` | Bordes suaves |
| `--color-primary-300` | `#FF94C8` | Decorativo |
| `--color-primary-400` | `#FF5FAE` | Acento claro |
| `--color-primary-500` | `#F8359B` | **Marca / primary** |
| `--color-primary-600` | `#DB0E85` | Texto de enlace sobre claro (4.76:1) |
| `--color-primary-700` | `#B50B6D` | Texto pequeño sobre claro (6.49:1) |
| `--color-primary-800` | `#8F0A57` | Énfasis oscuro |
| `--color-primary-900` | `#6B0842` | Fondos oscuros |
| `--color-primary-950` | `#430527` | Casi negro con tinte rosa |

### Neutros y estados

Se conservan los neutros shadcn ya definidos (`--background`, `--foreground`,
`--card`, `--muted`, `--border`, `--input`) para no romper componentes.
- `--destructive` rojo estándar para acciones destructivas.
- `--chart-1` se alinea al rosa de marca `#F8359B`; el resto de la escala de
  charts se mantiene para no romper visualizaciones existentes.

### Reglas de contraste (AA)

- Claro: texto principal `oklch(0.145 0 0)` sobre `--background` ✔; muted
  `oklch(0.556 0 0)` sólo para texto secundario ≥ 14px.
- Oscuro: texto claro sobre `oklch(0.145 0 0)` ✔.
- `--primary` como **texto** sobre blanco da 3.5:1 → prohibido para texto
  normal. Usar `--color-primary-700` para enlaces/textos pequeños en claro.
  `--primary` sí es válido como relleno con `--primary-foreground` (blanco por
  decisión de marca), y como texto sobre fondos oscuros (5.63:1).

---

## 2. Tipografía (máx. 3 familias)

| Rol | Familia | Dónde | Justificación |
|-----|---------|-------|---------------|
| **Global** (nav, labels, body, importes) | **Inter** | Toda la app | Máxima legibilidad en UI densa y pantallas pequeñas; variable, con cifras tabulares reales (`tabular-nums`) para importes alineados. Base neutra que no compite con los acentos de sección. |
| **Sección datos** (`font-display`) | **Sora** | cuentas, movimientos, categorias | Geométrica, técnica y financiera; buenos numerales y un tono "producto" que da jerarquía a títulos de listas/tarjetas sin gritar. |
| **Sección personas** (`font-serif`) | **Fraunces** | personas | Serif cálida y humana para la sección de personas/presupuesto compartido; diferencia esa página emocional del resto sin salir del sistema. |

**Total: 3 familias** (Inter + Sora + Fraunces). Cada página usa como máximo
**una** fuente de sección; el resto es Inter.

### Tokens

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-display: "Sora", "Inter", ui-sans-serif, system-ui, sans-serif;
--font-serif: "Fraunces", Georgia, "Times New Roman", serif;
```

### Importes (obligatorio)

Toda cifra monetaria usa cifras tabulares:

```html
<span class="tabular-nums">$1.234,56</span>
```

### Carga de fuentes

En `index.html` con `font-display: swap` (vía `&display=swap` en el link de
Google Fonts) y `preconnect` a `fonts.googleapis.com` / `fonts.gstatic.com`.
Sin fuentes auto-hospedadas en esta fase.

---

## 3. Spacing, radios y profundidad

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-xs` | `4px` | Gaps ajustados |
| `--space-sm` | `8px` | Gap de iconos |
| `--space-md` | `16px` | Padding estándar (base mobile) |
| `--space-lg` | `24px` | Padding de sección |
| `--space-xl` | `32px` | Gaps grandes |
| `--space-2xl` | `48px` | Márgenes de sección |

- Radios: se usan los tokens shadcn existentes (`--radius-sm|md|lg|xl`).
- Profundidad discreta: `shadow-sm` para tarjetas en reposo, `shadow-md` en
  hover. Evitar sombras grandes en mobile.

---

## 4. Componentes y patrones

### Mobile-first (obligatorio)

- Diseñar a **375px** primero; sin scroll horizontal.
- Ancho de contenido fluido (`w-full`, `max-w-*` sólo como tope, nunca fijo
  mayor al viewport).
- Navegación inferior / encabezados compactos; áreas táctiles ≥ 44px.
- Un solo acento de sección como máximo por vista.

### Botones

```css
/* Primario: rosa marca + texto oscuro (AA) */
.btn-primary {
  background: #F8359B;
  color: #111111;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-weight: 600;
  font-family: var(--font-sans);
  transition: background-color 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { background: #DB0E85; }
.btn-primary:focus-visible { outline: 2px solid #F8359B; outline-offset: 2px; }

/* Secundario */
.btn-secondary {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-weight: 600;
  transition: border-color 200ms ease, background-color 200ms ease;
  cursor: pointer;
}
```

### Tarjetas

Superficie `--card`, borde `--border`, radio `--radius-lg`, `shadow-sm`.
Hover: `shadow-md` + borde `--color-primary-200`. Nunca `transform: scale`
que desplace layout.

### Inputs

`bg-background`, borde `--input`, radio `--radius-md`, altura ≥ 44px.
Focus: `ring-2 ring-ring` (ring rosa). Labels siempre visibles.

---

## 5. Anti-patrones (NO usar)

- ❌ Emojis como iconos (usar Lucide/SVG).
- ❌ `--primary` (rosa 500) como texto sobre blanco (falla AA).
- ⚠️ Blanco sobre rosa 500 (3.52:1) — aceptado por decisión de marca para botones; usar texto grande/negrita o el casi-negro si se exige AA estricto en texto pequeño.
- ❌ Gradientes rosa/púrpura tipo "AI" para superficies funcionales.
- ❌ Hovers con `scale` que muevan layout.
- ❌ Anchos fijos > viewport (rompe mobile).
- ❌ Cambios de estado instantáneos (usar 150–300ms).
- ❌ Focus invisible.
- ❌ Más de una fuente de sección por página (o > 3 familias en total).

---

## 6. Pre-delivery checklist

- [ ] Sin emojis como iconos; set de iconos consistente (Lucide).
- [ ] `cursor-pointer` en todo elemento clickable.
- [ ] Hover con transición suave 150–300ms, sin layout shift.
- [ ] Contraste AA en claro y oscuro (texto 4.5:1; UI 3:1).
- [ ] Focus visible por teclado.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Responsive 375 / 768 / 1024 / 1440 y **sin scroll horizontal**.
- [ ] Importes con `tabular-nums`.
- [ ] Contenido de sección usa como máximo una fuente de sección.
