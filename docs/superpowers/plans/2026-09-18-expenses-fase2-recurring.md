# Expenses Fase 2 — Motor de recurrentes, intereses y MSI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatizar suscripciones e ingresos recurrentes, calcular intereses por tramos y manejar compras a meses (MSI) en tarjetas de crédito.

**Architecture:** Nuevo módulo NestJS `recurring` con un motor determinista `runDue(asOf)` idempotente, un scheduler ligero sin dependencias nuevas, y extensiones a `transactions`/`accounts` para MSI y `credit-summary`. Frontend mobile-first por secciones.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Jest; React 19, React Query v3, zustand, shadcn, vaul.

**Spec:** `docs/superpowers/specs/2026-09-18-expenses-fase2-recurring-design.md`

## Global Constraints

- Mobile-first no negociable (375px, sin scroll horizontal, `cursor-pointer`, transiciones 150–300ms).
- Dinero como número en JSON, `Decimal` en DB; IDs UUID.
- Fechas como día calendario en `America/Mexico_City` (UTC midnight), igual que Fase 0.
- Backend es la fuente de verdad de los saldos; usar `balanceDelta`.
- Sin dependencias nuevas de backend ni frontend.
- `runDue` debe ser **idempotente** (unique `(ruleId, date)`).
- Recurrentes se **desactivan**, no se borran (conservar historial).

---

### Task 1: Esquema Prisma (recurrentes + MSI) y migración

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<ts>_recurring_and_msi/migration.sql` (generada)

**Interfaces:**
- Consumes: models existentes.
- Produces: `RecurringRule`, `RecurringOccurrence`, `InstallmentPlan`, `Installment`, enums `RecurringType`, `RecurringFrequency`, y `Transaction.installments Int?` + relaciones inversas.

- [ ] **Step 1: Añadir al schema** los modelos/enums del spec §3, más `installments Int?` en `Transaction` y las relaciones inversas en `Account`, `Category`, `Person`.
- [ ] **Step 2: Migrar**: `pnpm prisma migrate dev --name recurring_and_msi` y `pnpm prisma generate`.
- [ ] **Step 3: Verificar** que `pnpm build` compila y que la migración aplica en `expenses_test` vía `pnpm test:e2e` (no debe romper suites existentes).
- [ ] **Step 4: Commit** `feat: add recurring rules and MSI schema`.

---

### Task 2: Dominio — fechas recurrentes, interés por tramos y reparto MSI

**Files:**
- Create: `src/domain/recurring.ts`, `src/domain/recurring.spec.ts`
- Create: `src/domain/interest.ts`, `src/domain/interest.spec.ts`
- Create: `src/domain/installments.ts`, `src/domain/installments.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `nextOccurrence(frequency: RecurringFrequency, from: Date, dayOfMonth?: number, dayOfWeek?: number): Date` — siguiente fecha estrictamente posterior a `from`.
  - `clampDayOfMonth(year: number, month: number, day: number): Date`.
  - `computeInterest(balance: number, tiers: { upTo: number | null; annualRate: number }[]): number`.
  - `splitInstallments(total: number, count: number): number[]` (la última absorbe el redondeo; suma exacta = total).

- [ ] **Step 1: Tests (fallan primero)** para:
  - `nextOccurrence` MONTHLY con `dayOfMonth=31` → clamp a fin de mes; WEEKLY/BIWEEKLY con `dayOfWeek`.
  - `computeInterest`: tramos `[{upTo:10000, annualRate:0.10},{upTo:null, annualRate:0.02}]` con `balance=15000` → `10000*0.10/12 + 5000*0.02/12 = 91.67`; `balance=5000` → `41.67`; sin tramos → 0.
  - `splitInstallments(1000,3)` → `[333.33,333.33,333.34]`; `splitInstallments(100,3)` → `[33.33,33.33,33.34]`.
- [ ] **Step 2: Correr y verificar que fallan** (`pnpm test`).
- [ ] **Step 3: Implementar** los tres módulos con los algoritmos del spec §5.
- [ ] **Step 4: Correr y verificar que pasan**.
- [ ] **Step 5: Commit** `feat: recurring dates, tiered interest and MSI split domain logic`.

---

### Task 3: Módulo recurring — CRUD

**Files:**
- Create: `src/recurring/recurring.module.ts`, `src/recurring/recurring.service.ts`, `src/recurring/recurring.controller.ts`
- Create: `src/recurring/dto/create-recurring-rule.dto.ts`, `src/recurring/dto/update-recurring-rule.dto.ts`
- Modify: `src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `RecurringType`, `RecurringFrequency`, domain handlers.
- Produces:
  - `GET /recurring?includeInactive` → `[{ id, name, type, accountId, categoryId, scope, personId, amount, frequency, dayOfMonth, dayOfWeek, startDate, endDate, nextRunDate, lastRunDate, interestTiers, active }]` (type lowercased `subscription|income|interest`).
  - `POST /recurring`, `PUT /recurring/:id`, `DELETE /recurring/:id` (desactiva).
  - `create` calcula `nextRunDate` a partir de `startDate` con `nextOccurrence`/`startDate` según frecuencia.

- [ ] **Step 1: e2e RED** `test/recurring.e2e-spec.ts`: crear suscripción mensual, listar, editar monto, desactivar (no aparece por defecto, sí con `includeInactive`). Cleanup no destructivo.
- [ ] **Step 2: Correr y verificar que falla**.
- [ ] **Step 3: Implementar** DTOs (validar `type`/`frequency` con `@IsIn`, `amount>0` para subscription/income, `interestTiers` para interest, rechazar null), servicio y controlador. Validar `accountId` existe y no archivada (404/400).
- [ ] **Step 4: Correr y verificar que pasa**; `pnpm test`, `pnpm test:e2e`, `pnpm build`.
- [ ] **Step 5: Commit** `feat: recurring rules CRUD`.

---

### Task 4: Motor `runDue` idempotente + scheduler + trigger manual

**Files:**
- Modify: `src/recurring/recurring.service.ts`, `src/recurring/recurring.controller.ts`, `src/recurring/recurring.module.ts`
- Create: `src/recurring/recurring.scheduler.ts`
- Test: `test/recurring-run.e2e-spec.ts`

**Interfaces:**
- Consumes: Task 2 domain, Task 3 rules, `balanceDelta`, `PrismaService`.
- Produces:
  - `RecurringService.runDue(asOf: Date): Promise<{ created: number; skipped: number }>`.
  - `POST /recurring/run` → ejecuta `runDue(new Date())`.
  - `RecurringScheduler` (`onModuleInit`) que llama `runDue` al inicio y cada 60 min (`setInterval`), sin nuevas dependencias; limpiado en `onModuleDestroy`.

- [ ] **Step 1: e2e RED** `test/recurring-run.e2e-spec.ts`:
  - Regla SUBSCRIPTION mensual con `nextRunDate` en el pasado → `runDue` crea 1 EXPENSE, ajusta el saldo con `balanceDelta`, y registra la ocurrencia.
  - Segunda corrida con el mismo `asOf` → `created=0` (idempotente), sin transacción duplicada.
  - Regla INCOME crea un INCOME y sube el saldo.
  - Regla INTEREST con tramos crea un INCOME por `computeInterest(balance, tiers)`.
  - Cleanup no destructivo.
- [ ] **Step 2: Verificar que falla**.
- [ ] **Step 3: Implementar** `runDue` dentro de `prisma.$transaction`, con `occurrence` unique `(ruleId, date)`; en INTEREST usar el saldo actual de la cuenta; avanzar `nextRunDate`/`lastRunDate`.
- [ ] **Step 4: Verificar que pasa**.
- [ ] **Step 5: Commit** `feat: idempotent recurring materialization engine and scheduler`.

---

### Task 5: MSI en la creación/edición de movimientos

**Files:**
- Modify: `src/transactions/dto/create-transaction.dto.ts`, `src/transactions/dto/update-transaction.dto.ts`, `src/transactions/transactions.service.ts`
- Test: `test/msi.e2e-spec.ts`

**Interfaces:**
- Consumes: `splitInstallments`, `InstallmentPlan`/`Installment`.
- Produces: `POST /transactions` acepta `installments?: number` (2–48) cuando `type='expense'` y la cuenta es `CREDIT`; crea el plan con `n` mensualidades (día = fecha de compra, mes a mes). `totalDebt` de la cuenta sube por el total. `PUT`/`DELETE` regeneran/eliminan el plan.

- [ ] **Step 1: e2e RED** `test/msi.e2e-spec.ts`: compra de 1000 a 3 meses en CREDIT → `Transaction.amount=1000`, deuda sube 1000, existen 3 `Installment` de `[333.33,333.33,333.34]` con fechas mensuales; borrar la transacción elimina el plan.
- [ ] **Step 2: Verificar que falla**.
- [ ] **Step 3: Implementar** validación (solo expense+CREDIT, `2<=n<=48`; rechazar en otros casos con 400), creación del plan dentro de la misma `$transaction`, y limpieza/regeneración en update/delete.
- [ ] **Step 4: Verificar que pasa**.
- [ ] **Step 5: Commit** `feat: installments (MSI) on credit purchases`.

---

### Task 6: `credit-summary` con MSI

**Files:**
- Modify: `src/accounts/accounts.service.ts`
- Test: `test/accounts-credit.e2e-spec.ts` (ampliar)

**Interfaces:**
- Consumes: Task 5 plan/installments.
- Produces: `GET /accounts/:id/credit-summary` → `{ totalDebt, periodPayment, available, msiCommitted }`, donde `periodPayment` incluye las mensualidades MSI que vencen en el periodo y `msiCommitted` suma las mensualidades con `dueDate` posterior al corte.

- [ ] **Step 1: e2e RED**: crédito con un cargo normal y un MSI; verificar que `periodPayment` cuenta la mensualidad MSI (no el total) y `msiCommitted` refleja las futuras.
- [ ] **Step 2: Verificar que falla**.
- [ ] **Step 3: Implementar** la integración en `creditSummary` (derivar mensualidades por rango de fechas).
- [ ] **Step 4: Verificar que pasa**.
- [ ] **Step 5: Commit** `feat: include MSI installments in credit summary`.

---

### Task 7: Frontend — Recurrentes (suscripciones, ingresos, intereses)

**Files:**
- Create: `src/services/RecurringService.ts`, `src/pages/expenses/hooks/useRecurring.ts`
- Create: `src/pages/expenses/components/RecurringRuleModal/index.tsx`, `RecurringRuleModal/RecurringRuleForm.tsx`, `RecurringRuleModal/InterestTiersEditor.tsx`
- Create: `src/pages/expenses/components/RecurringList.tsx`
- Modify: `src/pages/expenses/ExpensesPage.tsx`, `src/types/expenses.ts`, `src/pages/expenses/hooks/usePersons.ts` (si hace falta)

**Interfaces:**
- Consumes: `/recurring` endpoints.
- Produces: lista de reglas con tipo/cuenta/monto/frecuencia/próxima fecha/estado; alta/edición en bottom-sheet; activar/desactivar; botón "Ejecutar ahora" (`POST /recurring/run`) que invalida cuentas/transacciones.

- [ ] **Step 1: Service + hook** (`RecurringService` con `parseJsonResponse`, `useRecurring` query key `"recurring"`, mutaciones que invalidan `"recurring"`, `"accounts"`, `["transactions", month, year]`).
- [ ] **Step 2: UI** mobile-first (sección en `/expenses`, bottom-sheet, editor de tramos para interés con vista previa del interés estimado según saldo de la cuenta).
- [ ] **Step 3: Integrar** en `ExpensesPage` y verificar `pnpm build` + `pnpm lint`.
- [ ] **Step 4: Commit** `feat: recurring rules UI`.

---

### Task 8: Frontend — MSI en el modal y `msiCommitted` en crédito

**Files:**
- Modify: `src/pages/expenses/schemas/transactionSchema.ts`, `src/pages/expenses/components/TransactionModal/TransactionForm.tsx`, `src/services/TransactionService.ts`, `src/types/expenses.ts`
- Modify: `src/pages/expenses/components/AccountList/CreditSummary.tsx`

**Interfaces:**
- Consumes: `installments` (Task 5), `msiCommitted` (Task 6).
- Produces: selector "Meses sin intereses" (1–48) visible solo para gasto en cuenta de crédito, con mensualidad estimada; `CreditSummary` muestra `msiCommitted`.

- [ ] **Step 1: Schema/UI**: `installments` opcional; selector en el formulario cuando `type=expense` y la cuenta elegida es `CREDIT`; enviar `installments` en create/update.
- [ ] **Step 2: CreditSummary**: mostrar "Meses sin intereses comprometidos".
- [ ] **Step 3: Verificar** `pnpm build` + `pnpm lint`; revisión estática 375px.
- [ ] **Step 4: Commit** `feat: MSI selector and committed installments display`.

---

### Task 9: Aceptación Fase 2

**Files:**
- Create: `docs/superpowers/plans/2026-09-18-expenses-fase2-acceptance.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: evidencia de suites, criterios y checklist mobile.

- [ ] **Step 1: Correr suites** backend (`pnpm test`, `pnpm test:e2e`) y frontend (`pnpm build`, `pnpm lint`).
- [ ] **Step 2: Checklist mobile estático** (375px) sobre la UI nueva.
- [ ] **Step 3: Criterios**: suscripciones se descuentan al llegar la fecha; ingresos recurrentes; intereses por tramos; MSI con deuda total y mensualidades; idempotencia. Registrar PASS/PARTIAL/FAIL.
- [ ] **Step 4: Commit** `docs: phase 2 acceptance results`.

---

## Self-Review (Fase 2)

- **Cobertura del spec:** suscripciones, ingresos, intereses por tramos y MSI (secciones 3–6), con motor idempotente y scheduler (sección 2).
- **Placeholders:** sin TBD; las tareas de UI listan archivos y responsabilidades.
- **Consistencia de tipos:** `nextOccurrence`/`computeInterest`/`splitInstallments` con firmas estables; `installments` alineado entre backend (Task 5) y frontend (Task 8); `msiCommitted` alineado entre Task 6 y Task 8.
- **Dependencia:** asume Fase 0 y Fase 1 completas (accounts/transactions/scope/design system).
