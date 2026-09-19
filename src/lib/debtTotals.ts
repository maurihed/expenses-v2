import type { Debt } from "@/types";
import { toMxn } from "./accountTotals";

export type DebtTotals = { payable: number; receivable: number };

/**
 * Suma el pendiente de las deudas por tipo, convertido a MXN.
 * Devuelve null si alguna deuda en USD no puede convertirse (falta la tasa).
 */
export const debtTotalsToMxn = (debts: Debt[], usdRate: number | null): DebtTotals | null => {
  let payable = 0;
  let receivable = 0;

  for (const debt of debts) {
    const remaining = Math.max(0, debt.amount - debt.paid);
    const converted = toMxn(remaining, debt.currency, usdRate);
    if (converted == null) return null;
    if (debt.type === "payable") {
      payable += converted;
    } else {
      receivable += converted;
    }
  }

  return { payable, receivable };
};
