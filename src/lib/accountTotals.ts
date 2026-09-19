import type { Account, Currency } from "@/types";

/**
 * Suma los saldos de las cuentas agrupados por moneda.
 * Regla: efectivo + débito + inversión − crédito (la deuda de crédito resta).
 */
export const netTotalsByCurrency = (
  accounts: Account[]
): { currency: Currency; total: number }[] => {
  return accounts.reduce<{ currency: Currency; total: number }[]>((totals, account) => {
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
