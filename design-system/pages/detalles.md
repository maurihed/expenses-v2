# Página · Detalles

Base: `../MASTER.md`. Vista de patrimonio y estadísticas del mes.

- **Patrimonio neto** (hero `.brand-gradient`): activos − deudas como número
  grande, barra de proporción activos/deudas, desglose `Activos · Deudas` y la
  tasa USD/MXN con su fecha.
- **Grid 2×2** de tarjetas (`ExpenseSection`, `rounded-2xl`):
  - **Dinero total** — desglose por moneda si hay divisas.
  - **Inversiones** — valor de mercado + número de cuentas.
  - **Deuda actual** — crédito, por pagar, por cobrar y pago del periodo de
    tarjetas.
  - **Gastado en <mes>** — gasto del mes seleccionado.
- **Resumen del mes** (tarjeta ancha): selector mes/año (`MonthYearPicker`),
  `Ingresos · Gastos · Balance`, tasa de ahorro, promedio diario de gasto,
  movimientos del mes y categoría con más gasto.
- Importes siempre `tabular-nums`; ingreso `text-positive`, gasto
  `text-negative`. Mobile-first: `grid-cols-2` en móvil, `lg:grid-cols-4` en
  pantallas anchas.
