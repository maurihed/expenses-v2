# Aceptación Fase 4 — Deudas por cobrar y por pagar

Fecha: 2026-09-19

## Suites

| Suite | Resultado |
|---|---|
| Backend `pnpm test` | 54/54 ✅ (9 suites) |
| Backend `pnpm test:e2e` | 114/114 ✅ (15 suites) |
| Backend `pnpm build` | ✅ |
| Frontend `pnpm test` (Vitest) | 14/14 ✅ (`accountTotals`, `debtTotals`) |
| Frontend `pnpm build` | ✅ |
| Frontend `pnpm lint` | 0 errores (3 warnings preexistentes) |

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | CRUD de deudas (tipo, contraparte, monto, moneda, fecha, fecha límite opcional); archivar | **PASS** | `src/debts/*`; e2e `test/debts.e2e-spec.ts` |
| 2 | Abonos reducen pendiente y liquidan; sobrepago → 400 | **PASS** | e2e "los abonos reducen..." y "rechaza un abono mayor..." |
| 3 | Abono con cuenta crea movimiento y ajusta saldo; borrarlo revierte | **PASS** | e2e "un abono con cuenta ajusta el saldo..."; `balanceDelta` |
| 4 | Página Deudas + entrada en Más; totales en Inicio | **PASS** (estático) | `DebtsPage.tsx`, `MorePage.tsx`, `HomePage.tsx`; Vitest `debtTotals` |
| 5 | Suites y builds en verde | **PASS** | tabla de suites |

**Resumen: 5 PASS, 0 FAIL** (criterio 4 verificado estáticamente por falta de
navegador).

## Modelo y reglas

- `Debt` (RECEIVABLE/PAYABLE, contraparte, monto, moneda, fecha, `dueDate?`,
  notas, `archived`) y `DebtPayment` (monto, fecha, `accountId?`,
  `transactionId?`, notas).
- `remaining = amount − Σ abonos`; `status` derivado (`OPEN`/`SETTLED`).
- Abono con cuenta: `EXPENSE` para deuda por pagar, `INCOME` para por cobrar;
  el saldo se ajusta con `balanceDelta` en una `$transaction`.
- No se permiten abonos que excedan el pendiente.

## Follow-ups

- Validación visual a 375px en navegador (patrón de fases previas).
- Intereses/morosidad y recordatorios — no incluidos.
- Dashboard completo de Fase 5 (presupuesto mensual).
