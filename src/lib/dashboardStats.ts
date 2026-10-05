import type { Account, Debt, Transaction } from "@/types";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
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
    creditDebtMxn == null || debtTotals == null ? null : creditDebtMxn + debtTotals.payable;
  const netMxn = assetsMxn == null || debtsMxn == null ? null : assetsMxn - debtsMxn;

  return { assetsMxn, debtsMxn, netMxn };
};

export type MonthTopCategory = { category: string; amount: number };

export type MonthStats = {
  income: number;
  expense: number;
  balance: number;
  /** balance / ingresos; null si no hubo ingresos. */
  savingsRate: number | null;
  /** Gasto promedio por día (días transcurridos si es el mes actual). */
  avgDaily: number;
  count: number;
  topCategory: MonthTopCategory | null;
};

/**
 * Estadísticas del mes seleccionado. `today` decide cuántos días se consideran
 * para el promedio diario cuando el mes es el actual.
 */
export const computeMonthStats = (
  transactions: Transaction[],
  month: number,
  year: number,
  today: Date = new Date()
): MonthStats => {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? balance / income : null;

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const elapsedDays = isCurrentMonth ? Math.min(daysInMonth, today.getDate()) : daysInMonth;
  const avgDaily = elapsedDays > 0 ? expense / elapsedDays : 0;

  const byCategory = new Map<string, number>();
  for (const transaction of expenses) {
    byCategory.set(
      transaction.category,
      (byCategory.get(transaction.category) ?? 0) + transaction.amount
    );
  }
  let topCategory: MonthTopCategory | null = null;
  for (const [category, amount] of byCategory) {
    if (!topCategory || amount > topCategory.amount) topCategory = { category, amount };
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
