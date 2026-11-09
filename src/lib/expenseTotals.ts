import type { Account, Transaction } from "@/types";
import { toMxn } from "./accountTotals";

/**
 * Suma los gastos convertidos a MXN usando la moneda de la cuenta de cada
 * movimiento (`Transaction.amount` está en la moneda de su cuenta).
 *
 * Devuelve `null` si un gasto pertenece a una cuenta desconocida o a una
 * moneda que no se puede convertir (USD sin tasa), para no mostrar un total
 * silenciosamente incorrecto.
 */
export const sumExpensesToMxn = (
  transactions: Transaction[],
  accounts: Account[],
  usdRate: number | null
): number | null => {
  const currencyByAccount = new Map(
    accounts.map((account) => [account.id, account.currency])
  );

  let sum = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;

    const currency = currencyByAccount.get(transaction.accountId);
    if (currency == null) return null;

    const converted = toMxn(transaction.amount, currency, usdRate);
    if (converted == null) return null;
    sum += converted;
  }

  return sum;
};
