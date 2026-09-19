# Expenses Fase 1 — Núcleo del dominio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir cuentas con tipo/moneda/crédito, categorías dinámicas, personas con presupuesto semanal acumulable, transferencias y gastos conjunto/personal, con UI mobile-first y design system propio.

**Architecture:** Extiende el backend NestJS de Fase 0 con módulos `persons`, `categories` y lógica de crédito/transferencias/presupuesto personal en `src/domain`. El frontend sigue React Query v3 + zustand + shadcn, aplicando un design system persistido.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Jest; React 19, React Query v3, zustand, shadcn, Tailwind 4, vaul, `ui-ux-pro-max`.

**Spec:** `docs/superpowers/specs/2026-09-18-expenses-fase0-fase1-design.md`

## Global Constraints

- Mobile-first no negociable: validar a 375px sin scroll horizontal.
- Rosa `#F8359B` como primario. Máximo 3 familias tipográficas; una global + una por sección.
- Personas: Mauricio y Maria. Semana inicia domingo. Monto por defecto $300 MXN.
- IDs de personas (sembrados en Fase 0): Mauricio `11111111-1111-4111-8111-111111111111`, Maria `22222222-2222-4222-8222-222222222222`.
- Dinero como número en JSON; `Decimal` en DB.
- Categorías y cuentas se archivan, no se borran.
- El backend es la fuente de verdad de los saldos.

---

### Task 1: Módulo Persons con presupuesto semanal

**Files:**
- Create: `src/domain/personal-budget.ts`, `src/domain/personal-budget.spec.ts`
- Create: `src/persons/persons.module.ts`, `src/persons/persons.service.ts`, `src/persons/persons.controller.ts`, `src/persons/dto/update-person.dto.ts`, `src/persons/dto/create-adjustment.dto.ts`
- Modify: `src/app.module.ts`
- Test: `test/persons.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`.
- Produces:
  - `computePersonalBudget(input: { allowanceStartDate: Date; weeklyAllowance: number; today: Date; adjustmentTotal: number; spent: number }): { accrued: number; adjustmentTotal: number; spent: number; balance: number }`.
  - `GET /persons` → `[{ id, name, weeklyAllowance, allowanceStartDate, balance, spent }]`.
  - `PUT /persons/:id` `{ name?, weeklyAllowance?, allowanceStartDate? }`.
  - `GET /persons/:id/summary` → `{ accrued, adjustmentTotal, spent, balance }`.
  - `POST /persons/:id/adjustments` `{ amount, reason, date }`.

- [ ] **Step 1: Tests de la lógica de semanas (fallan primero)**

`src/domain/personal-budget.spec.ts`:
```ts
import { computePersonalBudget, weeksElapsed } from './personal-budget';

describe('weeksElapsed', () => {
  it('cuenta la semana inicial', () => {
    expect(weeksElapsed(new Date('2026-01-04'), new Date('2026-01-04'))).toBe(1);
  });
  it('cuenta semanas completas desde el domingo', () => {
    expect(weeksElapsed(new Date('2026-01-04'), new Date('2026-01-18'))).toBe(3);
  });
});

describe('computePersonalBudget', () => {
  it('acumula, ajusta y descuenta gastos', () => {
    const r = computePersonalBudget({
      allowanceStartDate: new Date('2026-01-04'),
      weeklyAllowance: 300,
      today: new Date('2026-01-18'),
      adjustmentTotal: -100,
      spent: 250,
    });
    expect(r).toEqual({ accrued: 900, adjustmentTotal: -100, spent: 250, balance: 550 });
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm jest src/domain/personal-budget.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar la lógica**

`src/domain/personal-budget.ts`:
```ts
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = domingo
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  r.setUTCDate(r.getUTCDate() - day);
  return r;
}

export function weeksElapsed(start: Date, today: Date): number {
  const ms = startOfWeek(today).getTime() - startOfWeek(start).getTime();
  return Math.floor(ms / (7 * 86400000)) + 1;
}

export function computePersonalBudget(input: {
  allowanceStartDate: Date; weeklyAllowance: number; today: Date;
  adjustmentTotal: number; spent: number;
}) {
  const accrued = weeksElapsed(input.allowanceStartDate, input.today) * input.weeklyAllowance;
  return {
    accrued,
    adjustmentTotal: input.adjustmentTotal,
    spent: input.spent,
    balance: accrued + input.adjustmentTotal - input.spent,
  };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `pnpm jest src/domain/personal-budget.spec.ts`
Expected: PASS.

- [ ] **Step 5: Escribir el e2e de Persons (falla primero)**

`test/persons.e2e-spec.ts`: `GET /persons` devuelve 2; `GET /persons/11111111-1111-4111-8111-111111111111/summary` responde con las cuatro claves; `POST /persons/11111111-1111-4111-8111-111111111111/adjustments` con `{ amount: 500, reason: 'Bono', date: '2026-01-05' }` suma 500 al balance.

- [ ] **Step 6: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/persons.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 7: Implementar servicio y controlador**

`persons.service.ts` calcula `spent` sumando transacciones `scope = PERSONAL` del `personId`, `adjustmentTotal` sumando `PersonalAdjustment` y aplica `computePersonalBudget`. Expone `findAll`, `update`, `summary`, `addAdjustment`.

- [ ] **Step 8: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/persons.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: persons with weekly accumulative personal budget"
```

---

### Task 2: Módulo Categories (CRUD + archivar)

**Files:**
- Create: `src/categories/categories.module.ts`, `src/categories/categories.controller.ts`, `src/categories/dto/create-category.dto.ts`, `src/categories/dto/update-category.dto.ts`
- Modify: `src/categories/categories.service.ts` (añadir CRUD)
- Modify: `src/app.module.ts`
- Test: `test/categories.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`.
- Produces: `GET /categories?includeArchived`, `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` (archiva). Respuesta `{ id, name, icon, color, archived }`.

- [ ] **Step 1: Escribir el e2e (falla primero)**

`test/categories.e2e-spec.ts`: crear `{ name: 'Mascotas', icon: 'PawPrint', color: '#F8359B' }`, listar, actualizar nombre y archivar; verificar que `GET /categories` ya no la incluye pero `?includeArchived=true` sí.

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/categories.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar CRUD**

`categories.service.ts` (añadir):
```ts
findAll(includeArchived = false) {
  return this.prisma.category.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { name: 'asc' },
  });
}
create(dto) { return this.prisma.category.create({ data: dto }); }
update(id, dto) { return this.prisma.category.update({ where: { id }, data: dto }); }
archive(id) { return this.prisma.category.update({ where: { id }, data: { archived: true } }); }
```
`categories.controller.ts` con las cuatro rutas.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/categories.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: dynamic categories CRUD with archive"
```

---

### Task 3: Crédito, tipos de cuenta y borrado suave

**Files:**
- Create: `src/domain/credit.ts`, `src/domain/credit.spec.ts`
- Modify: `src/accounts/accounts.service.ts`, `src/accounts/accounts.controller.ts`, `src/accounts/dto/create-account.dto.ts`, `src/accounts/dto/update-account.dto.ts`
- Test: `test/accounts-credit.e2e-spec.ts`

**Interfaces:**
- Consumes: Tasks 0.x (Fase 0), `balanceDelta`.
- Produces:
  - `creditPeriodPayment(input: { closingDay: number; today: Date; charges: { date: Date; amount: number }[]; payments: { date: Date; amount: number }[] }): number`.
  - `AccountsService.archive(id)`, `findAll(includeArchived)`, `creditSummary(id)` → `{ totalDebt, periodPayment, available }`.
  - `DELETE /accounts/:id` (archiva), `GET /accounts?includeArchived=true`, `GET /accounts/:id/credit-summary`.
  - `CreateAccountDto`/`UpdateAccountDto` con `type`, `currency`, `creditLimit`, `statementClosingDay`, `paymentDueDay`.

- [ ] **Step 1: Tests de crédito (fallan primero)**

`src/domain/credit.spec.ts`:
```ts
import { creditPeriodPayment } from './credit';

it('suma cargos del periodo y resta pagos', () => {
  const result = creditPeriodPayment({
    closingDay: 15,
    today: new Date('2026-03-20'),
    charges: [
      { date: new Date('2026-03-10'), amount: 1000 },
      { date: new Date('2026-02-20'), amount: 5000 },
    ],
    payments: [{ date: new Date('2026-03-12'), amount: 300 }],
  });
  expect(result).toBe(700);
});
it('clampea el día de corte en meses cortos', () => {
  const result = creditPeriodPayment({
    closingDay: 31, today: new Date('2026-02-28'), charges: [], payments: [],
  });
  expect(result).toBe(0);
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm jest src/domain/credit.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `creditPeriodPayment`**

Calcula el corte actual como la ocurrencia más reciente de `closingDay` (clampeado al último día del mes) menor o igual a `today`; el inicio del periodo es un mes antes. Suma cargos en `(inicio, corte]` y resta pagos en el mismo rango; nunca menor que 0.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `pnpm jest src/domain/credit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Extender Accounts**

Actualiza DTOs y servicio: en `create`, si `type = CREDIT` permitir `creditLimit`, `statementClosingDay`, `paymentDueDay`; el `balance` sigue representando deuda. `update` acepta esos campos. `archive` hace `archived: true`. `creditSummary` usa `balance` como `totalDebt`, `creditPeriodPayment` para `periodPayment` y `creditLimit - totalDebt` para `available`.

- [ ] **Step 6: Escribir y correr el e2e**

`test/accounts-credit.e2e-spec.ts`: crear cuenta `CREDIT` con límite 10000 y corte 15, registrar un cargo, verificar `credit-summary` y que `DELETE` la archiva sin desaparecer del histórico de movimientos.
Run: `pnpm jest --config test/jest-e2e.json test/accounts-credit.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: account types, credit summary and soft delete"
```

---

### Task 4: Transferencias y pago de tarjeta

**Files:**
- Modify: `src/transactions/transactions.service.ts`, `src/transactions/transactions.controller.ts`, `src/transactions/dto/create-transaction.dto.ts`
- Test: `test/transfers.e2e-spec.ts`

**Interfaces:**
- Consumes: `balanceDelta`, Accounts.
- Produces: `POST /transactions` con `{ type: 'transfer', accountId, toAccountId, amount, date, description? }` que resta en origen y suma/abona en destino dentro de una `$transaction`; `PUT`/`DELETE` revierten ambos lados.

- [ ] **Step 1: Escribir el e2e (falla primero)**

`test/transfers.e2e-spec.ts`: débito con 5000 y crédito con deuda 2000; transferir 1500 al crédito; verificar débito 3500 y deuda del crédito 500.

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/transfers.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `create`, cuando `type = TRANSFER`, calcular `balanceDelta` para origen (`SOURCE`) y destino (`DESTINATION`) e incrementar ambas cuentas en la misma `$transaction`. `update`/`remove` revierten los deltas de origen y destino antes de aplicar o eliminar. Validar que `toAccountId` exista y sea distinto de `accountId`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/transfers.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: transfers between accounts with two-sided balance effects"
```

---

### Task 5: Scope conjunto/personal en movimientos

**Files:**
- Modify: `src/transactions/dto/create-transaction.dto.ts`, `src/transactions/dto/update-transaction.dto.ts`, `src/transactions/transactions.service.ts`
- Create: `scripts/backfill-scope.ts`
- Test: `test/transaction-scope.e2e-spec.ts`

**Interfaces:**
- Consumes: Persons, Transactions.
- Produces: `POST/PUT /transactions` acepta `scope: 'joint' | 'personal'` y `personId` (obligatorio cuando `scope = personal`); rechaza `personal` sin `personId` con 400. La transacción guarda `scope` y `personId`.

- [ ] **Step 1: Escribir el e2e (falla primero)**

`test/transaction-scope.e2e-spec.ts`: crear un gasto `personal` con `personId: '11111111-1111-4111-8111-111111111111'` y verificar que `GET /persons/11111111-1111-4111-8111-111111111111/summary` incrementa `spent`; intentar `personal` sin `personId` y esperar 400.

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/transaction-scope.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar validación y persistencia**

DTOs con `scope?: 'joint'|'personal'` y `personId?: string`; `create`/`update` validan la combinación y guardan `scope` (default `JOINT`) y `personId`.

- [ ] **Step 4: Backfill opcional**

`scripts/backfill-scope.ts` pone `scope = JOINT` en movimientos existentes con `scope` nulo (idempotente).

- [ ] **Step 5: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/transaction-scope.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: joint vs personal scope on transactions"
```

---

### Task 6: Design system con ui-ux-pro-max (rosa primario, tipografía por sección)

**Files:**
- Create: `design-system/MASTER.md` y `design-system/pages/{cuentas,movimientos,personas,categorias}.md`
- Modify: `src/index.css`, `index.html`
- Modify: `.opencode/skills/ui-ux-pro-max` (no tocar; sólo consumir)

**Interfaces:**
- Consumes: skill `ui-ux-pro-max`.
- Produces: tokens aplicados a Tailwind 4 + shadcn, con primario `#F8359B`.

- [ ] **Step 1: Generar el design system**

```bash
cd /Users/mauriciojesushernndezdiaz/Documents/projects/react/expenses-v2
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py \
  "personal finance mobile app couple shared budget pink" \
  --design-system --persist -p "Expenses"
```

- [ ] **Step 2: Generar overrides por página**

```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "accounts list credit card" --design-system --persist -p "Expenses" --page cuentas
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "transaction list filters" --design-system --persist -p "Expenses" --page movimientos
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "personal budget persons" --design-system --persist -p "Expenses" --page personas
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "category management" --design-system --persist -p "Expenses" --page categorias
```

- [ ] **Step 3: Ajustar MASTER a la marca**

Editar `design-system/MASTER.md`: primario `#F8359B` con su escala; fuente **global** para nav/labels/body; definir como máximo **una** fuente de sección por página; `tabular-nums` en importes; contraste AA en claro y oscuro.

- [ ] **Step 4: Aplicar tokens**

Actualizar las variables de `src/index.css` (Tailwind 4 + shadcn: `--primary`, `--ring`, etc.) y las familias tipográficas; cargar las fuentes en `index.html` con `font-display: swap`.

- [ ] **Step 5: Verificar en mobile**

Run: `pnpm dev`; revisar a 375px sin scroll horizontal; confirmar contraste en ambos temas.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: persist and apply mobile-first design system with pink primary"
```

---

### Task 7: Frontend — Cuentas (tipos, crédito, pagar tarjeta)

**Files:**
- Modify: `src/types/expenses.ts` (Account con `type`, `currency`, `creditLimit`, `statementClosingDay`, `paymentDueDay`, `archived`)
- Modify: `src/services/AccountService.ts` (create/update/archive/creditSummary)
- Modify: `src/pages/expenses/hooks/useAccounts.ts`
- Create: `src/pages/expenses/components/AccountModal/index.tsx`, `src/pages/expenses/components/AccountModal/AccountForm.tsx`
- Create: `src/pages/expenses/components/AccountList/CreditSummary.tsx`, `src/pages/expenses/components/AccountList/PayCardDrawer.tsx`
- Modify: `src/pages/expenses/components/AccountList.tsx`, `src/stores/expenses.store.ts`

**Interfaces:**
- Consumes: `GET/POST/PUT/DELETE /accounts`, `GET /accounts/:id/credit-summary`.
- Produces: lista de cuentas con edición/archivado; tarjeta de crédito con deuda, pago del periodo y disponible; botón "Pagar tarjeta" que abre un bottom-sheet para elegir cuenta origen y crea una transferencia.

- [ ] **Step 1: Extender tipos y servicio**

Añadir los campos al tipo `Account` y los métodos `createAccount`, `updateAccount`, `archiveAccount`, `getCreditSummary` en `AccountService.ts`.

- [ ] **Step 2: Formulario de cuenta en bottom-sheet**

`AccountForm.tsx` con `type`, `currency` y, si `type = CREDIT`, `creditLimit`, `statementClosingDay`, `paymentDueDay`. Usar `Drawer` de vaul.

- [ ] **Step 3: Resumen de crédito y "Pagar tarjeta"**

`CreditSummary.tsx` muestra deuda total, pago del periodo y disponible. `PayCardDrawer.tsx` lista cuentas de origen y, al confirmar, hace `POST /transactions` con `type: 'transfer'` hacia la tarjeta.

- [ ] **Step 4: Invalidar queries correctas**

Tras crear/editar/archivar o transferir, invalidar `"accounts"` y `["transactions", month, year]` para reflejar saldos.

- [ ] **Step 5: Verificar**

Run: `pnpm build && pnpm lint`; revisar flujo a 375px.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: accounts UI with credit summary and pay-card flow"
```

---

### Task 8: Frontend — Categorías

**Files:**
- Create: `src/services/CategoryService.ts`, `src/pages/expenses/hooks/useCategories.ts`
- Create: `src/pages/expenses/components/CategoryModal/index.tsx`, `src/pages/expenses/components/CategoryModal/CategoryForm.tsx`
- Create: `src/pages/expenses/CategoriesPage.tsx` (o bottom-sheet desde ajustes)
- Modify: `src/pages/expenses/components/TransactionModal/CategoryPicker.tsx` para consumir la API

**Interfaces:**
- Consumes: `/categories`.
- Produces: alta/edición/archivado de categorías y su uso en el modal de movimientos.

- [ ] **Step 1: Servicio y hook**

`CategoryService` con `getCategories(includeArchived?)`, `createCategory`, `updateCategory`, `archiveCategory`; hook `useCategories` con query key `"categories"`.

- [ ] **Step 2: UI de categorías**

Lista con `CategoryIcon`, bottom-sheet para crear/editar (nombre, icono, color con el rosa como opción) y acción de archivar con confirmación.

- [ ] **Step 3: Conectar al modal de movimientos**

El selector de categorías usa `useCategories` en lugar del enum local.

- [ ] **Step 4: Verificar**

Run: `pnpm build && pnpm lint`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: dynamic categories UI"
```

---

### Task 9: Frontend — Personas y presupuesto personal

**Files:**
- Create: `src/services/PersonService.ts`, `src/pages/expenses/hooks/usePersons.ts`
- Create: `src/pages/expenses/components/PersonsList.tsx`, `src/pages/expenses/components/PersonAdjustmentDrawer.tsx`
- Modify: `src/pages/expenses/ExpensesPage.tsx`

**Interfaces:**
- Consumes: `GET /persons`, `GET /persons/:id/summary`, `POST /persons/:id/adjustments`, `PUT /persons/:id`.
- Produces: dos tarjetas (Mauricio/Maria) con monto semanal, disponible y gastado, y botón de ajuste.

- [ ] **Step 1: Servicio y hook**

`PersonService` con `getPersons`, `getSummary`, `addAdjustment`, `updatePerson`; hook `usePersons` con query key `"persons"`.

- [ ] **Step 2: UI de personas**

`PersonsList.tsx` muestra por persona: monto semanal, acumulado, gastado y disponible. `PersonAdjustmentDrawer.tsx` registra ajustes (+/−) con motivo y fecha.

- [ ] **Step 3: Integrar en la página**

Añadir `PersonsList` a `ExpensesPage.tsx` (después de Cuentas).

- [ ] **Step 4: Verificar**

Run: `pnpm build && pnpm lint`; revisar a 375px.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: persons and personal budget UI"
```

---

### Task 10: Frontend — Modal de movimientos (conjunto/personal y transferencia)

**Files:**
- Modify: `src/pages/expenses/schemas/transactionSchema.ts`
- Modify: `src/pages/expenses/components/TransactionModal/TransactionForm.tsx`
- Modify: `src/services/TransactionService.ts`

**Interfaces:**
- Consumes: `/transactions`, `/categories`, `/persons`, `/accounts`.
- Produces: modal que permite `scope` (Conjunto / Personal de X), tipo transferencia con cuenta destino, y categorías desde la API.

- [ ] **Step 1: Extender el schema**

Añadir `scope: z.enum(['joint','personal'])` y `personId` requerido cuando `scope = personal` (con `superRefine`), y `toAccountId` requerido cuando `type = 'transfer'`.

- [ ] **Step 2: Extender el formulario**

Toggle Conjunto/Personal; si es personal, selector de persona; si es transferencia, selector de cuenta destino y sin categoría.

- [ ] **Step 3: Servicio**

`TransactionService` envía `scope`, `personId` y `toAccountId`; invalida `"accounts"`, `"persons"` y `["transactions", month, year]` tras cada mutación.

- [ ] **Step 4: Verificar**

Run: `pnpm build && pnpm lint`; probar flujos conjunto, personal y transferencia a 375px.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: transaction modal with person scope and transfers"
```

---

### Task 11: Aceptación Fase 1 y checklist mobile

**Files:**
- Modify: `README.md` (flujo y variables)
- Create: `docs/superpowers/plans/2026-09-18-expenses-fase1-acceptance.md` (registro de resultados)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de los criterios de aceptación de Fase 1.

- [ ] **Step 1: Correr toda la suite backend**

Run: `pnpm jest && pnpm jest --config test/jest-e2e.json`
Expected: todo PASS.

- [ ] **Step 2: Checklist mobile de la skill**

Validar en 375px: sin scroll horizontal, controles con `cursor-pointer`, transiciones 150–300ms, foco visible, contraste AA en claro y oscuro, `prefers-reduced-motion`.

- [ ] **Step 3: Recorrido de criterios de aceptación**

Comprobar los 7 criterios de la sección 16 del spec y anotar resultados en el archivo de aceptación.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: phase 1 acceptance results and mobile checklist"
```

---

## Self-Review (Fase 1)

- **Cobertura del spec:** cuentas/tipos/crédito/soft-delete (sección 6 y 9), categorías dinámicas (7 y 9), personas/presupuesto (8 y 9), transferencias y pago de tarjeta (7–9), scope conjunto/personal (6–9), design system (9) y criterios de aceptación (16).
- **Placeholders:** sin TBD; las tareas de UI referencian archivos y responsabilidades concretas y las de lógica incluyen código y asserts.
- **Consistencia de tipos:** `computePersonalBudget`, `weeksElapsed`, `creditPeriodPayment` y `balanceDelta` con firmas estables entre tareas; `scope`/`personId`/`toAccountId` alineados entre backend (Task 5) y frontend (Task 10).
- **Dependencia:** asume Fase 0 completada (Prisma, Accounts, Transactions, migración y deploy).
