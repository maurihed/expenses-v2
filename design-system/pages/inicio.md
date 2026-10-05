# Página · Inicio (dashboard)

Base: `../MASTER.md`. Esta página concentra los movimientos del mes.

- **Hero** `.brand-gradient` (mes/año, "Total gastado" en blanco grande) + segunda
  línea `Ingresos · Balance`; botón de categorías en la esquina.
- **Presupuesto** del mes: barra de progreso (`bg-primary` / `bg-destructive`) y
  `Presupuesto $X`.
- **Gastos por categoría**: dona (`TopExpenses`), leyenda abajo.
- **Buscador + filtro de categorías** (Popover/Command).
- **Lista completa** agrupada por día; ingreso `text-positive`, gasto
  `text-negative`, transferencia `text-muted-foreground`.
- El FAB `+` (gradiente) abre la captura rápida.
