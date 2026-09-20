# Aceptación Fase 5 — Dashboard y presupuesto mensual

Fecha: 2026-09-19

## Suites

| Suite | Resultado |
|---|---|
| Backend `pnpm test` | 54/54 ✅ |
| Backend `pnpm test:e2e` | 122/122 ✅ |
| Backend `pnpm build` | ✅ |
| Frontend `pnpm test` (Vitest) | 17/17 ✅ (`accountTotals`, `debtTotals`) |
| Frontend `pnpm build` | ✅ |
| Frontend `pnpm lint` | 0 errores (3 warnings preexistentes) |

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `PUT /budgets` crea/actualiza; `GET` devuelve el mes | **PASS** | `src/budgets/*`; e2e `test/budgets.e2e-spec.ts` (upsert idempotente, validaciones, delete) |
| 2 | Inicio muestra **Deuda actual** (crédito + por pagar) y **Presupuesto** con progreso | **PASS** (estático) | `HomePage.tsx` (`debtActual`, sección Presupuesto) |
| 3 | Si no hay presupuesto, se define desde Inicio | **PASS** (estático) | `BudgetDrawer.tsx` + botón en Inicio |
| 4 | Suites y builds en verde | **PASS** | tabla de suites |

**Resumen: 4 PASS, 0 FAIL** (criterios 2–3 verificados estáticamente por falta de
navegador).

## Dashboard de Inicio (completo)

- **Dinero total** (efectivo + débito + inversión − crédito) en MXN.
- **Deuda actual** = deuda de tarjetas de crédito + deudas por pagar (MXN);
  muestra también "por cobrar".
- **Inversiones** (MXN).
- **Gastado del mes**.
- **Presupuesto del mes** con gastado, disponible/excedido y barra de progreso.
- **Gastos por categoría** (doughnut) y **movimientos recientes**.

## Follow-ups

- Validación visual real a 375px en navegador (patrón de todas las fases).
- Presupuesto por categoría (solo global por mes en esta fase).
- Notificaciones de sobregasto.
