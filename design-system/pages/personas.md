# Personas — Page Overrides

> **PROJECT:** Expenses
> **Page Type:** People / shared budget
> ⚠️ Rules here **override** `design-system/MASTER.md`. Everything not listed
> here follows the Master.

---

## Typography override

- **Section font:** `font-serif` (**Fraunces**) for page title and person names.
  Es la única página con serif: aporta el tono humano/personal del presupuesto
  compartido. Totales y labels siguen en **Inter**.
- **Totales por persona:** Inter `tabular-nums`, weight 600.

## Layout

- Mobile-first: lista vertical de personas, `w-full`, `gap-3`.
- Cada fila: avatar (o iniciales) + nombre (Fraunces) + total aportado
  (`tabular-nums`) + badge de rol.
- Desktop: grid de hasta 2 columnas `md:`, `max-w-3xl`.
- Nunca anchos fijos > viewport.

## Color / semantic

- Avatar fallback: `--color-primary-100` fondo, `--color-primary-700` texto.
- Diferencia a favor: texto normal; deuda pendiente: `--destructive` + icono.
- Acento de sección limitado a títulos y avatar; el resto neutro.

## Components

- **Person card:** `--card`, `border-border`, `--radius-lg`, `shadow-sm`.
- **Role badge:** pill `text-xs`; usar borde + texto, no sólo color.
- **CTA "Agregar persona":** `.btn-primary`.

## Recommendations

- Mantener sólo Fraunces como fuente de sección aquí; no mezclar con Sora.
- Transiciones 200ms en hover; `cursor-pointer` en tarjetas.
- Contraste AA: texto Fraunces sólo en tamaños ≥ 20px o peso ≥ 600 en claro.
