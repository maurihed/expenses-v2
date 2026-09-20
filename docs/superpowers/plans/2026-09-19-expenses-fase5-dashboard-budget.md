# Expenses Fase 5 — Dashboard y presupuesto mensual Implementation Plan

> Spec: `docs/superpowers/specs/2026-09-19-expenses-fase5-dashboard-budget-design.md`.

**Goal:** presupuesto mensual y completar el dashboard (Deuda actual + progreso).

**Tech Stack:** NestJS 10 + Prisma 5 + Postgres 16; React 19 + React Query v3.

## Global Constraints

- Sin dependencias nuevas. Dinero como número en JSON; `Decimal` en DB.
- Mobile-first; design system actual. Conversión USD→MXN con la tasa (Fase 3).

---

### Task 1: Modelo `Budget` + migración

- [ ] Añadir el modelo del spec a `prisma/schema.prisma`.
- [ ] `pnpm prisma migrate dev --name budget` + `pnpm prisma generate`.
- [ ] `pnpm build` + `pnpm test`. Commit `feat: budget model`.

### Task 2: Módulo `budgets`

- [ ] `src/budgets/*`: service, controller, DTO, module; registrar en `AppModule`.
- [ ] `GET /budgets?year&month`, `PUT /budgets` (upsert), `GET /budgets`,
      `DELETE /budgets/:id`; validar year/month/amount.
- [ ] e2e: upsert idempotente, get por mes, validaciones.
- [ ] `pnpm test`, `pnpm test:e2e`, `pnpm build`. Commit `feat: budgets module`.

### Task 3: Frontend — servicio y hook

- [ ] `src/services/BudgetService.ts`, `src/pages/expenses/hooks/useBudget.ts`.
- [ ] `pnpm build` + `pnpm lint`. Commit `feat: budget service and hook`.

### Task 4: Frontend — dashboard y presupuesto

- [ ] Inicio: tarjeta **Deuda actual** (crédito + por pagar, MXN vía fx).
- [ ] Sección **Presupuesto del mes** con progreso y bottom-sheet para
      definir/editar (`BudgetDrawer`).
- [ ] `pnpm build` + `pnpm lint`. Commit `feat: dashboard debt and monthly budget`.

### Task 5: Aceptación Fase 5

- [ ] Suites + doc `docs/superpowers/plans/2026-09-19-expenses-fase5-acceptance.md`.
- [ ] Commit `docs: phase 5 acceptance`.
