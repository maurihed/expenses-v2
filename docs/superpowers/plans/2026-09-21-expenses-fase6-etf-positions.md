# Expenses Fase 6 — Posiciones de ETF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir dar de alta ETFs de EE.UU. (símbolo + cantidad) en cuentas de inversión y valuarlos al precio de mercado, de modo que el valor de la cuenta sea efectivo + posiciones.

**Architecture:** Se replica el patrón del módulo `fx` ya existente. Un módulo `market` es la única salida a internet (Yahoo → Nasdaq → caché `stale` en Postgres). El módulo `accounts` gana `Holding` (posición) y un `HoldingsService` que valúa con `MarketService` + `FxService`; `GET /accounts` se enriquece con los totales. El frontend solo consume `/accounts` y `/market`.

**Tech Stack:** NestJS 10 + Prisma 5 + Postgres 16 (backend); React 19 + React Query v3 + Tailwind 4 (frontend).

**Spec:** `docs/superpowers/specs/2026-09-21-expenses-fase6-etf-positions-design.md`

## Global Constraints

- Sin dependencias nuevas. `fetch` nativo con timeout de 8000 ms.
- Dinero/precio/cantidad como número en JSON; `Decimal` en DB.
- Proveedores sin API key. Cotización: Yahoo `chart/v8` (`query1`, fallback `query2`) → Nasdaq `quote/info` → caché `stale` → `price: null`. Búsqueda: Yahoo `search/v1` → Nasdaq `autocomplete` → `503`.
- Cabecera `User-Agent` obligatoria en llamadas a Yahoo.
- `MARKET_CACHE_MS` por defecto `1800000` (30 min).
- Solo ETFs (`quoteType === "ETF"` / `asset === "ETF"`). Solo USD.
- `symbol` normalizado a mayúsculas; regex `^[A-Z][A-Z0-9.\-]{0,9}$`.
- `quantity > 0`, hasta 8 decimales.
- Mobile-first: 375px sin scroll horizontal, targets ≥44px, cifras `tabular-nums`, transiciones 150–250 ms (ver `design-system/MASTER.md`).
- Dos repos: backend `/Users/mauriciojesushernndezdiaz/Documents/projects/express/expenses-api`, frontend `/Users/mauriciojesushernndezdiaz/Documents/projects/react/expenses-v2`. Todos los comandos indican su directorio.

### Refinamiento respecto al spec

El spec menciona un `lib/portfolio.ts` en el frontend. Como **el backend ya devuelve `marketValueAccountCurrency`, `changePercent` y los totales**, no se duplica esa matemática en el cliente: la agregación de patrimonio se resuelve modificando `src/lib/accountTotals.ts` (ya existente y testeado) y el formato en los componentes. Única desviación; el resto del spec se implementa tal cual.

## Review Focus

Clases de entrada / modos de falla que el spec implica y que conviene fijar con pruebas:

1. Símbolo con precio pero **sin `previousClose`** → `changePercent` `null`; nada debe romper.
2. Cuenta **MXN sin tasa FX** → `positionsValue`/`totalValue` `null` (no 500, no `NaN`).
3. **Cantidad fraccionaria** (0.5) y redondeo a 8 decimales, sin perder precisión.
4. `deductFromCash` **mayor que el efectivo** → el efectivo puede quedar negativo; se permite y se ve.
5. **Payload malformado** del proveedor (sin `meta`, precio `0`/negativo) → no guardar basura; caer a `stale` o `null`.
6. **Símbolo inexistente** en el alta → `400` y no crear la posición.
7. **Símbolo duplicado** en la misma cuenta → `409`.

Cada punto tiene su prueba en la tarea que posee el código (Tasks 2, 3, 5, 6, 7).

---

## File Structure

**Backend** (`express/expenses-api`)

- `prisma/schema.prisma` — modelos `Holding`, `AssetPrice` + relación en `Account`.
- `src/market/market.types.ts` — tipos + parsers de proveedores (puro).
- `src/market/market.types.spec.ts` — pruebas de parsers.
- `src/market/market.service.ts` — caché + proveedores + búsqueda.
- `src/market/market.spec.ts` — pruebas del servicio.
- `src/market/market.controller.ts` — `GET /market/search`, `GET /market/quote`.
- `src/market/market.module.ts` — módulo, exporta `MarketService`.
- `src/domain/portfolio.ts` — valuación pura.
- `src/domain/portfolio.spec.ts` — pruebas de valuación.
- `src/accounts/dto/create-holding.dto.ts` — DTO de alta.
- `src/accounts/dto/update-holding.dto.ts` — DTO de edición.
- `src/accounts/holdings.service.ts` — CRUD + valuación + resumen.
- `src/accounts/holdings.service.spec.ts` — pruebas del servicio.
- `src/accounts/holdings.controller.ts` — rutas `/accounts/:accountId/holdings`.
- `src/accounts/accounts.service.ts` — enriquecer `findAll`.
- `src/accounts/accounts.module.ts` — wiring.
- `src/app.module.ts` — registrar `MarketModule`.
- `test/market.e2e-spec.ts` — e2e de market.
- `test/holdings.e2e-spec.ts` — e2e de posiciones + `/accounts`.

**Frontend** (`expenses-v2`)

- `src/types/expenses.ts` — `Holding`, `PortfolioSummary`, `MarketQuote`, `MarketSearchResult`, campos en `Account`.
- `src/services/MarketService.ts` — `search`, `getQuote`.
- `src/services/AccountService.ts` — CRUD de posiciones.
- `src/hooks/useDebouncedValue.ts` — debounce.
- `src/pages/expenses/hooks/useMarketSearch.ts` — búsqueda.
- `src/pages/expenses/hooks/useHoldings.ts` — resumen + mutaciones.
- `src/lib/accountTotals.ts` — `accountValue` + uso en totales.
- `src/lib/accountTotals.test.ts` — pruebas.
- `src/pages/expenses/components/AccountList.tsx` — tarjeta de inversión + navegación.
- `src/pages/expenses/InvestmentDetailPage.tsx` — detalle.
- `src/pages/expenses/components/InvestmentPositions/index.tsx` — lista + header.
- `src/pages/expenses/components/InvestmentPositions/AddHoldingDrawer.tsx` — alta.
- `src/pages/expenses/components/InvestmentPositions/EditHoldingDrawer.tsx` — edición/borrado.
- `src/App.tsx` — ruta `/cuentas/:id`.
- `design-system/pages/cuentas.md` — doc de diseño.
- `docs/superpowers/plans/2026-09-21-expenses-fase6-acceptance.md` — aceptación.

---

## Task 1: Modelos Prisma `Holding` y `AssetPrice`

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `test/prisma.e2e-spec.ts` (existente, debe seguir verde)

**Interfaces:**
- Produces: tablas `Holding` (con `@@unique([accountId, symbol])`) y `AssetPrice` (con `symbol @unique`); `Account.holdings`.

- [ ] **Step 1: Agregar los modelos a `prisma/schema.prisma`**

Dentro del `model Account` agrega la relación:

```prisma
  holdings            Holding[]
```

Al final del archivo agrega:

```prisma
model Holding {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  symbol    String
  name      String?
  quantity  Decimal  @db.Decimal(18, 8)
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
  source        String?
  fetchedAt     DateTime  @default(now())
}
```

- [ ] **Step 2: Crear la migración y regenerar el cliente**

Run: `pnpm prisma migrate dev --name etf_holdings && pnpm prisma generate`
Expected: migración aplicada, cliente regenerado sin errores.

- [ ] **Step 3: Compilar y correr tests**

Run: `pnpm build && pnpm test`
Expected: PASS (sin regresiones).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add holding and asset price models"
```

---

## Task 2: Parsers de proveedores (`market.types.ts`)

**Files:**
- Create: `src/market/market.types.ts`
- Test: `src/market/market.types.spec.ts`

**Interfaces:**
- Produces:
  - `interface ParsedQuote { price: number; previousClose: number | null; currency: string; name: string | null; exchange: string | null; source: string }`
  - `interface MarketSearchResult { symbol: string; name: string; exchange: string | null; currency: string | null }`
  - `parseYahooChart(payload: unknown, symbol: string): ParsedQuote | null`
  - `parseYahooSearch(payload: unknown): MarketSearchResult[]`
  - `parseNasdaqInfo(payload: unknown, symbol: string): ParsedQuote | null`
  - `parseNasdaqSearch(payload: unknown): MarketSearchResult[]`

- [ ] **Step 1: Escribir las pruebas que fallan**

Create `src/market/market.types.spec.ts`:

```ts
import {
  parseNasdaqInfo,
  parseNasdaqSearch,
  parseYahooChart,
  parseYahooSearch,
} from './market.types';

describe('parseYahooChart', () => {
  const payload = {
    chart: {
      result: [
        {
          meta: {
            currency: 'USD',
            symbol: 'VOO',
            fullExchangeName: 'NYSEArca',
            longName: 'Vanguard S&P 500 ETF',
            regularMarketPrice: 712.8,
            chartPreviousClose: 701.78,
          },
        },
      ],
    },
  };

  it('extrae precio, cierre previo, nombre y bolsa', () => {
    expect(parseYahooChart(payload, 'VOO')).toEqual({
      price: 712.8,
      previousClose: 701.78,
      currency: 'USD',
      name: 'Vanguard S&P 500 ETF',
      exchange: 'NYSEArca',
      source: 'yahoo',
    });
  });

  it('acepta precio sin cierre previo (changePercent quedará null)', () => {
    const noPrev = { chart: { result: [{ meta: { regularMarketPrice: 10, currency: 'USD' } }] } };
    expect(parseYahooChart(noPrev, 'X')).toMatchObject({ price: 10, previousClose: null });
  });

  it('devuelve null si falta meta o el precio no es positivo', () => {
    expect(parseYahooChart({}, 'X')).toBeNull();
    expect(parseYahooChart({ chart: { result: [{ meta: { regularMarketPrice: 0 } }] } }, 'X')).toBeNull();
    expect(parseYahooChart(null, 'X')).toBeNull();
  });
});

describe('parseYahooSearch', () => {
  it('filtra solo ETFs y mapea nombre/bolsa', () => {
    const payload = {
      quotes: [
        { symbol: 'VOO', quoteType: 'ETF', longname: 'Vanguard S&P 500 ETF', exchDisp: 'NYSEArca' },
        { symbol: 'AAPL', quoteType: 'EQUITY', longname: 'Apple Inc.' },
      ],
    };
    expect(parseYahooSearch(payload)).toEqual([
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', currency: null },
    ]);
  });

  it('devuelve [] con payload inválido', () => {
    expect(parseYahooSearch(null)).toEqual([]);
    expect(parseYahooSearch({})).toEqual([]);
  });
});

describe('parseNasdaqInfo', () => {
  it('parsea precio con símbolo de moneda y calcula el cierre previo', () => {
    const payload = {
      data: {
        symbol: 'VOO',
        companyName: 'Vanguard S&P 500 ETF',
        exchange: 'PSE',
        primaryData: { lastSalePrice: '$712.62', netChange: '-0.19' },
      },
    };
    expect(parseNasdaqInfo(payload, 'VOO')).toEqual({
      price: 712.62,
      previousClose: 712.81,
      currency: 'USD',
      name: 'Vanguard S&P 500 ETF',
      exchange: 'PSE',
      source: 'nasdaq',
    });
  });

  it('devuelve null si no hay precio válido', () => {
    expect(parseNasdaqInfo({ data: { primaryData: {} } }, 'X')).toBeNull();
    expect(parseNasdaqInfo(null, 'X')).toBeNull();
  });
});

describe('parseNasdaqSearch', () => {
  it('filtra solo ETFs', () => {
    const payload = {
      data: [
        { symbol: 'BIV', name: 'Vanguard Intermediate-Term Bond ETF', asset: 'ETF', exchange: 'PSE' },
        { symbol: 'ZZ', name: 'Not an ETF', asset: 'Stock' },
      ],
    };
    expect(parseNasdaqSearch(payload)).toEqual([
      { symbol: 'BIV', name: 'Vanguard Intermediate-Term Bond ETF', exchange: 'PSE', currency: null },
    ]);
  });

  it('devuelve [] con payload inválido', () => {
    expect(parseNasdaqSearch(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `pnpm jest src/market/market.types.spec.ts`
Expected: FAIL — `Cannot find module './market.types'`.

- [ ] **Step 3: Implementar `src/market/market.types.ts`**

```ts
export interface ParsedQuote {
  price: number;
  previousClose: number | null;
  currency: string;
  name: string | null;
  exchange: string | null;
  source: string;
}

export interface MarketSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string | null;
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(cleaned) ? cleaned : null;
};

const pickString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
};

export function parseYahooChart(payload: unknown, _symbol: string): ParsedQuote | null {
  const meta = (payload as { chart?: { result?: { meta?: unknown }[] } } | null)?.chart?.result?.[0]
    ?.meta as Record<string, unknown> | undefined;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  if (!isPositiveNumber(price)) return null;
  const previous = meta.chartPreviousClose;
  return {
    price,
    previousClose: isPositiveNumber(previous) ? previous : null,
    currency: pickString(meta.currency) ?? 'USD',
    name: pickString(meta.longName, meta.shortName),
    exchange: pickString(meta.fullExchangeName, meta.exchangeName),
    source: 'yahoo',
  };
}

export function parseYahooSearch(payload: unknown): MarketSearchResult[] {
  const quotes = (payload as { quotes?: unknown[] } | null)?.quotes;
  if (!Array.isArray(quotes)) return [];
  return quotes
    .filter(
      (q): q is Record<string, unknown> =>
        typeof q === 'object' && q !== null && (q as Record<string, unknown>).quoteType === 'ETF',
    )
    .map((q) => {
      const symbol = pickString(q.symbol);
      return symbol == null
        ? null
        : {
            symbol,
            name: pickString(q.longname, q.shortname) ?? symbol,
            exchange: pickString(q.exchDisp),
            currency: null,
          };
    })
    .filter((item): item is MarketSearchResult => item !== null);
}

export function parseNasdaqInfo(payload: unknown, _symbol: string): ParsedQuote | null {
  const data = (payload as { data?: Record<string, unknown> } | null)?.data;
  if (!data) return null;
  const primary = data.primaryData as Record<string, unknown> | undefined;
  const price = parseNumber(primary?.lastSalePrice);
  if (!isPositiveNumber(price)) return null;
  const netChange = parseNumber(primary?.netChange);
  const previousClose =
    netChange == null ? null : Number((price - netChange).toFixed(4)) || null;
  return {
    price,
    previousClose: previousClose != null && previousClose > 0 ? previousClose : null,
    currency: 'USD',
    name: pickString(data.companyName),
    exchange: pickString(data.exchange),
    source: 'nasdaq',
  };
}

export function parseNasdaqSearch(payload: unknown): MarketSearchResult[] {
  const rows = (payload as { data?: unknown[] } | null)?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(
      (r): r is Record<string, unknown> =>
        typeof r === 'object' && r !== null && (r as Record<string, unknown>).asset === 'ETF',
    )
    .map((r) => {
      const symbol = pickString(r.symbol);
      return symbol == null
        ? null
        : {
            symbol,
            name: pickString(r.name) ?? symbol,
            exchange: pickString(r.exchange),
            currency: null,
          };
    })
    .filter((item): item is MarketSearchResult => item !== null);
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `pnpm jest src/market/market.types.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/market/market.types.ts src/market/market.types.spec.ts
git commit -m "feat: market provider parsers"
```

---

## Task 3: `MarketService` (caché + proveedores)

**Files:**
- Create: `src/market/market.service.ts`
- Test: `src/market/market.spec.ts`

**Interfaces:**
- Consumes: parsers de Task 2; `PrismaService` (`prisma.assetPrice`).
- Produces:
  - `interface MarketQuote { symbol: string; price: number | null; previousClose: number | null; changePercent: number | null; currency: string; name: string | null; exchange: string | null; source: string | null; fetchedAt: string | null; stale: boolean }`
  - `MarketService.getQuote(symbol: string): Promise<MarketQuote>`
  - `MarketService.getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>>`
  - `MarketService.search(query: string, limit?: number): Promise<MarketSearchResult[]>`

- [ ] **Step 1: Escribir las pruebas que fallan**

Create `src/market/market.spec.ts`:

```ts
import { MarketService } from './market.service';

const okJson = (payload: unknown) => ({ ok: true, json: async () => payload });

const buildPrisma = (cached: unknown = null) => ({
  assetPrice: {
    findUnique: jest.fn().mockResolvedValue(cached),
    upsert: jest.fn().mockImplementation(async ({ create }) => ({
      ...create,
      price: create.price,
      previousClose: create.previousClose ?? null,
      fetchedAt: new Date(),
    })),
  },
});

const yahooPayload = {
  chart: {
    result: [
      {
        meta: {
          currency: 'USD',
          longName: 'Vanguard S&P 500 ETF',
          fullExchangeName: 'NYSEArca',
          regularMarketPrice: 712.8,
          chartPreviousClose: 701.78,
        },
      },
    ],
  },
};

const freshRow = {
  symbol: 'VOO',
  price: 700,
  previousClose: 690,
  currency: 'USD',
  name: 'Vanguard S&P 500 ETF',
  exchange: 'NYSEArca',
  source: 'yahoo',
  fetchedAt: new Date(),
};
const oldRow = { ...freshRow, price: 650, fetchedAt: new Date(Date.now() - 10 * 60 * 60 * 1000) };

describe('MarketService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('devuelve la caché fresca sin llamar a la red', async () => {
    const prisma = buildPrisma(freshRow);
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const quote = await service.getQuote('voo');

    expect(quote).toMatchObject({ symbol: 'VOO', price: 700, stale: false });
    expect(quote.changePercent).toBeCloseTo(((700 - 690) / 690) * 100, 6);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refresca con Yahoo y hace upsert', async () => {
    const prisma = buildPrisma(null);
    global.fetch = jest.fn().mockResolvedValue(okJson(yahooPayload)) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const quote = await service.getQuote('VOO');

    expect(quote.price).toBe(712.8);
    expect(quote.stale).toBe(false);
    expect(prisma.assetPrice.upsert).toHaveBeenCalledTimes(1);
  });

  it('usa Nasdaq si Yahoo devuelve un payload inutilizable', async () => {
    const prisma = buildPrisma(null);
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('yahoo')) return Promise.resolve(okJson({ chart: { result: [] } }));
      return Promise.resolve(
        okJson({ data: { companyName: 'Vanguard S&P 500 ETF', exchange: 'PSE', primaryData: { lastSalePrice: '$711.00', netChange: '1.00' } } }),
      );
    }) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const quote = await service.getQuote('VOO');

    expect(quote.price).toBe(711);
    expect(prisma.assetPrice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ source: 'nasdaq' }) }),
    );
  });

  it('sirve la caché stale si ambos proveedores fallan', async () => {
    const prisma = buildPrisma(oldRow);
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const quote = await service.getQuote('VOO');

    expect(quote.price).toBe(650);
    expect(quote.stale).toBe(true);
  });

  it('devuelve price null si ambos fallan y no hay caché', async () => {
    const prisma = buildPrisma(null);
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const quote = await service.getQuote('VOO');

    expect(quote).toMatchObject({ price: null, stale: true, fetchedAt: null });
  });

  it('search filtra a ETFs y usa Nasdaq si Yahoo falla', async () => {
    const prisma = buildPrisma(null);
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('yahoo down'))
      .mockResolvedValueOnce(
        okJson({ data: [{ symbol: 'BIV', name: 'Bond ETF', asset: 'ETF', exchange: 'PSE' }] }),
      ) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    const results = await service.search('bond');

    expect(results).toEqual([
      { symbol: 'BIV', name: 'Bond ETF', exchange: 'PSE', currency: null },
    ]);
  });

  it('search lanza si ambos proveedores fallan', async () => {
    const prisma = buildPrisma(null);
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    const service = new MarketService(prisma as never);
    await expect(service.search('vanguard')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `pnpm jest src/market/market.spec.ts`
Expected: FAIL — `Cannot find module './market.service'`.

- [ ] **Step 3: Implementar `src/market/market.service.ts`**

```ts
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarketSearchResult,
  ParsedQuote,
  parseNasdaqInfo,
  parseNasdaqSearch,
  parseYahooChart,
  parseYahooSearch,
} from './market.types';

const DEFAULT_CACHE_MS = 30 * 60 * 1000;
const SEARCH_CACHE_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

export interface MarketQuote {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  name: string | null;
  exchange: string | null;
  source: string | null;
  fetchedAt: string | null;
  stale: boolean;
}

interface PriceRow {
  symbol: string;
  price: unknown;
  previousClose: unknown;
  currency: string;
  name: string | null;
  exchange: string | null;
  source: string | null;
  fetchedAt: Date;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly cacheMs = (() => {
    const parsed = Number(process.env.MARKET_CACHE_MS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CACHE_MS;
  })();
  private readonly searchCache = new Map<string, { at: number; results: MarketSearchResult[] }>();

  constructor(private prisma: PrismaService) {}

  async getQuote(symbol: string): Promise<MarketQuote> {
    const normalized = symbol.trim().toUpperCase();
    const cached = await this.prisma.assetPrice.findUnique({ where: { symbol: normalized } });

    if (cached && Date.now() - cached.fetchedAt.getTime() < this.cacheMs) {
      return this.toQuote(normalized, cached as PriceRow, false);
    }

    const fetched = await this.fetchQuote(normalized);
    if (!fetched) {
      if (cached) {
        this.logger.warn(`Market providers unavailable for ${normalized}; serving stale cache`);
        return this.toQuote(normalized, cached as PriceRow, true);
      }
      return {
        symbol: normalized,
        price: null,
        previousClose: null,
        changePercent: null,
        currency: 'USD',
        name: null,
        exchange: null,
        source: null,
        fetchedAt: null,
        stale: true,
      };
    }

    const saved = await this.prisma.assetPrice.upsert({
      where: { symbol: normalized },
      update: {
        price: fetched.price,
        previousClose: fetched.previousClose,
        currency: fetched.currency,
        name: fetched.name,
        exchange: fetched.exchange,
        source: fetched.source,
        fetchedAt: new Date(),
      },
      create: {
        symbol: normalized,
        price: fetched.price,
        previousClose: fetched.previousClose,
        currency: fetched.currency,
        name: fetched.name,
        exchange: fetched.exchange,
        source: fetched.source,
      },
    });
    return this.toQuote(normalized, saved as PriceRow, false);
  }

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()))];
    const quotes = await Promise.all(unique.map((symbol) => this.getQuote(symbol)));
    return new Map(quotes.map((quote) => [quote.symbol, quote]));
  }

  async search(query: string, limit = 10): Promise<MarketSearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const key = `${q.toLowerCase()}:${limit}`;
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.at < SEARCH_CACHE_MS) return cached.results;

    const [yahoo, nasdaq] = await Promise.all([
      this.searchYahoo(q, limit),
      this.searchNasdaq(q, limit),
    ]);
    if (yahoo == null && nasdaq == null) {
      throw new ServiceUnavailableException('Market search is unavailable');
    }
    const results = yahoo && yahoo.length > 0 ? yahoo : nasdaq ?? [];
    this.searchCache.set(key, { at: Date.now(), results });
    return results;
  }

  private toQuote(symbol: string, row: PriceRow, stale: boolean): MarketQuote {
    const price = row.price == null ? null : Number(row.price);
    const previousClose = row.previousClose == null ? null : Number(row.previousClose);
    const changePercent =
      price != null && previousClose != null && previousClose > 0
        ? ((price - previousClose) / previousClose) * 100
        : null;
    return {
      symbol,
      price,
      previousClose,
      changePercent,
      currency: row.currency ?? 'USD',
      name: row.name ?? null,
      exchange: row.exchange ?? null,
      source: row.source ?? null,
      fetchedAt: row.fetchedAt.toISOString(),
      stale,
    };
  }

  private async fetchQuote(symbol: string): Promise<ParsedQuote | null> {
    const [yahoo, nasdaq] = await Promise.all([
      this.fetchYahoo(symbol),
      this.fetchNasdaq(symbol),
    ]);
    return yahoo ?? nasdaq;
  }

  private async fetchYahoo(symbol: string): Promise<ParsedQuote | null> {
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
      try {
        const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const payload = await this.fetchJson(url, { 'User-Agent': USER_AGENT });
        const parsed = parseYahooChart(payload, symbol);
        if (parsed) return parsed;
      } catch (error) {
        this.logger.warn(`Yahoo (${host}) failed for ${symbol}: ${(error as Error).message}`);
      }
    }
    return null;
  }

  private async fetchNasdaq(symbol: string): Promise<ParsedQuote | null> {
    try {
      const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/info?assetclass=etf`;
      const payload = await this.fetchJson(url, {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      });
      return parseNasdaqInfo(payload, symbol);
    } catch (error) {
      this.logger.warn(`Nasdaq failed for ${symbol}: ${(error as Error).message}`);
      return null;
    }
  }

  private async searchYahoo(q: string, limit: number): Promise<MarketSearchResult[] | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${limit}&newsCount=0`;
      const payload = await this.fetchJson(url, { 'User-Agent': USER_AGENT });
      return parseYahooSearch(payload).slice(0, limit);
    } catch (error) {
      this.logger.warn(`Yahoo search failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async searchNasdaq(q: string, limit: number): Promise<MarketSearchResult[] | null> {
    try {
      const url = `https://api.nasdaq.com/api/autocomplete/slookup/${limit}?search=${encodeURIComponent(q)}`;
      const payload = await this.fetchJson(url, {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      });
      return parseNasdaqSearch(payload).slice(0, limit);
    } catch (error) {
      this.logger.warn(`Nasdaq search failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `pnpm jest src/market/market.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/market/market.service.ts src/market/market.spec.ts
git commit -m "feat: market service with cache and providers"
```

---

## Task 4: Módulo y controlador `market`

**Files:**
- Create: `src/market/market.controller.ts`, `src/market/market.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/market.e2e-spec.ts`

**Interfaces:**
- Consumes: `MarketService` (Task 3).
- Produces: `GET /api/v1/market/search?q=&limit=`, `GET /api/v1/market/quote?symbol=`; `MarketModule` que exporta `MarketService`.

- [ ] **Step 1: Escribir el e2e que falla**

Create `test/market.e2e-spec.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Market (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.assetPrice.upsert({
      where: { symbol: 'VOO' },
      update: { price: 700, previousClose: 690, currency: 'USD', name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'e2e', fetchedAt: new Date() },
      create: { symbol: 'VOO', price: 700, previousClose: 690, currency: 'USD', name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'e2e' },
    });
  });

  afterAll(async () => {
    await prisma.assetPrice.deleteMany({ where: { symbol: 'VOO', source: 'e2e' } });
    await app.close();
  });

  it('GET /market/quote devuelve la cotización cacheada', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/market/quote?symbol=VOO')
      .expect(200);
    expect(res.body).toMatchObject({ symbol: 'VOO', price: 700, currency: 'USD', stale: false });
    expect(res.body.changePercent).toBeCloseTo(((700 - 690) / 690) * 100, 4);
  });

  it('rechaza un símbolo inválido con 400', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/market/quote?symbol=1BAD')
      .expect(400);
  });
});
```

- [ ] **Step 2: Correr el e2e para verificar que falla**

Run: `pnpm test:e2e -- market`
Expected: FAIL — ruta `/market/quote` no existe (404).

- [ ] **Step 3: Implementar el controlador y el módulo**

Create `src/market/market.controller.ts`:

```ts
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.\-]{0,9}$/;

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('search')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const parsed = Number(limit);
    const take = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 25) : 10;
    return this.market.search(q ?? '', take);
  }

  @Get('quote')
  quote(@Query('symbol') symbol?: string) {
    const normalized = (symbol ?? '').trim().toUpperCase();
    if (!SYMBOL_PATTERN.test(normalized)) {
      throw new BadRequestException('Invalid symbol');
    }
    return this.market.getQuote(normalized);
  }
}
```

Create `src/market/market.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
```

Modify `src/app.module.ts`: agrega el import de `MarketModule` y añádelo al array `imports` (después de `FxModule`).

- [ ] **Step 4: Correr el e2e para verificar que pasa**

Run: `pnpm test:e2e -- market`
Expected: PASS.

- [ ] **Step 5: Compilar y commitear**

```bash
pnpm build
git add src/market/market.controller.ts src/market/market.module.ts src/app.module.ts test/market.e2e-spec.ts
git commit -m "feat: market module and endpoints"
```

---

## Task 5: Valuación pura (`domain/portfolio.ts`)

**Files:**
- Create: `src/domain/portfolio.ts`
- Test: `src/domain/portfolio.spec.ts`

**Interfaces:**
- Produces:
  - `type Currency = 'MXN' | 'USD'`
  - `interface PositionInput { quantity: number; price: number | null; previousClose: number | null; priceCurrency: string; accountCurrency: Currency; usdRate: number | null }`
  - `interface PositionValue { marketValue: number | null; marketValueAccountCurrency: number | null; changePercent: number | null }`
  - `convertToAccountCurrency(amount: number, from: string, accountCurrency: Currency, usdRate: number | null): number | null`
  - `valuePosition(input: PositionInput): PositionValue`
  - `sumPositionValues(values: (number | null)[]): number | null`
  - `previousPositionsValue(positions: { quantity: number; previousClose: number | null; priceCurrency: string }[], accountCurrency: Currency, usdRate: number | null): number | null`
  - `dayChangePercent(current: number | null, previous: number | null): number | null`

- [ ] **Step 1: Escribir las pruebas que fallan**

Create `src/domain/portfolio.spec.ts`:

```ts
import {
  convertToAccountCurrency,
  dayChangePercent,
  previousPositionsValue,
  sumPositionValues,
  valuePosition,
} from './portfolio';

describe('convertToAccountCurrency', () => {
  it('misma moneda es identidad', () => {
    expect(convertToAccountCurrency(100, 'USD', 'USD', null)).toBe(100);
    expect(convertToAccountCurrency(100, 'MXN', 'MXN', null)).toBe(100);
  });

  it('USD→MXN usa la tasa; sin tasa devuelve null', () => {
    expect(convertToAccountCurrency(10, 'USD', 'MXN', 17.5)).toBeCloseTo(175, 6);
    expect(convertToAccountCurrency(10, 'USD', 'MXN', null)).toBeNull();
  });

  it('moneda no soportada devuelve null', () => {
    expect(convertToAccountCurrency(10, 'EUR', 'MXN', 17)).toBeNull();
  });
});

describe('valuePosition', () => {
  it('valúa en cuenta MXN con tasa', () => {
    expect(
      valuePosition({
        quantity: 2,
        price: 700,
        previousClose: 690,
        priceCurrency: 'USD',
        accountCurrency: 'MXN',
        usdRate: 17,
      }),
    ).toEqual({
      marketValue: 1400,
      marketValueAccountCurrency: 23800,
      changePercent: expect.closeTo(((700 - 690) / 690) * 100, 6),
    });
  });

  it('sin precio no valúa', () => {
    expect(
      valuePosition({
        quantity: 2,
        price: null,
        previousClose: null,
        priceCurrency: 'USD',
        accountCurrency: 'USD',
        usdRate: null,
      }),
    ).toEqual({ marketValue: null, marketValueAccountCurrency: null, changePercent: null });
  });

  it('precio sin cierre previo deja changePercent null', () => {
    expect(
      valuePosition({
        quantity: 1,
        price: 100,
        previousClose: null,
        priceCurrency: 'USD',
        accountCurrency: 'USD',
        usdRate: null,
      }).changePercent,
    ).toBeNull();
  });
});

describe('sumPositionValues', () => {
  it('suma valores completos', () => {
    expect(sumPositionValues([100, 200.5])).toBeCloseTo(300.5, 6);
  });

  it('devuelve null si algún valor es null', () => {
    expect(sumPositionValues([100, null])).toBeNull();
  });

  it('lista vacía es 0', () => {
    expect(sumPositionValues([])).toBe(0);
  });
});

describe('previousPositionsValue', () => {
  it('convierte el valor previo y suma', () => {
    expect(
      previousPositionsValue(
        [{ quantity: 2, previousClose: 690, priceCurrency: 'USD' }],
        'MXN',
        17,
      ),
    ).toBeCloseTo(2 * 690 * 17, 6);
  });

  it('devuelve null si falta el cierre previo', () => {
    expect(
      previousPositionsValue(
        [{ quantity: 2, previousClose: null, priceCurrency: 'USD' }],
        'USD',
        null,
      ),
    ).toBeNull();
  });
});

describe('dayChangePercent', () => {
  it('calcula el porcentaje', () => {
    expect(dayChangePercent(110, 100)).toBeCloseTo(10, 6);
  });

  it('null si falta un valor o el previo es 0', () => {
    expect(dayChangePercent(null, 100)).toBeNull();
    expect(dayChangePercent(110, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `pnpm jest src/domain/portfolio.spec.ts`
Expected: FAIL — `Cannot find module './portfolio'`.

- [ ] **Step 3: Implementar `src/domain/portfolio.ts`**

```ts
export type Currency = 'MXN' | 'USD';

export interface PositionInput {
  quantity: number;
  price: number | null;
  previousClose: number | null;
  priceCurrency: string;
  accountCurrency: Currency;
  usdRate: number | null;
}

export interface PositionValue {
  marketValue: number | null;
  marketValueAccountCurrency: number | null;
  changePercent: number | null;
}

export const convertToAccountCurrency = (
  amount: number,
  from: string,
  accountCurrency: Currency,
  usdRate: number | null,
): number | null => {
  if (from === accountCurrency) return amount;
  if (from === 'USD' && accountCurrency === 'MXN') {
    return usdRate == null ? null : amount * usdRate;
  }
  if (from === 'MXN' && accountCurrency === 'USD') {
    return usdRate == null ? null : amount / usdRate;
  }
  return null;
};

export const valuePosition = (input: PositionInput): PositionValue => {
  const { quantity, price, previousClose, priceCurrency, accountCurrency, usdRate } = input;
  const marketValue = price == null ? null : quantity * price;
  const marketValueAccountCurrency =
    marketValue == null
      ? null
      : convertToAccountCurrency(marketValue, priceCurrency, accountCurrency, usdRate);
  const changePercent =
    price != null && previousClose != null && previousClose > 0
      ? ((price - previousClose) / previousClose) * 100
      : null;
  return { marketValue, marketValueAccountCurrency, changePercent };
};

export const sumPositionValues = (values: (number | null)[]): number | null => {
  if (values.some((value) => value == null)) return null;
  return values.reduce<number>((sum, value) => sum + (value as number), 0);
};

export const previousPositionsValue = (
  positions: { quantity: number; previousClose: number | null; priceCurrency: string }[],
  accountCurrency: Currency,
  usdRate: number | null,
): number | null => {
  let sum = 0;
  for (const position of positions) {
    if (position.previousClose == null) return null;
    const converted = convertToAccountCurrency(
      position.quantity * position.previousClose,
      position.priceCurrency,
      accountCurrency,
      usdRate,
    );
    if (converted == null) return null;
    sum += converted;
  }
  return sum;
};

export const dayChangePercent = (
  current: number | null,
  previous: number | null,
): number | null => {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `pnpm jest src/domain/portfolio.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/portfolio.ts src/domain/portfolio.spec.ts
git commit -m "feat: portfolio valuation domain"
```

---

## Task 6: `HoldingsService` + DTOs + rutas

**Files:**
- Create: `src/accounts/dto/create-holding.dto.ts`, `src/accounts/dto/update-holding.dto.ts`, `src/accounts/holdings.service.ts`, `src/accounts/holdings.controller.ts`
- Modify: `src/accounts/accounts.module.ts`
- Test: `src/accounts/holdings.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`; `MarketService` (Task 3); `FxService` (`getRate`); `domain/portfolio` (Task 5); `computeOpeningBalance` (`domain/balance`).
- Produces:
  - `interface PortfolioSummary { currency: Currency; cashBalance: number; positionsValue: number | null; totalValue: number | null; changePercent: number | null; stale: boolean; holdings: HoldingView[] }`
  - `interface HoldingView { id: string; symbol: string; name: string | null; quantity: number; price: number | null; previousClose: number | null; changePercent: number | null; currency: string; marketValue: number | null; marketValueAccountCurrency: number | null; fetchedAt: string | null; stale: boolean }`
  - `HoldingsService.listForAccount(accountId: string): Promise<PortfolioSummary>`
  - `HoldingsService.summariesForAccounts(accounts: { id: string; type: string; currency: string; balance: unknown; openingBalance: unknown }[]): Promise<Map<string, PortfolioSummary>>`
  - `HoldingsService.create(accountId: string, dto: CreateHoldingDto): Promise<HoldingView>`
  - `HoldingsService.update(accountId: string, holdingId: string, dto: UpdateHoldingDto): Promise<HoldingView>`
  - `HoldingsService.remove(accountId: string, holdingId: string): Promise<void>`

- [ ] **Step 1: Escribir las pruebas que fallan**

Create `src/accounts/holdings.service.spec.ts`:

```ts
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { HoldingsService } from './holdings.service';

const account = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'acc1',
  name: 'Inversión',
  type: 'INVESTMENT',
  currency: 'MXN',
  balance: 10000,
  openingBalance: 10000,
  ...over,
});

const buildPrisma = (over: Record<string, unknown> = {}) => {
  const db = {
    account: {
      findUnique: jest.fn().mockResolvedValue(account()),
      update: jest.fn().mockResolvedValue(account()),
    },
    holding: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'h1', ...data })),
      update: jest.fn().mockImplementation(async ({ data }) => ({ id: 'h1', symbol: 'VOO', quantity: 1, ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  return {
    ...db,
    $transaction: jest.fn().mockImplementation(async (fn: (client: unknown) => unknown) => fn(db)),
    ...over,
  };
};

const market = (price: number | null = 700, previousClose: number | null = 690) => ({
  getQuote: jest.fn().mockResolvedValue({
    symbol: 'VOO', price, previousClose, changePercent: null, currency: 'USD',
    name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'yahoo',
    fetchedAt: price == null ? null : new Date().toISOString(), stale: price == null,
  }),
  getQuotes: jest.fn().mockResolvedValue(
    new Map([
      ['VOO', {
        symbol: 'VOO', price, previousClose, changePercent: null, currency: 'USD',
        name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'yahoo',
        fetchedAt: price == null ? null : new Date().toISOString(), stale: price == null,
      }],
    ]),
  ),
});

const fx = (rate: number | null = 17) => ({
  getRate: rate == null ? jest.fn().mockRejectedValue(new Error('no fx')) : jest.fn().mockResolvedValue({ rate }),
});

describe('HoldingsService.create', () => {
  it('crea la posición y descuenta el efectivo (puede quedar negativo)', async () => {
    const prisma = buildPrisma();
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    const result = await service.create('acc1', { symbol: 'voo', quantity: 1, deductFromCash: true });

    expect(result).toMatchObject({ symbol: 'VOO', quantity: 1 });
    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: 10000 - 1 * 700 * 17 }),
      }),
    );
  });

  it('rechaza símbolo inexistente con 400 y no crea', async () => {
    const prisma = buildPrisma();
    const service = new HoldingsService(prisma as never, market(null) as never, fx() as never);

    await expect(service.create('acc1', { symbol: 'ZZZZ', quantity: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.holding.create).not.toHaveBeenCalled();
  });

  it('rechaza símbolo duplicado con 409', async () => {
    const prisma = buildPrisma();
    (prisma.holding.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    await expect(
      service.create('acc1', { symbol: 'VOO', quantity: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza cuentas que no son de inversión con 400', async () => {
    const prisma = buildPrisma();
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(account({ type: 'CASH' }));
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    await expect(service.create('acc1', { symbol: 'VOO', quantity: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('HoldingsService.listForAccount', () => {
  it('valúa posiciones y suma el efectivo', async () => {
    const prisma = buildPrisma();
    (prisma.holding.findMany as jest.Mock).mockResolvedValue([
      { id: 'h1', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', quantity: 2 },
    ]);
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    const summary = await service.listForAccount('acc1');

    expect(summary.cashBalance).toBe(10000);
    expect(summary.positionsValue).toBeCloseTo(2 * 700 * 17, 6);
    expect(summary.totalValue).toBeCloseTo(10000 + 2 * 700 * 17, 6);
    expect(summary.holdings).toHaveLength(1);
    expect(summary.holdings[0].marketValueAccountCurrency).toBeCloseTo(2 * 700 * 17, 6);
  });

  it('deja los totales en null si no hay tasa FX (cuenta MXN)', async () => {
    const prisma = buildPrisma();
    (prisma.holding.findMany as jest.Mock).mockResolvedValue([
      { id: 'h1', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', quantity: 2 },
    ]);
    const service = new HoldingsService(prisma as never, market() as never, fx(null) as never);

    const summary = await service.listForAccount('acc1');

    expect(summary.positionsValue).toBeNull();
    expect(summary.totalValue).toBeNull();
  });

  it('lanza 404 si la cuenta no existe', async () => {
    const prisma = buildPrisma();
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    await expect(service.listForAccount('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('HoldingsService.update / remove', () => {
  it('update cambia la cantidad y no toca el efectivo', async () => {
    const prisma = buildPrisma();
    (prisma.holding.findFirst as jest.Mock).mockResolvedValue({ id: 'h1', accountId: 'acc1', symbol: 'VOO', quantity: 1 });
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    await service.update('acc1', 'h1', { quantity: 3 });

    expect(prisma.holding.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'h1' }, data: { quantity: 3 } }),
    );
    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  it('remove borra la posición', async () => {
    const prisma = buildPrisma();
    (prisma.holding.findFirst as jest.Mock).mockResolvedValue({ id: 'h1', accountId: 'acc1', symbol: 'VOO', quantity: 1 });
    const service = new HoldingsService(prisma as never, market() as never, fx() as never);

    await service.remove('acc1', 'h1');

    expect(prisma.holding.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
  });
});
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `pnpm jest src/accounts/holdings.service.spec.ts`
Expected: FAIL — `Cannot find module './holdings.service'`.

- [ ] **Step 3: Implementar los DTOs**

Create `src/accounts/dto/create-holding.dto.ts`:

```ts
import { IsBoolean, IsNumber, IsPositive, IsString, Matches, ValidateIf } from 'class-validator';

const SYMBOL_PATTERN = /^[A-Za-z][A-Za-z0-9.\-]{0,9}$/;

export class CreateHoldingDto {
  @IsString()
  @Matches(SYMBOL_PATTERN, { message: 'Símbolo inválido' })
  symbol!: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  quantity!: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  deductFromCash?: boolean;
}
```

Create `src/accounts/dto/update-holding.dto.ts`:

```ts
import { IsNumber, IsPositive, IsString, Matches, ValidateIf } from 'class-validator';

const SYMBOL_PATTERN = /^[A-Za-z][A-Za-z0-9.\-]{0,9}$/;

export class UpdateHoldingDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(SYMBOL_PATTERN, { message: 'Símbolo inválido' })
  symbol?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  quantity?: number;
}
```

- [ ] **Step 4: Implementar `src/accounts/holdings.service.ts`**

```ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { computeOpeningBalance } from '../domain/balance';
import {
  Currency,
  convertToAccountCurrency,
  dayChangePercent,
  previousPositionsValue,
  sumPositionValues,
  valuePosition,
} from '../domain/portfolio';
import { FxService } from '../fx/fx.service';
import { MarketService } from '../market/market.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';

export interface HoldingView {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  marketValue: number | null;
  marketValueAccountCurrency: number | null;
  fetchedAt: string | null;
  stale: boolean;
}

export interface PortfolioSummary {
  currency: Currency;
  cashBalance: number;
  positionsValue: number | null;
  totalValue: number | null;
  changePercent: number | null;
  stale: boolean;
  holdings: HoldingView[];
}

interface AccountRow {
  id: string;
  type: string;
  currency: string;
  balance: unknown;
  openingBalance: unknown;
}

@Injectable()
export class HoldingsService {
  constructor(
    private prisma: PrismaService,
    private market: MarketService,
    private fx: FxService,
  ) {}

  async listForAccount(accountId: string): Promise<PortfolioSummary> {
    const account = await this.requireInvestmentAccount(accountId);
    return this.buildSummary(account as AccountRow);
  }

  async summariesForAccounts(accounts: AccountRow[]): Promise<Map<string, PortfolioSummary>> {
    const investments = accounts.filter((account) => account.type === 'INVESTMENT');
    const entries = await Promise.all(
      investments.map(async (account) => [account.id, await this.buildSummary(account)] as const),
    );
    return new Map(entries);
  }

  async create(accountId: string, dto: CreateHoldingDto): Promise<HoldingView> {
    const account = (await this.requireInvestmentAccount(accountId)) as AccountRow;
    const symbol = dto.symbol.trim().toUpperCase();
    const quote = await this.market.getQuote(symbol);
    if (quote.price == null) {
      throw new BadRequestException(`Unknown symbol ${symbol}`);
    }

    const existing = await this.prisma.holding.findUnique({
      where: { accountId_symbol: { accountId, symbol } },
    });
    if (existing) {
      throw new ConflictException(`Symbol ${symbol} already exists in this account`);
    }

    const accountCurrency = account.currency as Currency;
    const usdRate = accountCurrency === 'MXN' ? await this.usdRate() : null;
    const cost =
      dto.deductFromCash === true
        ? convertToAccountCurrency(dto.quantity * (quote.price ?? 0), quote.currency, accountCurrency, usdRate)
        : null;
    if (dto.deductFromCash === true && cost == null) {
      throw new BadRequestException('Cannot convert the purchase cost to the account currency');
    }

    const currentBalance = Number(account.balance);
    const holding = await this.prisma.$transaction(async (db) => {
      const created = await db.holding.create({
        data: { accountId, symbol, name: quote.name, quantity: dto.quantity },
      });
      if (cost != null) {
        const netEffect = Number(account.balance) - Number(account.openingBalance);
        const nextBalance = currentBalance - cost;
        await db.account.update({
          where: { id: accountId },
          data: {
            balance: nextBalance,
            openingBalance: computeOpeningBalance(nextBalance, netEffect),
          },
        });
      }
      return created;
    });

    return this.toHoldingView(holding, quote, accountCurrency, usdRate);
  }

  async update(accountId: string, holdingId: string, dto: UpdateHoldingDto): Promise<HoldingView> {
    const account = (await this.requireInvestmentAccount(accountId)) as AccountRow;
    const accountCurrency = account.currency as Currency;
    const usdRate = accountCurrency === 'MXN' ? await this.usdRate() : null;
    const holding = await this.prisma.holding.findFirst({ where: { id: holdingId, accountId } });
    if (!holding) throw new NotFoundException(`Holding ${holdingId} not found`);

    const data: { quantity?: number; symbol?: string; name?: string | null } = {};
    let quote = null as Awaited<ReturnType<MarketService['getQuote']>> | null;

    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.symbol !== undefined) {
      const symbol = dto.symbol.trim().toUpperCase();
      quote = await this.market.getQuote(symbol);
      if (quote.price == null) throw new BadRequestException(`Unknown symbol ${symbol}`);
      const duplicate = await this.prisma.holding.findUnique({
        where: { accountId_symbol: { accountId, symbol } },
      });
      if (duplicate && duplicate.id !== holdingId) {
        throw new ConflictException(`Symbol ${symbol} already exists in this account`);
      }
      data.symbol = symbol;
      data.name = quote.name;
    }

    const updated = await this.prisma.holding.update({ where: { id: holdingId }, data });
    if (quote == null) {
      quote = await this.market.getQuote(updated.symbol);
    }
    return this.toHoldingView(updated, quote, accountCurrency, usdRate);
  }

  async remove(accountId: string, holdingId: string): Promise<void> {
    await this.requireInvestmentAccount(accountId);
    const holding = await this.prisma.holding.findFirst({ where: { id: holdingId, accountId } });
    if (!holding) throw new NotFoundException(`Holding ${holdingId} not found`);
    await this.prisma.holding.delete({ where: { id: holdingId } });
  }

  private async requireInvestmentAccount(accountId: string): Promise<AccountRow> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);
    if (account.type !== 'INVESTMENT') {
      throw new BadRequestException(`Account ${accountId} is not an investment account`);
    }
    return account as AccountRow;
  }

  private async usdRate(): Promise<number | null> {
    try {
      const rate = await this.fx.getRate('USD', 'MXN');
      return rate.rate;
    } catch {
      return null;
    }
  }

  private async buildSummary(account: AccountRow): Promise<PortfolioSummary> {
    const accountCurrency = account.currency as Currency;
    const rows = await this.prisma.holding.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'asc' },
    });
    const usdRate = accountCurrency === 'MXN' ? await this.usdRate() : null;
    const quotes = rows.length
      ? await this.market.getQuotes(rows.map((row) => row.symbol))
      : new Map();

    const holdings: HoldingView[] = rows.map((row) => {
      const quote = quotes.get(row.symbol);
      return this.toHoldingView(row, quote, accountCurrency, usdRate);
    });

    const positionsValue = sumPositionValues(
      holdings.map((holding) => holding.marketValueAccountCurrency),
    );
    const previous = previousPositionsValue(
      rows.map((row) => {
        const quote = quotes.get(row.symbol);
        return {
          quantity: Number(row.quantity),
          previousClose: quote?.previousClose ?? null,
          priceCurrency: quote?.currency ?? 'USD',
        };
      }),
      accountCurrency,
      usdRate,
    );
    const cashBalance = Number(account.balance);

    return {
      currency: accountCurrency,
      cashBalance,
      positionsValue,
      totalValue: positionsValue == null ? null : cashBalance + positionsValue,
      changePercent: dayChangePercent(positionsValue, previous),
      stale: holdings.some((holding) => holding.stale),
      holdings,
    };
  }

  private toHoldingView(
    holding: { id: string; symbol: string; name: string | null; quantity: unknown },
    quote:
      | {
          price: number | null;
          previousClose: number | null;
          changePercent: number | null;
          currency: string;
          name: string | null;
          fetchedAt: string | null;
          stale: boolean;
        }
      | undefined,
    accountCurrency: Currency,
    usdRate: number | null,
  ): HoldingView {
    const quantity = Number(holding.quantity);
    const price = quote?.price ?? null;
    const priceCurrency = quote?.currency ?? 'USD';
    const valued = valuePosition({
      quantity,
      price,
      previousClose: quote?.previousClose ?? null,
      priceCurrency,
      accountCurrency,
      usdRate,
    });
    return {
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name ?? quote?.name ?? null,
      quantity,
      price,
      previousClose: quote?.previousClose ?? null,
      changePercent: valued.changePercent,
      currency: priceCurrency,
      marketValue: valued.marketValue,
      marketValueAccountCurrency: valued.marketValueAccountCurrency,
      fetchedAt: quote?.fetchedAt ?? null,
      stale: quote?.stale ?? true,
    };
  }
}
```


- [ ] **Step 5: Implementar `src/accounts/holdings.controller.ts`**

```ts
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { HoldingsService } from './holdings.service';

@Controller('accounts/:accountId/holdings')
export class HoldingsController {
  constructor(private readonly holdings: HoldingsService) {}

  @Get()
  list(@Param('accountId') accountId: string) {
    return this.holdings.listForAccount(accountId);
  }

  @Post()
  create(@Param('accountId') accountId: string, @Body() dto: CreateHoldingDto) {
    return this.holdings.create(accountId, dto);
  }

  @Put(':holdingId')
  update(
    @Param('accountId') accountId: string,
    @Param('holdingId') holdingId: string,
    @Body() dto: UpdateHoldingDto,
  ) {
    return this.holdings.update(accountId, holdingId, dto);
  }

  @Delete(':holdingId')
  remove(@Param('accountId') accountId: string, @Param('holdingId') holdingId: string) {
    return this.holdings.remove(accountId, holdingId);
  }
}
```

- [ ] **Step 6: Wiring del módulo**

Modify `src/accounts/accounts.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { FxModule } from '../fx/fx.module';
import { MarketModule } from '../market/market.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { HoldingsController } from './holdings.controller';
import { HoldingsService } from './holdings.service';

@Module({
  imports: [MarketModule, FxModule],
  controllers: [AccountsController, HoldingsController],
  providers: [AccountsService, HoldingsService],
})
export class AccountsModule {}
```

- [ ] **Step 7: Correr las pruebas y compilar**

Run: `pnpm jest src/accounts/holdings.service.spec.ts && pnpm build`
Expected: PASS y build sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/accounts/dto/create-holding.dto.ts src/accounts/dto/update-holding.dto.ts src/accounts/holdings.service.ts src/accounts/holdings.service.spec.ts src/accounts/holdings.controller.ts src/accounts/accounts.module.ts
git commit -m "feat: holdings CRUD and valuation"
```

---

## Task 7: Enriquecer `GET /accounts` + e2e de posiciones

**Files:**
- Modify: `src/accounts/accounts.service.ts`
- Test: `test/holdings.e2e-spec.ts`

**Interfaces:**
- Consumes: `HoldingsService.summariesForAccounts` (Task 6).
- Produces: `GET /api/v1/accounts` devuelve, para cuentas `INVESTMENT`, `cashBalance`, `positionsValue`, `totalValue`, `stale`.

- [ ] **Step 1: Escribir el e2e que falla**

Create `test/holdings.e2e-spec.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Holdings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accountId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.assetPrice.upsert({
      where: { symbol: 'VOO' },
      update: { price: 700, previousClose: 690, currency: 'USD', name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'e2e', fetchedAt: new Date() },
      create: { symbol: 'VOO', price: 700, previousClose: 690, currency: 'USD', name: 'Vanguard S&P 500 ETF', exchange: 'NYSEArca', source: 'e2e' },
    });
    await prisma.exchangeRate.upsert({
      where: { base_quote: { base: 'USD', quote: 'MXN' } },
      update: { rate: 17, source: 'e2e', fetchedAt: new Date() },
      create: { base: 'USD', quote: 'MXN', rate: 17, source: 'e2e' },
    });

    const account = await prisma.account.create({
      data: { name: 'Inversión E2E', type: 'INVESTMENT', currency: 'MXN', openingBalance: 10000, balance: 10000 },
    });
    accountId = account.id;
  });

  afterAll(async () => {
    await prisma.holding.deleteMany({ where: { accountId } });
    await prisma.account.delete({ where: { id: accountId } });
    await prisma.assetPrice.deleteMany({ where: { symbol: 'VOO', source: 'e2e' } });
    await prisma.exchangeRate.deleteMany({ where: { base: 'USD', quote: 'MXN', source: 'e2e' } });
    await app.close();
  });

  it('crea una posición, descuenta el efectivo y devuelve los totales', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/accounts/${accountId}/holdings`)
      .send({ symbol: 'VOO', quantity: 0.5, deductFromCash: true })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${accountId}/holdings`)
      .expect(200);

    expect(res.body.cashBalance).toBeCloseTo(10000 - 0.5 * 700 * 17, 2);
    expect(res.body.positionsValue).toBeCloseTo(0.5 * 700 * 17, 2);
    expect(res.body.totalValue).toBeCloseTo(10000, 2);
    expect(res.body.holdings).toHaveLength(1);
    expect(res.body.holdings[0]).toMatchObject({ symbol: 'VOO', quantity: 0.5, stale: false });
  });

  it('rechaza un símbolo duplicado con 409', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/accounts/${accountId}/holdings`)
      .send({ symbol: 'VOO', quantity: 1 })
      .expect(409);
  });

  it('rechaza una cantidad no positiva con 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/accounts/${accountId}/holdings`)
      .send({ symbol: 'VOO', quantity: 0 })
      .expect(400);
  });

  it('rechaza una cuenta que no es de inversión con 400', async () => {
    const cash = await prisma.account.create({
      data: { name: 'Efectivo E2E holdings', type: 'CASH', balance: 0 },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/accounts/${cash.id}/holdings`)
      .send({ symbol: 'VOO', quantity: 1 })
      .expect(400);
    await prisma.account.delete({ where: { id: cash.id } });
  });

  it('actualiza la cantidad sin reajustar el efectivo y elimina la posición', async () => {
    const list = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${accountId}/holdings`)
      .expect(200);
    const holdingId = list.body.holdings[0].id;
    const cashBefore = list.body.cashBalance;

    await request(app.getHttpServer())
      .put(`/api/v1/accounts/${accountId}/holdings/${holdingId}`)
      .send({ quantity: 1 })
      .expect(200);

    const after = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${accountId}/holdings`)
      .expect(200);
    expect(after.body.cashBalance).toBeCloseTo(cashBefore, 2);
    expect(after.body.positionsValue).toBeCloseTo(1 * 700 * 17, 2);

    await request(app.getHttpServer())
      .delete(`/api/v1/accounts/${accountId}/holdings/${holdingId}`)
      .expect(200);
    const empty = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${accountId}/holdings`)
      .expect(200);
    expect(empty.body.holdings).toHaveLength(0);
    expect(empty.body.positionsValue).toBe(0);
  });

  it('GET /accounts enriquece las cuentas de inversión', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/accounts/${accountId}/holdings`)
      .send({ symbol: 'VOO', quantity: 2 })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/api/v1/accounts').expect(200);
    const investment = res.body.find((a: { id: string }) => a.id === accountId);
    expect(investment).toMatchObject({ type: 'INVESTMENT', currency: 'MXN' });
    expect(investment.cashBalance).toBeCloseTo(10000 - 0.5 * 700 * 17, 2);
    expect(investment.positionsValue).toBeCloseTo(2 * 700 * 17, 2);
    expect(investment.totalValue).toBeCloseTo(10000 - 0.5 * 700 * 17 + 2 * 700 * 17, 2);
  });
});
```

- [ ] **Step 2: Correr el e2e para verificar que falla**

Run: `pnpm test:e2e -- holdings`
Expected: FAIL — el e2e de `/accounts` no encuentra `cashBalance` (el resto puede pasar).

- [ ] **Step 3: Enriquecer `AccountsService`**

Modify `src/accounts/accounts.service.ts`:

1. Inyecta `HoldingsService` en el constructor:

```ts
import { HoldingsService, PortfolioSummary } from './holdings.service';

constructor(
  private prisma: PrismaService,
  private holdings: HoldingsService,
) {}
```

2. Cambia `toJson` para aceptar el resumen:

```ts
  private toJson(a: any, summary?: PortfolioSummary) {
    const base = {
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: Number(a.balance),
      creditLimit: a.creditLimit == null ? null : Number(a.creditLimit),
      statementClosingDay: a.statementClosingDay ?? null,
      paymentDueDay: a.paymentDueDay ?? null,
      archived: a.archived,
    };
    if (!summary) return base;
    return {
      ...base,
      cashBalance: summary.cashBalance,
      positionsValue: summary.positionsValue,
      totalValue: summary.totalValue,
      changePercent: summary.changePercent,
      stale: summary.stale,
    };
  }
```

3. En `findAll`, calcula los resúmenes y pásalos a `toJson`:

```ts
  async findAll(includeArchived = false) {
    const rows = await this.prisma.account.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'asc' },
    });
    const summaries = await this.holdings.summariesForAccounts(rows);
    return rows.map((a) => this.toJson(a, summaries.get(a.id)));
  }
```

- [ ] **Step 4: Correr el e2e para verificar que pasa**

Run: `pnpm test:e2e -- holdings`
Expected: PASS.

- [ ] **Step 5: Suite completa backend**

Run: `pnpm test && pnpm test:e2e && pnpm build`
Expected: todo PASS.

- [ ] **Step 6: Commit**

```bash
git add src/accounts/accounts.service.ts test/holdings.e2e-spec.ts
git commit -m "feat: enrich accounts with portfolio totals"
```

---

## Task 8: Frontend — tipos, servicios, hooks y totales

**Files:**
- Modify: `src/types/expenses.ts`, `src/services/AccountService.ts`, `src/lib/accountTotals.ts`, `src/lib/accountTotals.test.ts`
- Create: `src/services/MarketService.ts`, `src/hooks/useDebouncedValue.ts`, `src/pages/expenses/hooks/useMarketSearch.ts`, `src/pages/expenses/hooks/useHoldings.ts`

**Interfaces:**
- Consumes: endpoints de Tasks 4, 6, 7.
- Produces:
  - tipos `MarketQuote`, `MarketSearchResult`, `Holding`, `PortfolioSummary`, `HoldingPayload`; `Account` con `cashBalance?`, `positionsValue?`, `totalValue?`, `stale?`.
  - `accountValue(account: Account): number`
  - `MarketService.search(q)`, `MarketService.getQuote(symbol)`
  - `AccountService.getHoldings/createHolding/updateHolding/deleteHolding`
  - `useMarketSearch(query)`, `useHoldings(accountId)`, `useHoldingMutations(accountId)`

- [ ] **Step 1: Escribir las pruebas que fallan de `accountTotals`**

Agrega a `src/lib/accountTotals.test.ts` (importa también `accountValue`):

```ts
describe("accountValue", () => {
  it("usa el valor de mercado en cuentas de inversión", () => {
    expect(accountValue(acc({ type: "INVESTMENT", balance: 5000, totalValue: 42000 }))).toBe(42000);
  });

  it("usa el saldo cuando no hay valor de mercado", () => {
    expect(accountValue(acc({ type: "INVESTMENT", balance: 5000 }))).toBe(5000);
    expect(accountValue(acc({ type: "CASH", balance: 100 }))).toBe(100);
  });
});

describe("sumInvestments con valor de mercado", () => {
  it("suma el valor de mercado de las inversiones", () => {
    expect(
      sumInvestments(
        [
          acc({ type: "INVESTMENT", currency: "MXN", balance: 5000, totalValue: 42000 }),
          acc({ type: "CASH", currency: "MXN", balance: 9999 }),
        ],
        17
      )
    ).toBeCloseTo(42000, 6);
  });
});
```

Y actualiza el import del encabezado a:

```ts
import {
  accountValue,
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
  sumInvestments,
  toMxn,
} from "./accountTotals";
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `pnpm test -- accountTotals`
Expected: FAIL — `accountValue` no existe.

- [ ] **Step 3: Implementar los cambios de `accountTotals.ts`**

Modify `src/lib/accountTotals.ts`: agrega el helper y úsalo.

```ts
/**
 * Valor de una cuenta para el patrimonio: en inversión usa el valor de mercado
 * (efectivo + posiciones) cuando está disponible; si no, el saldo.
 */
export const accountValue = (account: Account): number =>
  account.type === "INVESTMENT" && account.totalValue != null
    ? account.totalValue
    : account.balance;
```

En `netTotalsByCurrency`, reemplaza `account.balance` por `accountValue(account)`:

```ts
    const value = accountValue(account);
    const signed = account.type === "CREDIT" ? -value : value;
```

En `sumInvestments`, reemplaza `account.balance` por `accountValue(account)`:

```ts
    const converted = toMxn(accountValue(account), account.currency, usdRate);
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `pnpm test -- accountTotals`
Expected: PASS.

- [ ] **Step 5: Agregar los tipos**

Modify `src/types/expenses.ts`: agrega a `Account` los campos opcionales:

```ts
  cashBalance?: number;
  positionsValue?: number | null;
  totalValue?: number | null;
  changePercent?: number | null;
  stale?: boolean;
```

Y al final del archivo agrega:

```ts
export type MarketQuote = {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  name: string | null;
  exchange: string | null;
  source: string | null;
  fetchedAt: string | null;
  stale: boolean;
};

export type MarketSearchResult = {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string | null;
};

export type Holding = {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  marketValue: number | null;
  marketValueAccountCurrency: number | null;
  fetchedAt: string | null;
  stale: boolean;
};

export type PortfolioSummary = {
  currency: Currency;
  cashBalance: number;
  positionsValue: number | null;
  totalValue: number | null;
  changePercent: number | null;
  stale: boolean;
  holdings: Holding[];
};

export type HoldingPayload = {
  symbol?: string;
  quantity?: number;
  deductFromCash?: boolean;
};
```

- [ ] **Step 6: Implementar servicios y hooks**

Create `src/services/MarketService.ts`:

```ts
import { parseJsonResponse } from "@/lib/http";
import type { MarketQuote, MarketSearchResult } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const MARKET_URL = `${VITE_API_BASE_URL}/market`;

class MarketService {
  public async search(query: string): Promise<MarketSearchResult[]> {
    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`${MARKET_URL}/search?${params.toString()}`);
      return await parseJsonResponse<MarketSearchResult[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getQuote(symbol: string): Promise<MarketQuote> {
    try {
      const params = new URLSearchParams({ symbol });
      const response = await fetch(`${MARKET_URL}/quote?${params.toString()}`);
      return await parseJsonResponse<MarketQuote>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const marketService = new MarketService();
export default marketService;
```

Create `src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from "react";

export const useDebouncedValue = <T,>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
```

Create `src/pages/expenses/hooks/useMarketSearch.ts`:

```ts
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MarketService from "@/services/MarketService";
import type { MarketSearchResult } from "@/types";
import { useQuery } from "react-query";

export const useMarketSearch = (query: string) => {
  const debounced = useDebouncedValue(query.trim(), 300);
  const { data, isFetching, error } = useQuery<MarketSearchResult[]>(
    ["market-search", debounced],
    () => MarketService.search(debounced),
    { enabled: debounced.length >= 2, staleTime: 5 * 60 * 1000, retry: 0 }
  );

  return {
    results: data ?? [],
    searching: isFetching,
    searchError: error as Error | null,
  };
};
```

Create `src/pages/expenses/hooks/useHoldings.ts`:

```ts
import AccountService from "@/services/AccountService";
import type { Holding, HoldingPayload, PortfolioSummary } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useHoldings = (accountId: string, enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery<PortfolioSummary>(
    ["holdings", accountId],
    () => AccountService.getHoldings(accountId),
    {
      enabled: enabled && Boolean(accountId),
      staleTime: 5 * 60 * 1000,
      retry: 0,
    }
  );

  return {
    portfolio: data ?? null,
    loadingHoldings: isLoading,
    holdingsError: error as Error | null,
    refreshHoldings: refetch,
  };
};

export const useHoldingMutations = (accountId: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries(["holdings", accountId]);
    queryClient.invalidateQueries(["accounts"]);
  };

  const createHolding = useMutation<Holding, Error, HoldingPayload>(
    (payload: HoldingPayload) => AccountService.createHolding(accountId, payload),
    { onSuccess: invalidate }
  );

  const updateHolding = useMutation<
    Holding,
    Error,
    { id: string; payload: HoldingPayload }
  >(({ id, payload }) => AccountService.updateHolding(accountId, id, payload), {
    onSuccess: invalidate,
  });

  const deleteHolding = useMutation<void, Error, string>(
    (id: string) => AccountService.deleteHolding(accountId, id),
    { onSuccess: invalidate }
  );

  return {
    createHolding,
    updateHolding,
    deleteHolding,
    holdingMutationLoading:
      createHolding.isLoading || updateHolding.isLoading || deleteHolding.isLoading,
  };
};
```

Modify `src/services/AccountService.ts`: agrega los métodos antes del cierre de la clase:

```ts
  public async getHoldings(accountId: string): Promise<PortfolioSummary> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings`);
      return await parseJsonResponse<PortfolioSummary>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createHolding(accountId: string, payload: HoldingPayload): Promise<Holding> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Holding>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateHolding(
    accountId: string,
    holdingId: string,
    payload: HoldingPayload
  ): Promise<Holding> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings/${holdingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Holding>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async deleteHolding(accountId: string, holdingId: string): Promise<void> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings/${holdingId}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
```

Y actualiza el import del encabezado a:

```ts
import type {
  Account,
  AccountPayload,
  CreditSummary,
  Holding,
  HoldingPayload,
  PortfolioSummary,
} from "@/types";
```

- [ ] **Step 7: Build, lint y tests**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types/expenses.ts src/services/MarketService.ts src/services/AccountService.ts src/hooks/useDebouncedValue.ts src/pages/expenses/hooks/useMarketSearch.ts src/pages/expenses/hooks/useHoldings.ts src/lib/accountTotals.ts src/lib/accountTotals.test.ts
git commit -m "feat: etf types, services, hooks and portfolio totals"
```

---

## Task 9: Tarjeta de inversión en `AccountList` + ruta

**Files:**
- Modify: `src/pages/expenses/components/AccountList.tsx`, `src/App.tsx`
- Create: `src/pages/expenses/InvestmentDetailPage.tsx` (placeholder navegable en esta tarea; se completa en Task 10)

**Interfaces:**
- Consumes: campos de inversión del tipo `Account` (`totalValue`, `cashBalance`, `positionsValue`, `changePercent`, `stale` — Task 8), `useFxRate`, `useAccounts`.
- Produces: navegación a `/cuentas/:id`; tarjeta de inversión con total, desglose, cambio del día y badge `stale`.

- [ ] **Step 1: Crear un `InvestmentDetailPage` mínimo navegable**

Create `src/pages/expenses/InvestmentDetailPage.tsx`:

```tsx
import { useParams } from "react-router";

function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <div className="pt-2">Detalle de inversión {id}</div>;
}

export default InvestmentDetailPage;
```

- [ ] **Step 2: Registrar la ruta en `App.tsx`**

Agrega el import y la ruta:

```tsx
import InvestmentDetailPage from "./pages/expenses/InvestmentDetailPage";
```

```tsx
            <Route path="/cuentas/:id" element={<InvestmentDetailPage />} />
```

(Colócala después de la ruta `/cuentas`.)

- [ ] **Step 3: Actualizar la tarjeta de inversión en `AccountList.tsx`**

Importa lo necesario:

```tsx
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";
```

Dentro del componente, agrega `const navigate = useNavigate();`.

Reemplaza el bloque `{!isCredit && ( ... )}` por uno que distinga inversión:

```tsx
                      {!isCredit && account.type !== "INVESTMENT" && (
                        <>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              account.balance < 0 && "text-destructive"
                            )}
                          >
                            {formatMoney(account.balance, account.currency)}
                          </span>
                          {account.currency === "USD" && usdRate != null && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              ≈ {formatMoney(toMxn(account.balance, "USD", usdRate) ?? 0, "MXN")}
                            </span>
                          )}
                        </>
                      )}

                      {account.type === "INVESTMENT" && (
                        <>
                          <span className="font-semibold tabular-nums">
                            {account.totalValue != null
                              ? formatMoney(account.totalValue, account.currency)
                              : "—"}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            Efectivo {formatMoney(account.cashBalance ?? account.balance, account.currency)}
                            {" · "}
                            Posiciones{" "}
                            {account.positionsValue != null
                              ? formatMoney(account.positionsValue, account.currency)
                              : "—"}
                          </span>
                          {account.totalValue == null && (
                            <span className="text-xs text-destructive">
                              Sin precio para alguna posición
                            </span>
                          )}
                          {account.stale && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" aria-hidden="true" />
                              Precio en caché
                            </span>
                          )}
                        </>
                      )}
```

Justo después del bloque de botones (editar / agregar transacción), dentro de la tarjeta, agrega el botón de posiciones y el chip de cambio del día para inversión:

```tsx
                  {account.type === "INVESTMENT" && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Button
                        className="cursor-pointer"
                        onClick={() => navigate(`/cuentas/${account.id}`)}
                      >
                        Posiciones
                      </Button>
                      {account.changePercent != null && (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm tabular-nums",
                            account.changePercent >= 0 ? "text-positive" : "text-negative"
                          )}
                        >
                          {account.changePercent >= 0 ? (
                            <TrendingUp className="size-4" aria-hidden="true" />
                          ) : (
                            <TrendingDown className="size-4" aria-hidden="true" />
                          )}
                          {account.changePercent >= 0 ? "+" : ""}
                          {account.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
```

> `changePercent` a nivel cuenta se expone en `GET /accounts` (Task 7) y en el tipo `Account` (Task 8); este chip lo consume tal cual.

- [ ] **Step 4: Verificar build y lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/expenses/components/AccountList.tsx src/pages/expenses/InvestmentDetailPage.tsx src/App.tsx src/types/expenses.ts
git commit -m "feat: investment account card and detail route"
```

---

## Task 10: Página de detalle de inversión

**Files:**
- Modify: `src/pages/expenses/InvestmentDetailPage.tsx`
- Create: `src/pages/expenses/components/InvestmentPositions/index.tsx`

**Interfaces:**
- Consumes: `useAccounts`, `useHoldings` (Task 8), `useExpensesStore` (editar cuenta), `formatMoney`.
- Produces: lista de posiciones con total, efectivo, cambio del día, estado vacío/error y CTA "Agregar ETF".

- [ ] **Step 1: Implementar el componente de posiciones**

Create `src/pages/expenses/components/InvestmentPositions/index.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { cn, formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Account, Holding } from "@/types";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useHoldings } from "../../hooks/useHoldings";

type Props = {
  account: Account;
  onAdd: () => void;
  onEdit: (holding: Holding) => void;
};

function InvestmentPositions({ account, onAdd, onEdit }: Props) {
  const { portfolio, loadingHoldings, holdingsError, refreshHoldings } = useHoldings(account.id);
  const openEditAccountModal = useExpensesStore((state) => state.openEditAccountModal);

  if (loadingHoldings) {
    return (
      <ExpenseSection className="p-4">
        <Loader />
      </ExpenseSection>
    );
  }

  if (holdingsError) {
    return (
      <ExpenseSection className="p-4">
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-destructive">Error al cargar posiciones</p>
          <Button variant="outline" className="cursor-pointer" onClick={() => refreshHoldings()}>
            Reintentar
          </Button>
        </div>
      </ExpenseSection>
    );
  }

  const holdings = portfolio?.holdings ?? [];

  return (
    <ExpenseSection className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Valor total</p>
          <p className="text-2xl font-bold tabular-nums">
            {portfolio?.totalValue != null
              ? formatMoney(portfolio.totalValue, account.currency)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Efectivo {formatMoney(portfolio?.cashBalance ?? 0, account.currency)}
            {" · "}
            Posiciones{" "}
            {portfolio?.positionsValue != null
              ? formatMoney(portfolio.positionsValue, account.currency)
              : "—"}
          </p>
          {portfolio?.changePercent != null && (
            <span
              className={cn(
                "mt-1 flex items-center gap-1 text-sm tabular-nums",
                portfolio.changePercent >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {portfolio.changePercent >= 0 ? (
                <TrendingUp className="size-4" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-4" aria-hidden="true" />
              )}
              {portfolio.changePercent >= 0 ? "+" : ""}
              {portfolio.changePercent.toFixed(2)}% hoy
            </span>
          )}
          {portfolio?.stale && (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              Precio en caché
            </span>
          )}
        </div>
        <Button variant="outline" className="cursor-pointer" onClick={() => openEditAccountModal(account)}>
          Editar cuenta
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg">Posiciones</h3>
        <Button className="cursor-pointer" onClick={onAdd}>
          Agregar ETF
        </Button>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="font-display text-lg">Aún no tienes ETFs</p>
          <p className="text-sm text-muted-foreground">
            Agrega tu primer ETF para ver su valor de mercado.
          </p>
          <Button className="cursor-pointer" onClick={onAdd}>
            Agregar ETF
          </Button>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {holdings.map((holding) => (
            <li key={holding.id}>
              <button
                type="button"
                onClick={() => onEdit(holding)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors duration-200 hover:bg-muted"
              >
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {holding.symbol}
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-medium">
                    {holding.name ?? holding.symbol}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {holding.quantity} ×{" "}
                    {holding.price != null ? formatMoney(holding.price, holding.currency) : "—"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {holding.marketValueAccountCurrency != null
                      ? formatMoney(holding.marketValueAccountCurrency, account.currency)
                      : "—"}
                  </span>
                  {holding.changePercent != null && (
                    <span
                      className={cn(
                        "block text-xs tabular-nums",
                        holding.changePercent >= 0 ? "text-positive" : "text-negative"
                      )}
                    >
                      {holding.changePercent >= 0 ? "+" : ""}
                      {holding.changePercent.toFixed(2)}%
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ExpenseSection>
  );
}

export default InvestmentPositions;
```

- [ ] **Step 2: Completar la página de detalle**

Replace `src/pages/expenses/InvestmentDetailPage.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { useAccounts } from "./hooks/useAccounts";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import InvestmentPositions from "./components/InvestmentPositions";

function InvestmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, loadingAccounts } = useAccounts();

  const account = accounts.find((entry) => entry.id === id) ?? null;

  if (loadingAccounts) {
    return <div className="pt-2 text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!account || account.type !== "INVESTMENT") {
    return (
      <div className="flex flex-col items-start gap-3 pt-2">
        <Button variant="ghost" className="cursor-pointer" onClick={() => navigate("/cuentas")}>
          <ArrowLeft />
          Volver
        </Button>
        <p className="text-sm text-muted-foreground">Cuenta de inversión no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          aria-label="Volver a cuentas"
          onClick={() => navigate("/cuentas")}
        >
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-2xl">{account.name}</h1>
      </div>

      <InvestmentPositions account={account} onAdd={() => {}} onEdit={() => {}} />
    </div>
  );
}

export default InvestmentDetailPage;
```

> Los handlers `onAdd`/`onEdit` son no-op en esta tarea; la Task 11 los reemplaza por el estado y monta los drawers. Así el lint no reporta variables sin usar.

- [ ] **Step 3: Verificar build y lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/expenses/InvestmentDetailPage.tsx src/pages/expenses/components/InvestmentPositions/index.tsx
git commit -m "feat: investment detail page with positions"
```

---

## Task 11: Drawers de alta y edición de ETFs

**Files:**
- Create: `src/pages/expenses/components/InvestmentPositions/AddHoldingDrawer.tsx`, `src/pages/expenses/components/InvestmentPositions/EditHoldingDrawer.tsx`
- Modify: `src/pages/expenses/InvestmentDetailPage.tsx`

**Interfaces:**
- Consumes: `useMarketSearch`, `useHoldingMutations` (Task 8), `MarketService.getQuote`.
- Produces: alta (buscar → cantidad → check descontar) y edición (cantidad + eliminar).

- [ ] **Step 1: Implementar `AddHoldingDrawer.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { formatMoney } from "@/lib/utils";
import MarketService from "@/services/MarketService";
import type { MarketQuote, MarketSearchResult } from "@/types";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useHoldingMutations } from "../../hooks/useHoldings";
import { useMarketSearch } from "../../hooks/useMarketSearch";

type Props = {
  accountId: string;
  currency: string;
  open: boolean;
  onClose: () => void;
};

function AddHoldingDrawer({ accountId, currency, open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MarketSearchResult | null>(null);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [deduct, setDeduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { results, searching, searchError } = useMarketSearch(query);
  const { createHolding, holdingMutationLoading } = useHoldingMutations(accountId);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(null);
      setQuote(null);
      setManualMode(false);
      setManualSymbol("");
      setManualError(null);
      setQuantity("");
      setDeduct(false);
      setError(null);
    }
  }, [open]);

  const parsedQuantity = Number(quantity);
  const canSubmit =
    selected != null && Number.isFinite(parsedQuantity) && parsedQuantity > 0 && !holdingMutationLoading;
  const preview =
    quote?.price != null && Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity * quote.price
      : null;

  const handleSelect = async (result: MarketSearchResult) => {
    setSelected(result);
    setQuote(null);
    try {
      setQuote(await MarketService.getQuote(result.symbol));
    } catch {
      // La previsualización es opcional; el alta valida en el backend.
    }
  };

  const handleValidateManual = async () => {
    const symbol = manualSymbol.trim().toUpperCase();
    if (!symbol) return;
    setValidating(true);
    setManualError(null);
    try {
      const fetched = await MarketService.getQuote(symbol);
      if (fetched.price == null) {
        setManualError("No encontramos ese símbolo.");
        return;
      }
      setSelected({
        symbol: fetched.symbol,
        name: fetched.name ?? fetched.symbol,
        exchange: fetched.exchange,
        currency: fetched.currency,
      });
      setQuote(fetched);
      setManualMode(false);
    } catch (validateError) {
      setManualError((validateError as Error).message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = () => {
    if (!selected || !canSubmit) return;
    setError(null);
    createHolding.mutate(
      { symbol: selected.symbol, quantity: parsedQuantity, deductFromCash: deduct },
      { onSuccess: () => onClose(), onError: (mutationError) => setError(mutationError.message) }
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerContent aria-describedby="add-holding-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">Agregar ETF</DrawerTitle>
          <DrawerDescription id="add-holding-description">
            Busca por nombre o ticker y captura tu cantidad.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          {!selected && !manualMode && (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca un ETF (ej. VOO, Vanguard)"
                  className="h-11 pl-9"
                />
              </div>

              {searching && <Loader />}

              {!searching && searchError && (
                <p className="text-sm text-destructive">
                  No pudimos buscar. Usa el ticker manual.
                </p>
              )}

              {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin resultados.</p>
              )}

              <ul className="flex flex-col gap-2">
                {results.map((result) => (
                  <li key={result.symbol}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors duration-200 hover:bg-muted"
                    >
                      <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                        {result.symbol}
                      </span>
                      <span className="min-w-0 grow">
                        <span className="block truncate text-sm font-medium">{result.name}</span>
                        {result.exchange && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.exchange}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setManualMode(true)}
              >
                Escribir el ticker manualmente
              </Button>
            </>
          )}

          {!selected && manualMode && (
            <>
              <Input
                autoFocus
                value={manualSymbol}
                onChange={(event) => setManualSymbol(event.target.value)}
                placeholder="Ticker (ej. VOO)"
                className="h-11 uppercase"
              />
              {manualError && <p className="text-sm text-destructive">{manualError}</p>}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setManualMode(false);
                    setManualError(null);
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={handleValidateManual}
                  disabled={validating || manualSymbol.trim() === ""}
                >
                  {validating && <LoaderCircle className="mr-2 animate-spin" />}
                  Validar
                </Button>
              </div>
            </>
          )}

          {selected && (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {selected.symbol}
                </span>
                <span className="min-w-0 grow truncate text-sm">{selected.name}</span>
                <button
                  type="button"
                  className="cursor-pointer text-xs text-primary"
                  onClick={() => {
                    setSelected(null);
                    setQuote(null);
                  }}
                >
                  Cambiar
                </button>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Cantidad</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.00000001"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-11"
                  placeholder="0"
                />
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  checked={deduct}
                  onChange={(event) => setDeduct(event.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-[var(--primary)]"
                />
                <span className="text-sm">
                  Descontar del efectivo (registrar compra)
                  <span className="block text-xs text-muted-foreground">
                    {preview != null
                      ? `Se descontarán ≈ ${formatMoney(preview, quote?.currency ?? "USD")}`
                      : `Se descontará de tu efectivo en ${currency}.`}
                  </span>
                </span>
              </label>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={onClose}
                  disabled={holdingMutationLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
                  Agregar
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default AddHoldingDrawer;
```

- [ ] **Step 2: Implementar `EditHoldingDrawer.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { Holding } from "@/types";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useHoldingMutations } from "../../hooks/useHoldings";

type Props = {
  accountId: string;
  holding: Holding | null;
  onClose: () => void;
};

function EditHoldingDrawer({ accountId, holding, onClose }: Props) {
  const [quantity, setQuantity] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateHolding, deleteHolding, holdingMutationLoading } = useHoldingMutations(accountId);

  useEffect(() => {
    if (holding) {
      setQuantity(String(holding.quantity));
      setConfirmDelete(false);
      setError(null);
    }
  }, [holding]);

  if (!holding) return null;

  const parsedQuantity = Number(quantity);
  const canSubmit = Number.isFinite(parsedQuantity) && parsedQuantity > 0 && !holdingMutationLoading;

  const handleSave = () => {
    if (!canSubmit) return;
    setError(null);
    updateHolding.mutate(
      { id: holding.id, payload: { quantity: parsedQuantity } },
      { onSuccess: () => onClose(), onError: (mutationError) => setError(mutationError.message) }
    );
  };

  const handleDelete = () => {
    setError(null);
    deleteHolding.mutate(holding.id, {
      onSuccess: () => onClose(),
      onError: (mutationError) => setError(mutationError.message),
    });
  };

  return (
    <Drawer
      open={holding != null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerContent aria-describedby="edit-holding-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {holding.symbol} · {holding.name ?? holding.symbol}
          </DrawerTitle>
          <DrawerDescription id="edit-holding-description">
            {holding.price != null
              ? `Precio actual ${formatMoney(holding.price, holding.currency)}`
              : "Sin precio disponible"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cantidad</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.00000001"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-11"
            />
          </label>

          <p className="text-xs text-muted-foreground">Editar la cantidad no ajusta el efectivo.</p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
              <p className="text-sm">¿Eliminar esta posición? No ajusta el efectivo.</p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setConfirmDelete(false)}
                  disabled={holdingMutationLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={handleDelete}
                  disabled={holdingMutationLoading}
                >
                  {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
                  Sí, eliminar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={holdingMutationLoading}
            >
              Eliminar posición
            </Button>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={onClose}
              disabled={holdingMutationLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
              disabled={!canSubmit}
            >
              {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default EditHoldingDrawer;
```

- [ ] **Step 3: Conectar los drawers en la página de detalle**

En `src/pages/expenses/InvestmentDetailPage.tsx` agrega los imports:

```tsx
import type { Holding } from "@/types";
import { useState } from "react";
import AddHoldingDrawer from "./components/InvestmentPositions/AddHoldingDrawer";
import EditHoldingDrawer from "./components/InvestmentPositions/EditHoldingDrawer";
```

Dentro del componente, agrega el estado:

```tsx
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
```

Reemplaza los handlers no-op por el estado real:

```tsx
      <InvestmentPositions account={account} onAdd={() => setAddOpen(true)} onEdit={setEditing} />
```

Y antes del cierre del `div` principal monta los drawers:

```tsx
      <AddHoldingDrawer
        accountId={account.id}
        currency={account.currency}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <EditHoldingDrawer
        accountId={account.id}
        holding={editing}
        onClose={() => setEditing(null)}
      />
```

- [ ] **Step 4: Verificar build y lint**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/expenses/components/InvestmentPositions/AddHoldingDrawer.tsx src/pages/expenses/components/InvestmentPositions/EditHoldingDrawer.tsx src/pages/expenses/InvestmentDetailPage.tsx
git commit -m "feat: add and edit ETF holding drawers"
```

---

## Task 12: Design system, aceptación y verificación final

**Files:**
- Modify: `design-system/pages/cuentas.md`
- Create: `docs/superpowers/plans/2026-09-21-expenses-fase6-acceptance.md`

- [ ] **Step 1: Actualizar la doc de diseño**

Agrega a `design-system/pages/cuentas.md`:

```md
## Inversión (Fase 6)

- Tarjeta de inversión: valor total grande (`tabular-nums`), sub-línea
  "Efectivo · Posiciones", chip de cambio del día (`text-positive`/`text-negative`
  con flecha + %), badge `stale` con ícono de reloj.
- Detalle `/cuentas/:id`: header con volver, total, desglose y cambio del día;
  lista de posiciones (badge del ticker, `cantidad × precio`, valor y %).
- Alta/edición en bottom-sheet: buscador con debounce, resultados con ticker +
  nombre + bolsa; ticker manual como respaldo; checkbox "descontar del efectivo"
  con previsualización.
- Targets ≥44px, sin scroll horizontal a 375px, transiciones 150–250 ms.
```

- [ ] **Step 2: Escribir la doc de aceptación**

Create `docs/superpowers/plans/2026-09-21-expenses-fase6-acceptance.md` con el formato de las aceptaciones previas, cubriendo:

- Criterios de aceptación 1–8 del spec y su evidencia (comando + resultado).
- Resultado de `pnpm test`, `pnpm test:e2e`, `pnpm build` (backend) y `pnpm build`, `pnpm lint`, `pnpm test` (frontend).
- Prueba manual en 375px: crear cuenta de inversión → `/cuentas/:id` → buscar "vanguard" → agregar VOO con 0.5 y descontar efectivo → ver total y posición → editar cantidad → eliminar.
- Nota de degradación: apagar la red y verificar "—" y badge `stale`.

- [ ] **Step 3: Verificación final completa**

Backend:

Run: `pnpm test && pnpm test:e2e && pnpm build`
Expected: todo PASS.

Frontend:

Run: `pnpm test && pnpm build && pnpm lint`
Expected: todo PASS.

- [ ] **Step 4: Commit**

```bash
git add design-system/pages/cuentas.md docs/superpowers/plans/2026-09-21-expenses-fase6-acceptance.md
git commit -m "docs: phase 6 design system and acceptance"
```

---

## Criterios de aceptación (del spec)

1. `GET /market/quote?symbol=VOO` devuelve precio, moneda, cambio y `stale`, con caché y fallback Yahoo → Nasdaq. *(Tasks 3, 4)*
2. `GET /market/search?q=vanguard` devuelve solo ETFs. *(Tasks 2, 4)*
3. `POST /accounts/:id/holdings` valida el símbolo y con `deductFromCash` ajusta el efectivo de forma atómica. *(Task 6)*
4. `GET /accounts/:id/holdings` devuelve posiciones valuadas y totales; `null` si alguna no se puede valuar. *(Tasks 5, 6)*
5. `GET /accounts` enriquece las cuentas `INVESTMENT`. *(Task 7)*
6. Fallo de ambos proveedores con caché → `stale`; sin caché → "—" sin romperse. *(Tasks 3, 10)*
7. Mobile 375px: ver total, abrir detalle, buscar y dar de alta, editar y eliminar. *(Tasks 9–11, 12)*
8. Suites y builds en verde en ambos repos. *(Task 12)*
