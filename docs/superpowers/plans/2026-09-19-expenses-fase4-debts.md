# Expenses Fase 4 — Deudas por cobrar/pagar Implementation Plan

> Spec: `docs/superpowers/specs/2026-09-19-expenses-fase4-debts-design.md`.

**Goal:** CRUD de deudas por cobrar/pagar con abonos, opcionalmente ligados a
cuentas (ajustan saldo), y totales en Inicio.

**Tech Stack:** NestJS 10 + Prisma 5 + Postgres 16; React 19 + React Query v3.

## Global Constraints

- Sin dependencias nuevas. Dinero como número en JSON; `Decimal` en DB.
- Backend es la fuente de verdad de saldos (`balanceDelta`).
- Deudas se archivan. Mobile-first; design system actual.

---

### Task 1: Modelo `Debt`/`DebtPayment` + migración

- [ ] Añadir los modelos y enums del spec + relaciones inversas.
- [ ] `pnpm prisma migrate dev --name debts` y `pnpm prisma generate`.
- [ ] `pnpm build` + `pnpm test`. Commit `feat: debt models`.

### Task 2: Lógica de saldo de deuda

- [ ] `src/domain/debt.ts`: `debtBalance(amount, payments)` → `{ paid, remaining, status }`.
- [ ] Unit tests (parcial, settled, sobrepago).
- [ ] Commit `feat: debt balance domain logic`.

### Task 3: Módulo `debts`

- [ ] `src/debts/*`: service, controller, DTOs, module; registrar en `AppModule`.
- [ ] `POST /debts/:id/payments` con `accountId` crea Transaction (EXPENSE
      PAYABLE / INCOME RECEIVABLE) y ajusta saldo con `balanceDelta` en una
      `$transaction`; valida `amount <= remaining` (400).
- [ ] `DELETE /debts/:id/payments/:paymentId` revierte saldo y borra el movimiento.
- [ ] e2e: CRUD, abonos parciales/settled, sobrepago 400, abono con cuenta ajusta
      el saldo, borrar abono revierte.
- [ ] `pnpm test`, `pnpm test:e2e`, `pnpm build`. Commit `feat: debts module`.

### Task 4: Frontend — página Deudas

- [ ] `src/services/DebtService.ts`, `src/pages/expenses/hooks/useDebts.ts`.
- [ ] `src/pages/expenses/DebtsPage.tsx` + `DebtModal` + `DebtPaymentDrawer`
      (segmentos Por cobrar/Por pagar, tarjetas con pendiente y progreso).
- [ ] Ruta `/deudas` en `App.tsx`; entrada "Deudas" en `MorePage`.
- [ ] `pnpm build` + `pnpm lint`. Commit `feat: debts UI`.

### Task 5: Frontend — totales en Inicio

- [ ] Tarjeta "Deudas" en Inicio: por pagar y por cobrar (convertidas a MXN con
      `useFxRate`); helper `sumDebtsToMxn` en `accountTotals` (o `debtTotals`).
- [ ] `pnpm build` + `pnpm lint` + `pnpm test`. Commit `feat: debts totals on home`.

### Task 6: Aceptación Fase 4

- [ ] Suites y doc `docs/superpowers/plans/2026-09-19-expenses-fase4-acceptance.md`.
- [ ] Commit `docs: phase 4 acceptance`.
