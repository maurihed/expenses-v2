# Movimientos — Page Overrides

> **PROJECT:** Expenses
> **Page Type:** Transaction list + filters
> ⚠️ Rules here **override** `design-system/MASTER.md`. Everything not listed
> here follows the Master.

---

## Typography override

- **Section font:** `font-display` (**Sora**) for the page title and month/day
  group headers only.
- **Amounts:** **Inter** `tabular-nums`, weight 600. Debe alinearse en columna.

## Layout

- Mobile-first list, `w-full`, rows de mínimo 56px de alto.
- **Filters:** chips en fila con scroll horizontal (`overflow-x-auto`,
  `flex-nowrap`, `snap-x`) o botón que abre `Sheet`. Nunca un row que empuje el
  ancho del body.
- Agrupado por fecha; header de grupo sticky con fondo `--background` y borde
  inferior `--border`.
- Desktop: `max-w-3xl` centrado.

## Color / semantic

- Ingreso: `--chart-2`/verde de la escala accessible, con prefijo `+`.
- Gasto: `--destructive`, con prefijo `−`.
- El signo + la etiqueta de categoría son el indicador; **no** depender sólo del
  color.
- Chip activo: `--primary` bg + `--primary-foreground` (blanco). Chip inactivo:
  `--muted` bg + `--muted-foreground`.

## Components

- **Transaction row:** icono de categoría (Lucide), nombre + persona, monto
  derecha `tabular-nums`.
- **Filter chips:** `--radius-full`, `cursor-pointer`, transición de color 200ms.
- **Empty state:** Lucide `ReceiptText`, título Sora, CTA primario para agregar.

## Recommendations

- Búsqueda con debounce; no bloquear el hilo con listas grandes.
- Evitar tablas en mobile: usar lista de filas.
- No usar `scale` en hover de filas.
