# Categorias — Page Overrides

> **PROJECT:** Expenses
> **Page Type:** Category management
> ⚠️ Rules here **override** `design-system/MASTER.md`. Everything not listed
> here follows the Master.

---

## Typography override

- **Section font:** `font-display` (**Sora**) for the page title and category
  section headings only. Category names and labels stay **Inter**.
- Sin cifras monetarias propias; si se muestran montos por categoría, usar
  `tabular-nums`.

## Layout

- Mobile-first: grid de 2 columnas (`grid-cols-2`) de tarjetas de categoría,
  `gap-3`; 3 columnas desde `sm:`.
- Cada tarjeta: icono (Lucide) + nombre + color de categoría.
- `w-full`; sin anchos fijos > viewport.
- Desktop: `max-w-3xl`.

## Color / semantic

- El color de cada categoría es un acento puntual; el texto de la tarjeta se
  mantiene `--foreground` para asegurar AA.
- Chip de color seleccionado: borde `2px` + check (no sólo color).
- Acción destructiva (eliminar) usa `--destructive` con confirmación.

## Components

- **Category card:** `--card`, `border-border`, `--radius-lg`, `shadow-sm`,
  `cursor-pointer`, hover `shadow-md`.
- **Color swatches:** fila horizontal con scroll o wrap; `--radius-full`.
- **Form:** inputs con label visible; focus ring rosa (`ring-2 ring-ring`).
- **CTA "Nueva categoría":** `.btn-primary`.

## Recommendations

- Evitar emojis como iconos de categoría: usar Lucide + color.
- Mantener una sola fuente de sección (Sora).
- Truncar nombres largos con `truncate` en vez de ensanchar la tarjeta.
