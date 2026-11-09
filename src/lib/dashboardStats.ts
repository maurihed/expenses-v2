import type { Account, Debt, Transaction } from "@/types";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
  toMxn,
} from "./accountTotals";
import { debtTotalsToMxn } from "./debtTotals";

export type Patrimony = {
  /** Activos: dinero total (efectivo + débito + inversión) en MXN. */
  assetsMxn: number | null;
  /** Deudas: crédito + deudas por pagar, en MXN. */
  debtsMxn: number | null;
  /** Patrimonio neto = activos − deudas. */
  netMxn: number | null;
};

/**
 * Patrimonio neto a partir de las cuentas y las deudas. Devuelve `null` en
 * cualquier componente que no se pueda convertir (falta la tasa USD).
 */
export const computePatrimony = (
  accounts: Account[],
  debts: Debt[],
  usdRate: number | null
): Patrimony => {
  const assetsMxn = convertTotalsToMxn(netTotalsByCurrency(accounts), usdRate);
  const creditDebtMxn = sumCreditDebtToMxn(accounts, usdRate);
  const debtTotals = debtTotalsToMxn(debts, usdRate);

  const debtsMxn =
    creditDebtMxn == null || debtTotals.payable == null
      ? null
      : creditDebtMxn + debtTotals.payable;
  const netMxn = assetsMxn == null || debtsMxn == null ? null : assetsMxn - debtsMxn;

  return { assetsMxn, debtsMxn, netMxn };
};

export type MonthTopCategory = { category: string; amount: number };

export type MonthStats = {
  income: number | null;
  expense: number | null;
  balance: number | null;
  /** balance / ingresos; null si no hubo ingresos o falta una conversión. */
  savingsRate: number | null;
  /** Gasto promedio por día (días transcurridos si es el mes actual). */
  avgDaily: number | null;
  count: number;
  topCategory: MonthTopCategory | null;
};

/**
 * Estadísticas del mes seleccionado. `today` decide cuántos días se consideran
 * para el promedio diario cuando el mes es el actual.
 *
 * Cuando se pasan `accounts` y `usdRate`, los montos se convierten a MXN según
 * la moneda de la cuenta de cada movimiento. Si falta una conversión, los
 * totales afectados quedan en `null` para no mostrar cifras incorrectas.
 */
export const computeMonthStats = (
  transactions: Transaction[],
  month: number,
  year: number,
  today: Date = new Date(),
  accounts?: Account[],
  usdRate: number | null = null
): MonthStats => {
  const currencyByAccount = accounts
    ? new Map(accounts.map((account) => [account.id, account.currency]))
    : null;

  const convert = (transaction: Transaction): number | null => {
    if (!currencyByAccount) return transaction.amount;
    const currency = currencyByAccount.get(transaction.accountId);
    if (currency == null) return null;
    return toMxn(transaction.amount, currency, usdRate);
  };

  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const incomes = transactions.filter((transaction) => transaction.type === "income");

  const sumAmounts = (items: Transaction[]): number | null => {
    let sum = 0;
    for (const transaction of items) {
      const converted = convert(transaction);
      if (converted == null) return null;
      sum += converted;
    }
    return sum;
  };

  const income = sumAmounts(incomes);
  const expense = sumAmounts(expenses);
  const balance = income != null && expense != null ? income - expense : null;
  const savingsRate = income != null && income > 0 && balance != null ? balance / income : null;

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const elapsedDays = isCurrentMonth ? Math.min(daysInMonth, today.getDate()) : daysInMonth;
  const avgDaily = expense != null && elapsedDays > 0 ? expense / elapsedDays : null;

  let byCategory: Map<string, number> | null = new Map();
  for (const transaction of expenses) {
    const converted = convert(transaction);
    if (converted == null) {
      byCategory = null;
      break;
    }
    byCategory.set(
      transaction.category,
      (byCategory.get(transaction.category) ?? 0) + converted
    );
  }
  let topCategory: MonthTopCategory | null = null;
  if (byCategory) {
    for (const [category, amount] of byCategory) {
      if (!topCategory || amount > topCategory.amount) topCategory = { category, amount };
    }
  }

  return {
    income,
    expense,
    balance,
    savingsRate,
    avgDaily,
    count: transactions.length,
    topCategory,
  };
};
