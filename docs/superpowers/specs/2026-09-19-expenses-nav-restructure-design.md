# Expenses — Reestructura de navegación y extracción de Gym

Fecha: 2026-09-19
Estado: Aprobado por el usuario

## Objetivo

1. **Extraer Gym** (`src/pages/routines/*`) a un **repositorio git independiente**.
2. **Dividir la vista de gastos en páginas** para reducir la saturación de una
   sola pantalla, priorizando en Inicio: **total del dinero, gasto del mes,
   gráfica y gastos recientes**.

## Decisiones

- Gym vive en un repo nuevo: `Documents/projects/react/gym` (Vite + React 19 +
  TS + Tailwind 4 + react-router). Se copian las rutinas **con los cambios sin
  commitear** del working tree.
- Navegación inferior (mobile, 4 tabs): **Inicio · Movimientos · Cuentas · Más**.
- Rutas: `/` Inicio, `/movimientos`, `/cuentas`, `/mas`, `/categorias`,
  `/recurrentes`, `/personas`. `/expenses` redirige a `/` (compatibilidad).
- Sin cambios de backend. Mobile-first y design system actual (rosa `#F8359B`,
  tipografía por sección, 375px).

## Gym (repo nuevo)

- Estructura: se copia el contenido de `src/pages/routines/` a `src/` del nuevo
  repo, preservando imports relativos. `RoutinesPage` pasa a ser la raíz de la
  app.
- Dependencias mínimas: `react`, `react-dom`, `react-router`, `lucide-react`,
  `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `clsx`.
- `src/lib/utils.ts` con `cn` (único símbolo externo requerido).
- `BrowserRouter` con `/` → redirige a `/mauricio` y `/:id` → `RoutinesPage`.
- `index.html` propio; se copian los favicons de `public/`.
- `pnpm build` y `pnpm lint` limpios; commit inicial en git.

## expenses-v2 (reestructura)

- Eliminar `src/pages/routines/*`, las rutas `/workouts*` y el link Gym del nav.
- Nuevo `App.tsx` con las rutas de arriba.
- `mobile-layout.tsx`: nav de 4 tabs con `NavLink` y estado activo, iconos
  (Inicio `Home`, Movimientos `ArrowLeftRight`/`Receipt`, Cuentas `Wallet`,
  Más `Menu`).
- Páginas (reutilizando componentes existentes):
  - **Inicio** (`HomePage`): total del dinero (por moneda: efectivo+débito+
    inversión−crédito) + total gastado del mes + `TopExpenses` + últimos
    movimientos (con "Ver todos" → `/movimientos`).
  - **Movimientos** (`MovementsPage`): `ExpensesHeader` (mes/año) + `ExpensesList`.
  - **Cuentas** (`AccountsPage`): `AccountList` (crédito, pagar tarjeta, MSI).
  - **Más** (`MorePage`): accesos a Categorías, Recurrentes, Personas y tema.
  - **Categorías** (`CategoriesPage`): la existente, con volver a `/mas`.
  - **Recurrentes** (`RecurringPage`): `RecurringList`.
  - **Personas** (`PersonsPage`): `PersonsList`.
- `ExpensesPage.tsx` se elimina (su contenido se reparte).
- Se extrae un helper `netTotalsByCurrency(accounts)` para el total de Inicio y
  reutilizarlo en `AccountList` (evitar duplicar la regla crédito resta).

## Criterios de aceptación

1. `gym` compila y hace lint; su repo tiene commit inicial.
2. `expenses-v2` no referencia `routines`/`/workouts`; nav con 4 tabs navegables.
3. Inicio muestra totales, gráfica y recientes; Movimientos su propia página.
4. `pnpm build` y `pnpm lint` limpios en expenses-v2; rutas antiguas redirigen.
5. Cambios ajenos de `routines` conservados en el repo nuevo (no se pierden).
