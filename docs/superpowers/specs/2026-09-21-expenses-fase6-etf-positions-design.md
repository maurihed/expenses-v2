# Expenses — Diseño Fase 6: Posiciones de ETF en cuentas de inversión

Fecha: 2026-09-21
Estado: Aprobado para implementación (aprobación por bloques del usuario)

## Objetivo

Permitir dar de alta **ETFs de EE.UU.** dentro de una cuenta de inversión,
guardando **cantidad + símbolo** por posición, y **valuarlas al precio de
mercado actual** consultado desde APIs públicas sin key. El valor de la cuenta
pasa a ser **efectivo + posiciones**, de modo que el patrimonio refleje el
movimiento real del precio y no un saldo fijo con interés.

## Contexto

- `Account` ya tiene `type (CASH|DEBIT|CREDIT|INVESTMENT)` y `currency (MXN|USD)`
  (Fase 1). `Account.balance` es el **efectivo/ledger**: las transacciones lo
  incrementan (`balanceDelta` en `domain/balance.ts`).
- La Fase 3 (inversiones + FX) **excluyó explícitamente** "posiciones de
  inversión con cantidad/precio (solo saldo por cuenta)". Esta fase es ese paso.
- Existe el módulo `fx` como precedente de proveedor externo: APIs públicas sin
  key, caché en Postgres con TTL, `stale` como degradación grácil, fallback
  entre proveedores y `fetch` nativo con timeout. El módulo `market` replica
  este patrón.
- El frontend consume el backend; el navegador nunca llama a proveedores de
  precios (CORS, cuotas y secretos quedan en el servidor).

## Decisiones

1. **Solo ETFs de EE.UU.** Cotizan en USD; ticker simple (ej. `VOO`).
2. **Solo valor actual**: se guarda `símbolo + cantidad`; no hay historial de
   compras ni costo promedio (sin P/L).
3. **Valor de cuenta = efectivo + posiciones**: `cashBalance` (el `balance`
   existente) + suma de posiciones a precio de mercado.
4. **Alta con check opcional "descontar del efectivo (registrar compra)"**:
   reduce el efectivo por `cantidad × precio` en el momento del alta.
5. **Selección con buscador autocompletado** (filtrado a ETFs) y **ticker
   manual** validado como respaldo si la búsqueda falla.
6. **Proveedores sin API key**, con fallback y caché:
   - Cotización: Yahoo Finance `chart/v8` (primario) → Nasdaq `quote/info`
     (fallback) → caché `stale` → `null`.
   - Búsqueda: Yahoo Finance `search/v1` (primario) → Nasdaq `autocomplete`
     (fallback) → `503` (la UI cae a ticker manual).
   - Descartados por no funcionar: Stooq CSV (endpoints caídos) y Yahoo
     `v7/quote` / `quoteSummary` (401 sin "crumb").
7. **Caché en Postgres** (`AssetPrice`, última cotización por símbolo) con TTL
   configurable `MARKET_CACHE_MS` (por defecto 30 min). Si el proveedor falla,
   se sirve la última cotización marcada como `stale`.
8. **Sin dependencias nuevas** (`fetch` nativo de Node 22).
9. **Frontend mobile-first** con el design system actual (Lumina Finance).

## Modelo (Prisma)

```prisma
model Holding {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  symbol    String                       // "VOO"
  name      String?                      // snapshot del nombre al dar de alta
  quantity  Decimal  @db.Decimal(18, 8)  // admite fracciones
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([accountId, symbol])
  @@index([accountId])
}

model AssetPrice {
  id            String    @id @default(uuid())
  symbol        String    @unique
  price         Decimal   @db.Decimal(18, 4)
  previousClose Decimal?  @db.Decimal(18, 4)
  currency      String    @default("USD")
  name          String?
  exchange      String?
  source        String?                  // "yahoo" | "nasdaq"
  fetchedAt     DateTime  @default(now())
}
```

`Account` agrega únicamente la relación `holdings Holding[]`. No cambia ningún
campo existente.

Migración: `pnpm prisma migrate dev --name etf_holdings` + `pnpm prisma generate`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/market/search?q=&limit=10` | Autocompletado, **solo ETFs** → `[{ symbol, name, exchange, currency }]` |
| GET | `/market/quote?symbol=VOO` | Cotización: `{ symbol, price, previousClose, changePercent, currency, name, exchange, source, fetchedAt, stale }` |
| GET | `/accounts/:id/holdings` | Posiciones + valuación + totales de la cuenta |
| POST | `/accounts/:id/holdings` | Alta: `{ symbol, quantity, deductFromCash? }` |
| PUT | `/accounts/:id/holdings/:holdingId` | Editar: `{ quantity?, symbol? }` |
| DELETE | `/accounts/:id/holdings/:holdingId` | Eliminar posición |
| GET | `/accounts` | *Enriquecido*: cuentas `INVESTMENT` incluyen `cashBalance`, `positionsValue`, `totalValue`, `stale` |

### Respuesta de `GET /accounts/:id/holdings`

```json
{
  "currency": "MXN",
  "cashBalance": 5000,
  "positionsValue": 127340.55,
  "totalValue": 132340.55,
  "changePercent": 1.24,
  "stale": false,
  "holdings": [
    {
      "id": "…",
      "symbol": "VOO",
      "name": "Vanguard S&P 500 ETF",
      "quantity": 3.5,
      "price": 712.8,
      "previousClose": 701.78,
      "changePercent": 1.57,
      "currency": "USD",
      "marketValue": 2494.8,
      "marketValueAccountCurrency": 42910.6,
      "fetchedAt": "2026-09-21T20:02:00.000Z",
      "stale": false
    }
  ]
}
```

### Reglas de validación

- `symbol`: normalizado a mayúsculas, `^[A-Z][A-Z0-9.\-]{0,9}$`, y **verificado
  con una cotización real** antes de crear/actualizar. Si no existe → `400`.
- `quantity`: `> 0`, hasta 8 decimales.
- Símbolo duplicado en la misma cuenta → `409 Conflict`.
- Al cambiar `symbol` en `PUT`, se revalida con una cotización y se refresca el
  snapshot de `name`.
- Cuenta que no es `INVESTMENT` → `400`.
- Cuenta inexistente → `404`.

## Lógica

### `MarketService` (nuevo módulo `market`)

- `getQuote(symbol)`:
  1. Lee `AssetPrice`; si `now − fetchedAt < MARKET_CACHE_MS`, devuelve fresco
     (`stale: false`).
  2. Si expiró o no existe: Yahoo `chart/v8` (host `query1`, fallback `query2`);
     si falla, Nasdaq `quote/info?assetclass=etf`.
  3. Si ambos fallan y hay caché, devuelve `stale: true`.
  4. Si ambos fallan y no hay caché, devuelve `price: null, stale: true`.
  5. Con cotización válida, `upsert` en `AssetPrice`.
- `getQuotes(symbols)`: resuelve en paralelo (`Promise.all`), timeout de 8 s por
  request (igual que `FxService`).
- `search(query, limit)`: Yahoo `search/v1` filtrando `quoteType === "ETF"`; si
  falla, Nasdaq `autocomplete`. Caché en memoria ~5 min por query. Sin caché en BD.
- Cabecera `User-Agent` obligatoria en las llamadas a Yahoo.
- `MarketModule` importa `PrismaModule` y **exporta** `MarketService`.

### Valuación (en `AccountsService`, al leer)

Por posición:
- `marketValue` (moneda del instrumento) = `quantity × price`.
- Conversión a la moneda de la cuenta:
  - cuenta **USD** → `marketValue`.
  - cuenta **MXN** → `marketValue × usdRate` (de `FxService`; `null` si no hay tasa).
- `changePercent` = `(price − previousClose) / previousClose × 100`.

Por cuenta:
- `cashBalance` = `account.balance`.
- `positionsValue` = Σ `marketValue` convertido. **`null` si alguna posición no
  se puede valuar** (sin precio o sin tasa), consistente con `sumInvestments`.
- `totalValue` = `cashBalance + positionsValue`, o `null` si `positionsValue` es `null`.
- `changePercent` de la cuenta = `(valorActual − valorPrevio) / valorPrevio × 100`,
  donde `valorActual` = `positionsValue` y `valorPrevio` = Σ
  `quantity × previousClose` convertido. Es `null` si `valorPrevio` es `0`, `null`
  o no calculable.
- `stale` = `true` si alguna posición usada es `stale`.

`AccountsModule` importa `MarketModule` y `FxModule`; `AccountsService` recibe
`MarketService` y `FxService` por inyección. `FxModule` ya exporta `FxService`.

### Deducción de efectivo (alta con `deductFromCash: true`)

- `costo = quantity × price` convertido a la moneda de la cuenta.
- Se reduce `balance` y se recalcula `openingBalance` con
  `computeOpeningBalance` (mismo helper que usa la edición de cuenta), para no
  alterar el efecto neto de las transacciones.
- Creación del `Holding` + ajuste de saldo en **una transacción Prisma atómica**.
- Si el efectivo queda negativo se **permite** (una cuenta puede estar en
  negativo); la UI lo advierte en la previsualización.
- **Editar o eliminar una posición no reajusta el efectivo** (solo el alta lo hace).

### Degradación grácil

| Situación | Respuesta | UI |
|---|---|---|
| Proveedor caído, hay caché | `stale: true` | Badge "precio al \<fecha\>" |
| Sin precio ni caché | `price: null`, totales `null` | "—" + botón reintentar |
| Búsqueda caída | `503` | Input de ticker manual |
| Símbolo inválido en alta | `400` | Mensaje inline en el sheet |

`GET /accounts` resuelve precios con `getQuotes` (fetch-on-stale), igual que
Inicio hace con la tasa FX. Con caché fresca es instantáneo; la primera carga
puede tardar y se mitiga resolviendo los símbolos en paralelo.

## Frontend

### Tipos y servicios

- `src/types/expenses.ts`: `Holding`, `PortfolioSummary`, `MarketQuote`,
  `MarketSearchResult`. `Account` gana campos opcionales `cashBalance?`,
  `positionsValue?`, `totalValue?`, `stale?` (no afectan a otros tipos).
- `src/services/MarketService.ts`: `search`, `getQuote`.
- `src/services/AccountService.ts`: `getHoldings`, `createHolding`,
  `updateHolding`, `deleteHolding`.
- `src/pages/expenses/hooks/useHoldings.ts` (query `["holdings", accountId]` +
  mutaciones que invalidan `accounts` y `holdings`).
- `src/lib/portfolio.ts`: funciones puras (`marketValue`, `toAccountCurrency`,
  `positionsValue`, `dayChange`) — testeables.

### UI mobile-first

**Tarjeta de cuenta de inversión (`/cuentas`)**
- Valor grande = `totalValue` en la moneda de la cuenta.
- Sub-línea `Efectivo $X · Posiciones $Y`.
- Chip de cambio del día (▲/▼ + %) en `text-positive`/`text-negative` (no solo color).
- Badge `stale` con ícono de reloj: "precio al 20 sep, 16:02".
- Botones: **Posiciones** (abre el detalle), editar (lápiz), agregar transacción
  (más); targets ≥44px. Los demás tipos de cuenta quedan igual.

**Detalle `/cuentas/:id`** (ruta nueva)
- Header: volver, nombre, valor total, cambio del día, desglose efectivo/posiciones.
- Sección "Posiciones": filas con badge del ticker, nombre truncado,
  `3.5 × $712.80`, valor en moneda de la cuenta y cambio del día. Tocar abre el
  sheet de edición.
- CTA "Agregar ETF" fijo.
- Empty state, skeletons de carga y botón reintentar en error.

**Alta de ETF (bottom-sheet, 2 pasos)**
1. Buscar: input con autofoco y debounce 300 ms → lista (ticker, nombre, bolsa);
   estados spinner / sin resultados / error (ofrece ticker manual).
2. Cantidad: cabecera con ticker + nombre + precio; input decimal; checkbox
   "Descontar del efectivo (registrar compra)" con previsualización
   "Se descontarán ≈ $X"; confirmar. Validaciones inline.

**Ticker manual:** input → valida contra `/market/quote` → muestra nombre/precio
o error.

**Editar posición (bottom-sheet):** ticker + nombre + precio, input de cantidad,
"Eliminar posición" (destructivo con confirmación) y aviso "Editar no ajusta el
efectivo".

**Inicio:** "Inversiones" pasa a usar `totalValue` convertido a MXN; se mantiene
el indicador de tipo de cambio.

### Design system

Se respeta `design-system/MASTER.md` (indigo, `rounded-2xl`, `tabular-nums`,
`text-positive`/`text-negative`, Lucide, targets ≥44px, sin scroll horizontal a
375px, transiciones 150–250 ms) y se actualiza `design-system/pages/cuentas.md`.

## Criterios de aceptación

1. `GET /market/quote?symbol=VOO` devuelve precio, moneda, cambio y `stale`, con
   caché y fallback Yahoo → Nasdaq.
2. `GET /market/search?q=vanguard` devuelve solo ETFs con símbolo, nombre y bolsa.
3. `POST /accounts/:id/holdings` crea una posición validando el símbolo; con
   `deductFromCash: true` reduce el efectivo de forma atómica.
4. `GET /accounts/:id/holdings` devuelve posiciones valuadas y
   `cashBalance`/`positionsValue`/`totalValue`; totales `null` si alguna posición
   no se puede valuar.
5. `GET /accounts` enriquece las cuentas `INVESTMENT` con los totales.
6. Ante fallo de ambos proveedores con caché se sirve `stale`; sin caché, la app
   muestra "—" sin romperse.
7. En mobile (375px) se puede: ver el valor total de una cuenta de inversión,
   abrir `/cuentas/:id`, buscar y dar de alta un ETF, editar cantidad y eliminarlo.
8. `pnpm test`, `pnpm test:e2e`, `pnpm build` (backend) y `pnpm build`,
   `pnpm lint`, `pnpm test` (frontend) en verde.

## No incluye

- Historial de compras/ventas, costo promedio y P/L.
- Gráficas de rendimiento o histórico de precios.
- Cripto, BMV/`.MX` u otros instrumentos.
- Sincronización automática con el broker.
- Órdenes de compra/venta y notificaciones de precio.
- Reajuste automático del efectivo al editar o eliminar posiciones.
