# Aceptación Fase 6 — Posiciones ETF en cuentas de inversión

Fecha: 2026-09-21

## Suites

| Suite | Resultado |
|---|---|
| Backend `pnpm test` | 94/94 ✅ (13 suites) |
| Backend `pnpm test:e2e` | 131/131 ✅ (18 suites) |
| Backend `pnpm build` | ✅ |
| Frontend `pnpm test` (Vitest) | 30/30 ✅ (4 archivos) |
| Frontend `pnpm build` | ✅ (PWA, 10 entradas precacheadas) |
| Frontend `pnpm lint` | 0 errores (2 warnings preexistentes: `ui/button.tsx`, `ui/form.tsx`) |

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `GET /market/quote?symbol=VOO` devuelve precio, moneda, cambio y `stale`, con caché y fallback Yahoo → Nasdaq | **PASS** | `src/market/market.controller.ts` (`@Get('quote')`), `src/market/market.service.ts`; unit `src/market/market.spec.ts`; e2e `test/market.e2e-spec.ts` (fallback Yahoo→Nasdaq, `stale` con caché) |
| 2 | `GET /market/search?q=vanguard` devuelve solo ETFs | **PASS** | `src/market/market.controller.ts` (`@Get('search')`); unit `src/market/market.spec.ts` (filtro ETF); e2e `test/market.e2e-spec.ts` |
| 3 | `POST /accounts/:id/holdings` valida el símbolo y con `deductFromCash` ajusta el efectivo de forma atómica | **PASS** | `src/accounts/holdings.controller.ts` (`@Post()`), `src/accounts/holdings.service.ts`; e2e `test/holdings.e2e-spec.ts` (símbolo inválido 4xx, descuento atómico) |
| 4 | `GET /accounts/:id/holdings` devuelve posiciones valuadas y totales; `null` si alguna no se puede valuar | **PASS** | `src/accounts/holdings.controller.ts` (`@Get()`), `src/accounts/holdings.service.ts`; unit `src/accounts/holdings.service.spec.ts`, `src/domain/portfolio.spec.ts`; e2e `test/holdings.e2e-spec.ts` (totales `null` sin valuación) |
| 5 | `GET /accounts` enriquece las cuentas `INVESTMENT` | **PASS** | `src/accounts/accounts.service.ts`; e2e `test/accounts.e2e-spec.ts` (enriquecido de portafolio) |
| 6 | Fallo de ambos proveedores con caché → `stale`; sin caché → "—" sin romperse | **PASS** | `src/market/market.spec.ts` (stale con caché, sin caché no revienta); UI `AccountList.tsx` (badge `stale` con ícono `Clock`, "—" sin valuación) y `InvestmentPositions/index.tsx` ("—" en total/posición/precio) — verificado estáticamente |
| 7 | Mobile 375px: ver total, abrir detalle, buscar y dar de alta, editar y eliminar | **PASS (estático)** | `AccountList.tsx`, `InvestmentDetailPage.tsx`, `InvestmentPositions/*` (`AddHoldingDrawer`, `EditHoldingDrawer`), targets ≥44px (`h-11`); validación visual real pendiente (ver abajo) |
| 8 | Suites y builds en verde en ambos repos | **PASS** | tabla de suites |

**Resumen: 8 PASS, 0 FAIL** (criterios 6 y 7 verificados estáticamente y por tests de
backend; la validación visual a 375px se deja como prueba manual pendiente, patrón
de todas las fases).

## Resultado de la verificación automática

Backend (`/Users/mauriciojesushernndezdiaz/Documents/projects/express/expenses-api`, HEAD `02f8564`):

```text
pnpm test
  Test Suites: 13 passed, 13 total
  Tests:       94 passed, 94 total
  Time:        3.46 s

pnpm test:e2e
  Test Suites: 18 passed, 18 total
  Tests:       131 passed, 131 total
  Time:        4.768 s

pnpm build
  nest build  →  EXIT 0
```

Frontend (`/Users/mauriciojesushernndezdiaz/Documents/projects/react/expenses-v2`, HEAD `c902f38`):

```text
pnpm test
  Test Files  4 passed (4)
  Tests       30 passed (30)
  Duration    300ms

pnpm build
  ✓ built in 2.32s
  PWA v1.0.0 · precache 10 entries (976.07 KiB)  →  EXIT 0

pnpm lint
  ✖ 2 problems (0 errors, 2 warnings)  →  EXIT 0
  Warnings preexistentes: src/components/ui/button.tsx, src/components/ui/form.tsx
```

## Prueba manual pendiente (375px)

> **NO ejecutada por el agente.** Estos pasos requieren navegador real a 375px y
> quedan pendientes para validación humana (patrón de las fases previas).

1. Crear una cuenta de tipo **Inversión**.
2. Entrar a `/cuentas/:id` y confirmar header con volver, total, desglose y cambio del día.
3. Abrir "Agregar ETF" y buscar `vanguard` en el buscador (con debounce);
   confirmar resultados con ticker + nombre + bolsa.
4. Agregar **VOO** con cantidad `0.5` y marcar **"descontar del efectivo"**
   (verificar la previsualización del monto a descontar).
5. Verificar el valor total y la nueva posición en la lista (badge `VOO`,
   `0.5 × precio`, valor y %).
6. Editar la posición y cambiar la cantidad; confirmar que el valor total se recalcula.
7. Eliminar la posición y confirmar que desaparece de la lista y el total se ajusta.

### Degradación offline

8. Con la red apagada (y sin caché disponible), verificar que el total y la
   valuación muestran **"—"** y que aparece el badge **`stale`** con ícono de reloj,
   sin que la página se rompa.

## Notas

- Targets táctiles ≥44px (`h-11`) en CTAs y controles del bottom-sheet.
- Sin scroll horizontal esperado a 375px; transiciones 150–250 ms
  (`transition-colors duration-200`).
- Diseño documentado en `design-system/pages/cuentas.md` → sección "Inversión (Fase 6)".
