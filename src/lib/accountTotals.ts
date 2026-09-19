import type { Account, Currency } from "@/types";

export type CurrencyTotal = { currency: Currency; total: number };

/**
 * Suma los saldos de las cuentas agrupados por moneda.
 * Regla: efectivo + débito + inversión − crédito (la deuda de crédito resta).
 */
export const netTotalsByCurrency = (accounts: Account[]): CurrencyTotal[] => {
  return accounts.reduce<CurrencyTotal[]>((totals, account) => {
    const signed = account.type === "CREDIT" ? -account.balance : account.balance;
    const group = totals.find((entry) => entry.currency === account.currency);
    if (group) {
      group.total += signed;
    } else {
      totals.push({ currency: account.currency, total: signed });
    }
    return totals;
  }, []);
};

/**
 * Convierte un monto a MXN. Devuelve null si es USD y no hay tasa disponible.
 */
export const toMxn = (
  amount: number,
  currency: Currency,
  usdRate: number | null
): number | null => {
  if (currency === "MXN") return amount;
  return usdRate == null ? null : amount * usdRate;
};

/**
 * Total de un listado de saldos por moneda convertido a MXN.
 * Devuelve null si alguna moneda no se puede convertir (falta la tasa).
 */
export const convertTotalsToMxn = (
  totals: CurrencyTotal[],
  usdRate: number | null
): number | null => {
  let sum = 0;
  for (const { currency, total } of totals) {
    const converted = toMxn(total, currency, usdRate);
    if (converted == null) return null;
    sum += converted;
  }
  return sum;
};

/**
 * Suma de las cuentas de inversión convertida a MXN (null si falta la tasa).
 */
export const sumInvestments = (accounts: Account[], usdRate: number | null): number | null => {
  let sum = 0;
  for (const account of accounts.filter((entry) => entry.type === "INVESTMENT")) {
    const converted = toMxn(account.balance, account.currency, usdRate);
    if (converted == null) return null;
    sum += converted;
  }
  return sum;
};
