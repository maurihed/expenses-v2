# Aceptación Fase 1 — Resultados

> Registro de ejecución de la Task 11 (`task-11-brief.md`) para la rama
> `feat/fase1-core`. Fecha: 2026-09-18.

## Metadata

| Campo | Valor |
|---|---|
| Frontend | `expenses-v2` @ `feat/fase1-core` (`3ada883`) |
| Backend | `expenses-api` @ `feat/fase1-core` (`138e6a9`) |
| Spec | `docs/superpowers/specs/2026-09-18-expenses-fase0-fase1-design.md` §16 |
| Design system | `design-system/MASTER.md` |

## 1. Suites

### Backend unit

```
$ pnpm test
Test Suites: 4 passed, 4 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        2.034 s
```

**PASS.**

### Backend e2e

```
$ pnpm test:e2e
Datasource "db": PostgreSQL database "expenses_test" ... at "localhost:5432"
1 migration found ... No pending migrations to apply.

Test Suites: 10 passed, 10 total
Tests:       69 passed, 69 total
Snapshots:   0 total
Time:        4.711 s
```

**PASS.**

### Frontend build

```
$ pnpm build
✓ 2676 modules transformed.
✓ built in 3.76s
PWA ... precache 10 entries (968.03 KiB)
```

Advertencia no bloqueante: chunk JS de `925.06 kB` (> 500 kB) y
`browserslist` con datos de 16 meses. **PASS.**

### Frontend lint

```
$ pnpm lint
✖ 4 problems (0 errors, 4 warnings)
```

Warnings: `react-refresh/only-export-components` en `button.tsx`, `form.tsx`,
`routines/storage/StorageContext.tsx` y `react-hooks/exhaustive-deps` en
`ExpensesTrend.tsx`. **PASS** (0 errores).

## 2. Checklist mobile (estático, sin navegador)

No hay navegador disponible en este entorno; la verificación es **estática por
inspección de código**. No se pudo medir scroll horizontal real, ni calcular
contraste renderizado, ni probar `prefers-reduced-motion` en runtime.

| Ítem | Resultado | Evidencia |
|---|---|---|
| Sin anchos fijos > viewport | PASS (estático) | No hay `w-[Npx]`/`min-w-[Nrem]` > 375px en el diff de Fase 1. Los únicos fijos son `w-[100px]` (handle de drawer), `w-[200px]` (`ExpensesFilters`, sin cambios) y `min-w-[8rem]` (dropdown shadcn). |
| `min-w-0` / `truncate` en texto largo | PASS | `CategoriesPage.tsx:96,106`, `AccountList.tsx:93-96`, `PersonsList.tsx:54-62`. |
| Layout fluido (`max-w-*` como tope) | PASS | `mobile-layout.tsx:11` (`max-w-7xl mx-auto px-4`), páginas con `max-w-3xl`. |
| `cursor-pointer` en clickables | PARCIAL | Mayoría de `Button` y todos los `button`/radio nativos lo incluyen, pero falta en varios `<Button>`: `AccountForm.tsx:200-209,223-241,245-253,334-375`, `PayCardDrawer.tsx:116-148`, `TransactionForm.tsx:447-461`, `AccountList.tsx:58`. La clase base de `button.tsx:8` no lo trae. |
| Transiciones 150–300ms | PASS | `duration-200` en tarjetas, radios y botones de acción; `transition-all` de `button.tsx` usa el default de Tailwind (150ms). |
| Focus visible | PASS (estático) | `focus-visible:ring-ring/50` + `focus-visible:ring-[3px]` en `button.tsx:8`; inputs `focus-visible:ring-ring`. |
| Contraste AA | PARCIAL | `--primary` rosa solo como relleno con `--primary-foreground` oscuro (5.63:1) y como `dark:text-primary`; enlaces usan `text-primary-700` (6.49:1) en `button.tsx:19`. Riesgo: `CategoryForm.tsx:172,189` pinta un `Check` `text-white` sobre colores de categoría arbitrarios (p. ej. amarillos claros) — contraste no garantizado. |
| `prefers-reduced-motion` | FAIL (no implementado) | Cero ocurrencias de `motion-reduce`/`prefers-reduced-motion` en `src/` o `index.html`. Existen animaciones de `tw-animate-css` (dialog/drawer/popover) y `animate-spin`. |
| Tipografía por sección (máx. 3 familias) | PASS | Inter global; Sora (`font-display`) en cuentas/movimientos/categorías; Fraunces (`font-serif`) en personas. `index.html` carga las 3 con `display=swap` + `preconnect`. |
| `tabular-nums` en importes | PASS | 10 usos en UI de Fase 1. |

## 3. Criterios de aceptación §16

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | CRUD de cuentas con tipo, moneda y campos de crédito; archivar en vez de borrar | **PASS** | `accounts.controller.ts` (`@Post`, `@Put`, `@Delete`, `@Get(':id/credit-summary')`); `accounts.service.ts:71-74` marca `archived: true`; schema `creditLimit/statementClosingDay/paymentDueDay/archived`; e2e `accounts-credit.e2e-spec.ts:49` ("...su borrado suave"), `accounts.e2e-spec.ts`; UI `AccountForm.tsx`. |
| 2 | Categorías dinámicas con archivar; los movimientos existentes conservan su categoría | **PASS** | `categories.controller.ts` CRUD; `categories.service.ts:78-86` archiva; `Transaction.categoryId` (FK, no se borra al archivar); e2e `categories.e2e-spec.ts:59,97`, `transactions-create.e2e-spec.ts:109` (reutiliza categoría); UI `CategoriesPage.tsx` + `CategoryForm.tsx`. |
| 3 | Dos personas con presupuesto semanal acumulable, ajustes e historial | **PASS** *(con nota)* | Semilla Mauricio/Maria (`prisma/seed.ts:5-6`); `persons.controller.ts` (`@Get`, `@Put`, `@Get(':id/summary')`, `@Post(':id/adjustments')`); `personal-budget.ts`; e2e `persons.e2e-spec.ts` (accrued/adjustments/spent/balance, spent solo PERSONAL). **Nota:** el spec §7 nombra el campo `adjustments`, la implementación responde `adjustmentTotal`. Los ajustes se persisten como historial (`PersonalAdjustment`), pero no existe endpoint ni UI para *leer* ese historial (tampoco lo define el spec). |
| 4 | Transferencias y "Pagar tarjeta" con saldos correctos | **PASS** | `transactions.service.ts` type TRANSFER + `toAccountId`; `transfers.e2e-spec.ts:63,112,147,210,236`; `PayCardDrawer.tsx` invoca pago como transferencia a la tarjeta; `CreditSummary.tsx` muestra deuda/pago/ disponible. |
| 5 | Los movimientos distinguen conjunto vs. personal | **PASS** | Schema `scope Scope @default(JOINT)` + `personId`; `transaction-scope.e2e-spec.ts` (personal suma `spent`, JOINT con `personId` nulo, update joint↔personal); UI toggle "Conjunto/Personal" en `TransactionForm.tsx:229-260`. |
| 6 | Design system persistido aplicado con rosa primario y tipografía por sección | **PASS** | `design-system/MASTER.md` + `pages/{cuentas,movimientos,personas,categorias}.md`; tokens en `src/index.css` (`--primary:#f8359b`, escala rosa, `--ring`, `--font-display`, `--font-serif`); fuentes en `index.html`; `font-display`/`font-serif` por sección. |
| 7 | Todo validado a 375px sin scroll horizontal | **PARTIAL** | No hubo navegador; solo checklist estático. Sin anchos fijos > 375px y con `min-w-0`/`truncate`, pero **no se pudo confirmar ausencia de scroll horizontal en runtime**. Ver hallazgos del checklist (cursor-pointer inconsistente, `prefers-reduced-motion` ausente). |

**Resumen: 6 PASS, 1 PARTIAL, 0 FAIL.**

## 4. Follow-ups (FAIL / PARTIAL)

1. **[Criterio 7 — PARTIAL] Validación visual real a 375px.** Abrir la app en
   viewport 375px (DevTools / Playwright) y confirmar ausencia de scroll
   horizontal en: cuentas, categorías, personas, modal de movimiento, drawers de
   pagar tarjeta y ajuste. No verificable sin navegador.
2. **[Checklist — FAIL] `prefers-reduced-motion`.** Añadir un bloque en
   `src/index.css` que desactive/atenúe animaciones y transiciones, o
   `motion-reduce:` en los componentes con animación.
3. **[Checklist — PARCIAL] `cursor-pointer` inconsistente.** Añadir
   `cursor-pointer` a la clase base de `button.tsx` (o a los `<Button>` listados)
   para cubrir `AccountForm`, `PayCardDrawer`, `TransactionForm`, `AccountList`.
4. **[Checklist — PARCIAL] Contraste del `Check` blanco en `CategoryForm`.**
   Usar un color de check dependiente de la luminancia del color elegido, o un
   borde/forma en lugar de color blanco.
5. **[Spec — nota] Nombre de campo `adjustmentTotal` vs `adjustments`.** Alinear
   la respuesta de `GET /persons/:id/summary` con el spec §7 o actualizar el spec.
6. **[Opcional] Code-splitting del bundle** (925 kB) para eliminar el warning de
   Vite. No bloquea Fase 1.

## 5. Concerns

- Los cambios sin commitear del usuario en `src/pages/routines/*` **no** se
  tocaron ni se incluyeron en el commit de aceptación.
- La verificación de criterios 1–6 es por código + suites automatizadas; no se
  ejecutó un flujo end-to-end manual en navegador.
