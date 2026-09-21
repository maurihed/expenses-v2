import type { Account, AccountType, Currency } from "@/types";

export type CurrencyTotal = { currency: Currency; total: number };

/** Orden de despliegue por tipo: activos primero, crédito al final. */
const ACCOUNT_TYPE_ORDER: Record<AccountType, number> = {
  CASH: 0,
  DEBIT: 1,
  INVESTMENT: 2,
  CREDIT: 3,
};

/**
 * Ordena las cuentas por tipo (efectivo → débito → inversión → crédito) y,
 * dentro de cada tipo, por nombre. No muta el arreglo original.
 */
export const sortAccounts = (accounts: Account[]): Account[] =>
  [...accounts].sort((a, b) => {
    const byType = ACCOUNT_TYPE_ORDER[a.type] - ACCOUNT_TYPE_ORDER[b.type];
    if (byType !== 0) return byType;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

/**
 * Valor de una cuenta para el patrimonio: en inversión usa el valor de mercado
 * (efectivo + posiciones) cuando está disponible; si no, el saldo.
 */
export const accountValue = (account: Account): number =>
  account.type === "INVESTMENT" && account.totalValue != null
    ? account.totalValue
    : account.balance;

/**
 * Suma los saldos de las cuentas agrupados por moneda.
 * Regla: efectivo + débito + inversión − crédito (la deuda de crédito resta).
 */
export const netTotalsByCurrency = (accounts: Account[]): CurrencyTotal[] => {
  return accounts.reduce<CurrencyTotal[]>((totals, account) => {
    const value = accountValue(account);
    const signed = account.type === "CREDIT" ? -value : value;
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
    const converted = toMxn(accountValue(account), account.currency, usdRate);
    if (converted == null) return null;
    sum += converted;
  }
  return sum;
};

/**
 * Deuda total de las tarjetas de crédito (saldo deudor) convertida a MXN.
 */
export const sumCreditDebtToMxn = (
  accounts: Account[],
  usdRate: number | null
): number | null => {
  let sum = 0;
  for (const account of accounts.filter((entry) => entry.type === "CREDIT")) {
    const converted = toMxn(account.balance, account.currency, usdRate);
    if (converted == null) return null;
    sum += converted;
  }
  return sum;
};
