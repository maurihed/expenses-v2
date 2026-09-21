# Página · Cuentas

Base: `../MASTER.md`. Ajustes:

- Título con `font-display` (Outfit). Saldos con Inter + `tabular-nums`.
- Cuentas en tarjetas `.surface rounded-2xl`; badge de tipo con `bg-muted`.
- Crédito: deuda con `text-negative`; "Pagar tarjeta" con botón primario.
- Cuenta USD: equivalente MXN en `text-muted-foreground`.
- Botón "Transferir" (abre `TransferDrawer`): origen → destino, monto, fecha.

## Inversión (Fase 6)

- Tarjeta de inversión: valor total grande (`tabular-nums`), sub-línea
  "Efectivo · Posiciones", chip de cambio del día (`text-positive`/`text-negative`
  con flecha + %), badge `stale` con ícono de reloj.
- Detalle `/cuentas/:id`: header con volver, total, desglose y cambio del día;
  lista de posiciones (badge del ticker, `cantidad × precio`, valor y %).
- Alta/edición en bottom-sheet: buscador con debounce, resultados con ticker +
  nombre + bolsa; ticker manual como respaldo; checkbox "descontar del efectivo"
  con previsualización.
- Targets ≥44px, sin scroll horizontal a 375px, transiciones 150–250 ms.
