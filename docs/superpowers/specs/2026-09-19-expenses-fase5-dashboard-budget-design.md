# Expenses — Diseño Fase 5: Dashboard y presupuesto mensual

Fecha: 2026-09-19
Estado: Aprobado para implementación (instrucción del usuario: continuar Fase 5)

## Objetivo

Completar la pantalla **Inicio** como dashboard y añadir **presupuesto mensual**:
dinero total, deuda actual, dinero en inversiones, gráfica de categorías,
últimos movimientos y presupuesto del mes vs. gastado.

## Contexto

Inicio ya muestra: Dinero total (MXN), Inversiones, Deudas, Gastado del mes,
gráfica por categoría y movimientos recientes. Faltan **Deuda actual** (crédito +
deudas por pagar) y **presupuesto mensual**.

## Decisiones

- **Deuda actual** = deuda de cuentas `CREDIT` + deudas por pagar (`Debt` tipo
  `payable`), convertidas a MXN con la tasa (Fase 3).
- **Presupuesto mensual global** por `(año, mes)`: un monto en `Budget`. Si no
  hay presupuesto definido para el mes, Inicio invita a definirlo.
- El **gastado del mes** = suma de movimientos `EXPENSE` del mes (incluye
  personales, que salen de cuentas conjuntas).
- Progreso = `spent / budget`; resta = `budget - spent` (puede ser negativa).
- Moneda del presupuesto: MXN; si hubiera cuentas/gastos en USD, se comparan en
  MXN con la tasa (los movimientos se registran en la moneda de su cuenta; para
  el presupuesto se asume MXN, que es el caso actual).
- Sin dependencias nuevas. Mobile-first; design system actual.

## Modelo (Prisma)

```prisma
model Budget {
  id        String   @id @default(uuid())
  year      Int
  month     Int      // 1-12
  amount    Decimal  @db.Decimal(12, 2)
  currency  Currency @default(MXN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([year, month])
}
```

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/budgets?year=&month=` | Presupuesto del mes (o `null`) |
| GET | `/budgets` | Lista de presupuestos |
| PUT | `/budgets` | Upsert del presupuesto `{ year, month, amount, currency? }` |
| DELETE | `/budgets/:id` | Elimina un presupuesto |

Validaciones: `year` y `month` enteros (month 1–12), `amount >= 0` (0 = sin
límite/sin asignar), rechazar null.

## Frontend (mobile-first)

- **Inicio (dashboard)**:
  - Tarjetas: **Dinero total** (MXN), **Deuda actual** (crédito + por pagar;
    línea "por cobrar"), **Inversiones**, **Gastado del mes**.
  - Sección **Presupuesto del mes**: monto, gastado, restante y barra de
    progreso; botón "Definir/Editar presupuesto" (bottom-sheet). Si no hay
    presupuesto, invita a definirlo.
  - Gráfica de categorías y movimientos recientes (ya existentes).
- `BudgetService` + `useBudget` (query key `["budget", year, month]`).
- Invalida `"budget"` tras guardar.

## Criterios de aceptación

1. `PUT /budgets` crea/actualiza el presupuesto del mes; `GET` lo devuelve.
2. Inicio muestra **Deuda actual** (crédito + por pagar) y **Presupuesto** con
   progreso gastado/restante.
3. Si no hay presupuesto, se puede definir desde Inicio.
4. Suites y builds en verde.

## No incluye

- Presupuesto por categoría (solo global por mes).
- Notificaciones de sobregasto.
