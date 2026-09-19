# Expenses V2

Aplicación de gastos compartidos (mobile-first). React 19 + Vite + Tailwind 4 +
shadcn, contra el backend NestJS (`express/expenses-api`).

## Fase 1 — flujo

- `/expenses`: cuentas (tipo, moneda, crédito con deuda/pago/disponible y botón
  **Pagar tarjeta**), personas (Mauricio y Maria, presupuesto semanal acumulable
  con ajustes) y movimientos.
- `/expenses/categories`: categorías dinámicas con alta/edición/archivado.
- Modal de movimiento: tipo ingreso/gasto/**transferencia** (`toAccountId`) y
  alcance **Conjunto / Personal** (`scope` + `personId`).
- El backend calcula los saldos; el frontend sólo consume:
  `/accounts`, `/accounts/:id/credit-summary`, `/categories`, `/persons`,
  `/persons/:id/summary`, `/persons/:id/adjustments`, `/transactions`.
- Design system persistido en `design-system/MASTER.md` (rosa `#F8359B`,
  tipografía por sección, checklist mobile). Resultados de aceptación en
  `docs/superpowers/plans/2026-09-18-expenses-fase1-acceptance.md`.

## Fase 2 — flujo

- **Recurrentes** en `/expenses`: suscripciones, ingresos (p. ej. salario) e
  intereses por tramos; lista con tipo, cuenta, monto, frecuencia, próxima
  ejecución y estado, con alta/edición en bottom-sheet, activar/desactivar y
  botón **Ejecutar ahora**.
- El backend materializa de forma **idempotente** las ocurrencias vencidas
  (`RecurringService.runDue`) vía scheduler (cada 60 min) o `POST /recurring/run`;
  los intereses se calculan por tramos marginales (`{ upTo, annualRate }`).
- **MSI**: en gasto sobre cuenta de crédito el modal ofrece "Meses sin
  intereses" (1 = normal, 2–48) con mensualidad estimada; la deuda total se
  reconoce al momento y el resumen de crédito muestra `periodPayment`,
  `totalDebt`, `available` y `msiCommitted`.
- Endpoints nuevos: `/recurring` (GET/POST/PUT/DELETE) y `POST /recurring/run`;
  `POST /transactions` acepta `installments` (2–48) y
  `/accounts/:id/credit-summary` incluye `msiCommitted`.
- Resultados de aceptación en
  `docs/superpowers/plans/2026-09-18-expenses-fase2-acceptance.md`.

## Environment variables

Copy `.env.example` to `.env` and fill in the values. `VITE_API_BASE_URL` is required — it is the base URL of the backend API (e.g. `https://api.expenses.maurihed.com/api/v1`). Without it, requests are built against `undefined` (e.g. `undefined/transactions`).

- Set `VITE_API_BASE_URL` locally in `.env` and in Vercel's project environment settings for deployments.
- `VITE_GO_BASE_URL` was replaced by `VITE_API_BASE_URL`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
