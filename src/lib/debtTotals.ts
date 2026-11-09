import type { Debt } from "@/types";
import { toMxn } from "./accountTotals";

/**
 * Totales independientes por tipo. Cada lado es `null` únicamente si alguna
 * deuda de ese tipo no se puede convertir (p. ej. USD sin tasa), de modo que
 * una deuda por cobrar incomvertible no oculta la deuda por pagar.
 */
export type DebtTotals = { payable: number | null; receivable: number | null };

/**
 * Suma el pendiente de las deudas por tipo, convertido a MXN.
 */
export const debtTotalsToMxn = (debts: Debt[], usdRate: number | null): DebtTotals => {
  let payable = 0;
  let receivable = 0;
  let payableConvertible = true;
  let receivableConvertible = true;

  for (const debt of debts) {
    const converted = toMxn(debt.remaining, debt.currency, usdRate);
    if (debt.type === "payable") {
      if (converted == null) {
        payableConvertible = false;
      } else {
        payable += converted;
      }
    } else if (converted == null) {
      receivableConvertible = false;
    } else {
      receivable += converted;
    }
  }

  return {
    payable: payableConvertible ? payable : null,
    receivable: receivableConvertible ? receivable : null,
  };
};
