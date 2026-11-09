import type { Holding, PortfolioSummary } from "@/types";
import { describe, expect, it } from "vitest";
import { summarizePositions } from "./portfolio";

const holding = (over: Partial<Holding>): Holding =>
  ({
    id: over.id ?? Math.random().toString(),
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    quantity: 1,
    price: 100,
    previousClose: 100,
    changePercent: 0,
    currency: "USD",
    marketValue: 100,
    marketValueAccountCurrency: 2000,
    fetchedAt: "2026-11-09T12:00:00Z",
    stale: false,
    ...over,
  }) as Holding;

const portfolio = (holdings: Holding[]): PortfolioSummary => ({
  currency: "MXN",
  cashBalance: 0,
  positionsValue: null,
  totalValue: null,
  changePercent: null,
  stale: false,
  holdings,
});

describe("summarizePositions", () => {
  it("pondera la variación del día por valor de cada posición", () => {
    const result = summarizePositions(
      [
        portfolio([
          holding({
            symbol: "VOO",
            quantity: 2,
            price: 110,
            previousClose: 100,
            changePercent: 10,
          }),
          holding({
            symbol: "QQQ",
            quantity: 1,
            price: 50,
            previousClose: 55,
            changePercent: -9.0909,
          }),
        ]),
      ],
      20
    );

    expect(result.positionCount).toBe(2);
    expect(result.accountCount).toBe(1);
    expect(result.currentValueMxn).toBe(5400);
    expect(result.dailyChangeMxn).toBe(300);
    expect(result.changePercent).toBeCloseTo((300 / 5100) * 100, 6);
    expect(result.best).toEqual({ symbol: "VOO", changePercent: 10 });
    expect(result.worst).toEqual({ symbol: "QQQ", changePercent: -9.0909 });
    expect(result.needsFx).toBe(true);
  });

  it("agrega posiciones de varias cuentas y cuenta precios en caché", () => {
    const result = summarizePositions(
      [
        portfolio([holding({ symbol: "VOO", price: 100, previousClose: 100 })]),
        portfolio([
          holding({
            symbol: "SCHD",
            quantity: 2,
            price: 25,
            previousClose: 20,
            stale: true,
            changePercent: 25,
          }),
        ]),
      ],
      10
    );

    expect(result.accountCount).toBe(2);
    expect(result.positionCount).toBe(2);
    expect(result.staleCount).toBe(1);
    expect(result.currentValueMxn).toBe(1500); // 100*10 + 50*10
    expect(result.dailyChangeMxn).toBe(100); // 1000 + 500 - (1000 + 400)
    expect(result.best?.symbol).toBe("SCHD");
  });

  it("no calcula la variación si falta el cierre anterior", () => {
    const result = summarizePositions(
      [portfolio([holding({ price: 100, previousClose: null, changePercent: null })])],
      20
    );

    expect(result.currentValueMxn).toBe(2000);
    expect(result.dailyChangeMxn).toBeNull();
    expect(result.changePercent).toBeNull();
    expect(result.best).toBeNull();
  });

  it("devuelve null si falta la tasa para una posición USD", () => {
    const result = summarizePositions([portfolio([holding({})])], null);

    expect(result.currentValueMxn).toBeNull();
    expect(result.dailyChangeMxn).toBeNull();
    expect(result.changePercent).toBeNull();
    expect(result.needsFx).toBe(true);
  });

  it("sin posiciones devuelve conteos en cero", () => {
    const result = summarizePositions([], null);

    expect(result.positionCount).toBe(0);
    expect(result.accountCount).toBe(0);
    expect(result.currentValueMxn).toBe(0);
    expect(result.changePercent).toBeNull();
    expect(result.best).toBeNull();
  });
});
