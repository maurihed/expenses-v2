# Expenses Fase 3 — Inversiones y tipo de cambio USD Implementation Plan

> **For agentic workers:** ejecución inline o subagent-driven. Spec:
> `docs/superpowers/specs/2026-09-19-expenses-fase3-investments-fx-design.md`.

**Goal:** tasa USD→MXN desde una API pública con caché, y mostrar patrimonio e
inversiones en MXN.

**Tech Stack:** NestJS 10 + Prisma 5 + Postgres 16; React 19 + React Query v3.

## Global Constraints

- Sin dependencias nuevas. Dinero/tasa como número en JSON; `Decimal` en DB.
- Mobile-first; design system actual.
- APIs sin key con fallback: `open.er-api.com` → `fawazahmed0`.
- Si la API falla, usar caché `stale` (no romper la app).

---

### Task 1: Modelo `ExchangeRate` + migración

- [ ] Añadir el modelo del spec a `prisma/schema.prisma`.
- [ ] `pnpm prisma migrate dev --name exchange_rate` y `pnpm prisma generate`.
- [ ] `pnpm build` y `pnpm test` en verde.
- [ ] Commit `feat: add exchange rate model`.

### Task 2: Módulo `fx`

- [ ] `src/fx/fx.types.ts` con los parsers de cada proveedor.
- [ ] `src/fx/fx.service.ts`: `getRate(base, quote)` con TTL y fallback; `refresh()`.
- [ ] `src/fx/fx.controller.ts`: `GET /fx/rate`, `POST /fx/refresh`.
- [ ] `src/fx/fx.module.ts` + registrar en `AppModule`.
- [ ] Unit tests (parsers + servicio con `fetch` mockeado: primaria, fallback,
      fallo con caché `stale`, fallo sin caché).
- [ ] e2e: sembrar una tasa fresca y `GET /fx/rate` la devuelve (sin red).
- [ ] `pnpm test`, `pnpm test:e2e`, `pnpm build`. Commit `feat: fx module`.

### Task 3: Frontend — servicio y hook de tasa

- [ ] `src/services/FxService.ts` (`getRate`, `parseJsonResponse`).
- [ ] `src/pages/expenses/hooks/useFxRate.ts` (query key `["fx-rate", base, quote]`).
- [ ] `pnpm build` + `pnpm lint`. Commit `feat: fx service and hook`.

### Task 4: Frontend — Inicio y Cuentas con conversión

- [ ] `src/lib/accountTotals.ts`: helper `convertTotalsToMxn(totals, rate)` y
      `sumInvestments(accounts, rate)`.
- [ ] Home: "Dinero total" combinado en MXN + "Inversiones" + indicador de tasa
      (fecha). Degradación grácil si no hay tasa.
- [ ] `AccountList`: equivalente en MXN para cuentas USD.
- [ ] `pnpm build` + `pnpm lint`. Commit `feat: MXN conversion, investments and
      rate on home/accounts`.

### Task 5: Aceptación Fase 3

- [ ] Suites backend + frontend.
- [ ] `docs/superpowers/plans/2026-09-19-expenses-fase3-acceptance.md`.
- [ ] Commit `docs: phase 3 acceptance`.
