# Expenses — Diseño Fase 3: Inversiones y tipo de cambio USD

Fecha: 2026-09-19
Estado: Aprobado para implementación (instrucción del usuario: avanzar con Fase 3)

## Objetivo

Permitir cuentas de inversión en otra divisa (USD) y obtener el tipo de cambio
USD→MXN desde una API pública, para mostrar el patrimonio en MXN y el dinero en
inversiones.

## Contexto

- `Account` ya tiene `type (CASH|DEBIT|CREDIT|INVESTMENT)` y `currency (MXN|USD)`
  (Fase 1); `AccountForm` ya permite crear inversión y elegir moneda.
- Home ya muestra "Dinero total" por moneda y "Gastado del mes".

## Decisiones

- **APIs públicas sin key** con fallback:
  1. `https://open.er-api.com/v6/latest/USD` (primaria).
  2. `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`
     (fallback).
  Ambas verificadas (~17.2 MXN/USD).
- **Caché en Postgres** (`ExchangeRate`, última tasa por par) con TTL
  (por defecto 6 h, configurable con `FX_CACHE_MS`). Si la API falla, se usa la
  última tasa cacheada marcándola como `stale`.
- **Sin dependencias nuevas** (Node 22 `fetch`).
- **Frontend mobile-first**: convierte a MXN usando la tasa; muestra la tasa
  actual y el dinero en inversiones.

## Modelo (Prisma)

```prisma
model ExchangeRate {
  id        String   @id @default(uuid())
  base      String
  quote     String
  rate      Decimal  @db.Decimal(18, 8)
  source    String?
  fetchedAt DateTime @default(now())
  @@unique([base, quote])
}
```

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/fx/rate?base=USD&quote=MXN` | Tasa actual (cacheada/refrescada) |
| POST | `/fx/refresh` | Fuerza refresco (opcional base/quote) |

Respuesta: `{ base, quote, rate, fetchedAt, stale }`.

## Lógica

- `FxService.getRate(base, quote)`:
  - Lee la fila cacheada; si `now - fetchedAt < TTL`, la devuelve (`stale:false`).
  - Si expiró o no existe, intenta la primaria; si falla, el fallback; si ambas
    fallan y hay caché, devuelve la caché `stale:true`; si no hay caché, error.
  - Al obtener una tasa válida, hace `upsert` de la fila.
- Solo se usan pares soportados (USD/MXN); se normaliza a mayúsculas.

## Frontend

- `FxService.getRate(base, quote)` + `useFxRate` (query key `["fx-rate", base, quote]`,
  `staleTime` 1 h).
- **Inicio**:
  - "Dinero total" combinado en MXN (convierte cuentas USD con la tasa).
  - "Inversiones" (suma de cuentas `INVESTMENT` convertida a MXN).
  - Indicador `1 USD = $X MXN` con la fecha de actualización.
- **Cuentas**: para cuentas en USD, mostrar el equivalente en MXN bajo el saldo.
- Si no hay tasa disponible, se muestran los montos por moneda sin convertir
  (degradación grácil) y no se rompe la vista.

## Criterios de aceptación

1. `GET /fx/rate?base=USD&quote=MXN` devuelve una tasa numérica, con caché y
   `stale`.
2. La tasa se refresca tras el TTL; ante fallo de ambas APIs se usa la caché.
3. Inicio muestra el total en MXN (conversión), inversiones y la tasa.
4. Cuentas USD muestran su equivalente en MXN.
5. `pnpm test`, `pnpm test:e2e`, `pnpm build` (backend) y `pnpm build`/`pnpm lint`
   (frontend) en verde.

## No incluye

- Histórico de tipos de cambio / valuación por fecha.
- Posiciones de inversión con cantidad/precio (solo saldo por cuenta).
- Dashboard completo de Fase 5 (deuda, presupuesto).
