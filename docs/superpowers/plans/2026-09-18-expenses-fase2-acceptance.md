# Aceptación Fase 2 — Resultados

> Registro de ejecución de la Task 9 (`task-9-brief.md`) para la rama
> `feat/fase2-recurring`. Fecha: 2026-09-19.

## Metadata

| Campo | Valor |
|---|---|
| Frontend | `expenses-v2` @ `feat/fase2-recurring` (`d193ffa`) |
| Backend | `expenses-api` @ `feat/fase2-recurring` (`406a76c`) |
| Spec | `docs/superpowers/specs/2026-09-18-expenses-fase2-recurring-design.md` |
| Plan | `docs/superpowers/plans/2026-09-18-expenses-fase2-recurring.md` |

## 1. Suites

### Backend unit

```
$ pnpm test
Test Suites: 7 passed, 7 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        3.975 s
```

Incluye `src/domain/{interest,installments,recurring,credit,balance,personal-budget}.spec.ts`.
**PASS.**

### Backend e2e

```
$ pnpm test:e2e
Datasource "db": PostgreSQL database "expenses_test", schema "public" at "localhost:5432"
2 migrations found in prisma/migrations
No pending migrations to apply.
[Nest] ERROR [RecurringService] Recurring rule <id> (Regla con tramos corruptos) failed: Cannot read properties of null (reading 'upTo')
Test Suites: 13 passed, 13 total
Tests:       102 passed, 102 total
Snapshots:   0 total
Time:        4.199 s
```

El `ERROR` es **esperado**: corresponde al test de aislamiento de fallos
(`recurring-run.e2e-spec.ts:355`), que inyecta una regla corrupta y verifica que
el sweep continúa. **PASS.**

### Frontend build

```
$ pnpm build
✓ 2682 modules transformed.
dist/assets/index-ic-UD7RK.js   950.63 kB │ gzip: 292.55 kB
✓ built in 2.45s
PWA ... precache 10 entries (994.31 KiB)
```

Advertencias no bloqueantes: chunk JS de `950.63 kB` (> 500 kB) y `browserslist`
con datos de 16 meses. **PASS.**

### Frontend lint

```
$ pnpm lint
✖ 4 problems (0 errors, 4 warnings)
```

Warnings: `react-refresh/only-export-components` en `button.tsx`, `form.tsx` y
`routines/storage/StorageContext.tsx`; `react-hooks/exhaustive-deps` en
`ExpensesTrend.tsx`. Ninguno en el código nuevo de Fase 2. **PASS** (0 errores).

## 2. Checklist mobile (estático, sin navegador)

No hay navegador disponible; la verificación es **estática por inspección de
código**. No se pudo medir scroll horizontal real, contraste renderizado ni
`prefers-reduced-motion` en runtime.

| Ítem | Resultado | Evidencia |
|---|---|---|
| Sin anchos fijos > viewport | PASS (estático) | No hay `w-[Npx]`/`min-w-[Nrem]` > 375px en la UI nueva. `RecurringList.tsx:235` usa `grid-cols-1 md:grid-cols-2`; `RecurringRuleForm.tsx:287,359` `grid-cols-2`; `:465` `grid-cols-3`. |
| `min-w-0` / `truncate` en texto largo | PASS | `RecurringList.tsx:65-67` (`min-w-0` + `truncate` en el nombre) con badges `shrink-0`. |
| Layout fluido / wrappers | PASS | `RecurringList.tsx:177,179` `flex flex-wrap` en cabecera y acciones; `CreditSummary.tsx:51` `flex flex-wrap`. Drawer `RecurringRuleModal/index.tsx:25,36` con `max-h-[90vh]` + `overflow-y-auto px-4 pb-6`. |
| `cursor-pointer` en clickables | PASS | `RecurringList.tsx:88,125,183,190,213,228`; `InterestTiersEditor.tsx:74,98`; `RecurringRuleForm.tsx:294,364,374,476,571,597,632,638`. `button.tsx` ya lo incluye en la base. |
| Transiciones 150–300ms | PASS | `transition-shadow duration-200` (`RecurringList.tsx:60`), `transition-colors duration-200` (`RecurringRuleForm.tsx:294,364,374,475,597,604`), `transition-transform duration-200` (`:610`). |
| Focus visible | PASS | Componentes `Button`/`Input`/`RadioGroupItem` heredan `focus-visible:ring` de la base (Fase 1). |
| Contraste AA | PASS (estático) | Preview de interés y aviso de corrida en `bg-primary-100 text-primary-700` (`InterestTiersEditor.tsx:157-159`, `RecurringList.tsx:197`). Etiquetas `text-muted-foreground` sobre `bg-card`/`bg-muted`. Deuda total en `text-destructive` con icono + `aria-hidden`. No se midió contraste renderizado. |
| `prefers-reduced-motion` | PASS | Bloque global `@media (prefers-reduced-motion: reduce)` en `src/index.css:145-154` (atenúa animaciones/transiciones); la UI nueva usa utilidades `transition-*` estándar. |
| `tabular-nums` en importes | PASS | `RecurringList.tsx:99,109,115`, `InterestTiersEditor.tsx:159`, `CreditSummary.tsx:29,36,42,55`, `TransactionForm.tsx:456`. |
| Selector MSI (1–48) | PASS (estático) | `TransactionForm.tsx:99-108` genera `Normal (1 pago)` + 2–48 meses vía `DrawerSelector`; mensualidad estimada `:110-113,453-460`; solo visible en EXPENSE sobre CREDIT (`:93,434`). |
| Resumen de crédito con MSI | PASS (estático) | `CreditSummary.tsx:26-59` muestra deuda total / pago del periodo / disponible y la fila `msiCommitted` cuando es > 0. |
| Validación real a 375px | PARTIAL | Sin navegador: no se pudo confirmar ausencia de scroll horizontal ni interacción táctil en runtime. |

## 3. Criterios de aceptación Fase 2

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | Suscripciones se descuentan al llegar la fecha (`runDue`) | **PASS** | `recurring.service.ts:131-205` `runDue` idempotente; `materialize` crea EXPENSE y `balanceDelta` resta saldo (`:83-117`); `RecurringScheduler` corre al arrancar y cada 60 min (`recurring.scheduler.ts:13-21`); `POST /recurring/run`. e2e `recurring-run.e2e-spec.ts:96` ("materializa una suscripción vencida, ajusta el saldo y es idempotente"), `:141` (varias ocurrencias), `:305` (EXPENSE en CREDIT sube deuda). |
| 2 | Ingresos recurrentes (salario) | **PASS** | `materialize` INCOME crea INCOME y suma saldo (`recurring.service.ts:83-85,91-101`); e2e `recurring-run.e2e-spec.ts:162` ("crea un INCOME ... y sube el saldo"); CRUD `recurring.e2e-spec.ts:138` (regla INCOME). |
| 3 | Intereses por tramos | **PASS** | `domain/interest.ts:6-26` `computeInterest` marginal (tramos ordenados, `upTo:null` al final, redondeo a 2); validación `parseInterestTiers` (`recurring.service.ts:207-233`); unit `interest.spec.ts`; e2e `recurring-run.e2e-spec.ts:192` (INCOME con `computeInterest`), `:221` (interés 0 ⇒ sin transacción), `:331` (INTEREST en CREDIT reduce deuda). |
| 4 | MSI: deuda total reconocida + mensualidades + `periodPayment`/`msiCommitted` | **PASS** | `transactions.service.ts:42-63` crea `InstallmentPlan` con `splitInstallments` (`domain/installments.ts`); el movimiento guarda el total. `accounts.service.ts:99-128` suma `msiDue` al `periodPayment`, calcula `msiCommitted` (`isAfterCreditPeriod`) y `totalDebt = balance`. e2e `msi.e2e-spec.ts:98` (total + deuda + 3 mensualidades), `accounts-credit.e2e-spec.ts:161` (mensualidad vencida en periodo / futuras en `msiCommitted`). UI: selector MSI (`TransactionForm.tsx:434-464`) y `CreditSummary.tsx`. |
| 5 | Idempotencia (correr dos veces no duplica) | **PASS** | Unique `@@unique([ruleId, date])`; `runDue` consulta `findUnique` y cuenta `skipped` sin recalcular (`recurring.service.ts:154-174`). e2e `recurring-run.e2e-spec.ts:96` (segunda corrida) y `:242` ("salta una ocurrencia ya registrada sin duplicar la transacción"); `POST /recurring/run` devuelve `{created, skipped, failed}` (`:287`). |
| 6 | CRUD recurrente + activar/desactivar vía UI/API | **PASS** | `recurring.controller.ts` GET/POST/PUT/DELETE + `POST /recurring/run`; `recurring.service.ts:352-430` (`findAll`, `create`, `update` con reactivación, `deactivate`). e2e `recurring.e2e-spec.ts:71` (crear/listar/editar/desactivar), `:428` (reactivar con `PUT {active:true}`), `:453` (404). UI `RecurringList.tsx` (alta/edición/activar/desactivar/Ejecutar ahora) + `RecurringRuleModal`. |

**Criterios: 6 PASS, 0 PARTIAL, 0 FAIL.**

## 4. Follow-ups (FAIL / PARTIAL)

1. **[Checklist mobile — ABIERTO] Validación visual real a 375px.** Abrir la UI
   de Recurrentes (lista + bottom-sheet + editor de tramos) y el selector MSI en
   viewport 375px (DevTools/Playwright) para confirmar ausencia de scroll
   horizontal e interacción táctil. No verificable sin navegador.
2. **[Concern — ABIERTO] Zona horaria.** El core normaliza a día calendario en
   **UTC** (`recurring.service.ts:37-47`), no a `America/Mexico_City` como dice
   la prosa del spec §2. Coincide con la convención de Fase 0/1, pero cerca de
   medianoche (UTC−6) el día de vencimiento puede diferir del día local. No
   cubierto por tests con `asOf` real; revisar si se desea exactitud local.
3. **[Opcional, no bloqueante] Code-splitting del bundle** (950 kB) para
   eliminar el warning de Vite.

## 5. Concerns

- Los cambios sin commitear del usuario en `src/pages/routines/*` **no** se
  tocaron ni se incluyeron en el commit de aceptación (se usó `git add` selectivo).
- La verificación de los criterios 1–6 es por código + suites automatizadas; no
  se ejecutó un flujo end-to-end manual en navegador.
- El `ERROR` de `RecurringService` en la salida de `test:e2e` es intencional
  (test de aislamiento de fallos), no un fallo de suite.
