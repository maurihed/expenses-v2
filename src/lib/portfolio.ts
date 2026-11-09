import type { PortfolioSummary } from "@/types";
import { toMxn } from "./accountTotals";

export type PositionChange = {
  symbol: string;
  changePercent: number;
};

export type PositionsSummary = {
  /** Variación ponderada del día, en porcentaje. */
  changePercent: number | null;
  /** Ganancia/pérdida del día, en MXN. */
  dailyChangeMxn: number | null;
  /** Valor actual de las posiciones, en MXN. */
  currentValueMxn: number | null;
  positionCount: number;
  accountCount: number;
  staleCount: number;
  best: PositionChange | null;
  worst: PositionChange | null;
  /** Hay posiciones en USD y se necesita la tasa FX. */
  needsFx: boolean;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const toMxnAmount = (
  amount: number,
  currency: string,
  usdRate: number | null
): number | null => {
  if (currency === "MXN") return amount;
  if (currency === "USD") return toMxn(amount, "USD", usdRate);
  return null;
};

/**
 * Agrega las posiciones de todas las cuentas de inversión.
 *
 * La variación se calcula contra el cierre anterior (`previousClose`), que es
 * el único P/L disponible en el modelo actual de holdings. El porcentaje se
 * pondera por el valor de cada posición convertido a MXN.
 */
export const summarizePositions = (
  portfolios: PortfolioSummary[],
  usdRate: number | null
): PositionsSummary => {
  const holdings = portfolios.flatMap((portfolio) => portfolio.holdings ?? []);

  let currentValue = 0;
  let previousValue = 0;
  let canValue = true;
  let canCompare = true;
  let needsFx = false;

  let best: PositionChange | null = null;
  let worst: PositionChange | null = null;

  for (const holding of holdings) {
    if (holding.currency === "USD") needsFx = true;

    if (holding.changePercent != null) {
      const change = { symbol: holding.symbol, changePercent: holding.changePercent };
      if (!best || change.changePercent > best.changePercent) best = change;
      if (!worst || change.changePercent < worst.changePercent) worst = change;
    }

    if (holding.price == null) {
      canValue = false;
      canCompare = false;
      continue;
    }

    const current = toMxnAmount(holding.quantity * holding.price, holding.currency, usdRate);
    if (current == null) {
      canValue = false;
      canCompare = false;
    } else {
      currentValue += current;
    }

    if (holding.previousClose == null) {
      canCompare = false;
      continue;
    }

    const previous = toMxnAmount(
      holding.quantity * holding.previousClose,
      holding.currency,
      usdRate
    );
    if (previous == null) {
      canCompare = false;
    } else {
      previousValue += previous;
    }
  }

  const comparable = canCompare && previousValue > 0;

  return {
    changePercent: comparable ? ((currentValue - previousValue) / previousValue) * 100 : null,
    dailyChangeMxn: comparable ? roundMoney(currentValue - previousValue) : null,
    currentValueMxn: canValue ? roundMoney(currentValue) : null,
    positionCount: holdings.length,
    accountCount: portfolios.filter((portfolio) => (portfolio.holdings?.length ?? 0) > 0).length,
    staleCount: holdings.filter((holding) => holding.stale).length,
    best,
    worst,
    needsFx,
  };
};
