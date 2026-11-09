import { sumExpensesToMxn } from "@/lib/expenseTotals";
import { useAccounts } from "./useAccounts";
import { useFxRate } from "./useFxRate";
import { useTransactions } from "./useTransactions";

/**
 * Gasto del mes seleccionado convertido a MXN.
 *
 * Incluye gastos conjuntos y personales. Consulta todas las cuentas (también
 * archivadas) para poder resolver la moneda de movimientos históricos.
 */
export const useMonthlySpending = () => {
  const {
    transactions,
    loading: loadingTransactions,
    error: transactionsError,
  } = useTransactions();
  const {
    accounts,
    loadingAccounts,
    error: accountsError,
  } = useAccounts(true, true);
  const { fx, loadingFx, fxError } = useFxRate();

  const usdRate = fx?.rate ?? null;
  const currencyByAccount = new Map(
    accounts.map((account) => [account.id, account.currency])
  );
  const hasUsdExpenses = transactions.some(
    (transaction) =>
      transaction.type === "expense" &&
      currencyByAccount.get(transaction.accountId) === "USD"
  );

  return {
    transactions,
    accounts,
    loadingAccounts,
    accountsError,
    usdRate,
    loadingFx,
    fxError,
    spentMxn: sumExpensesToMxn(transactions, accounts, usdRate),
    loading: loadingTransactions || loadingAccounts || (hasUsdExpenses && loadingFx),
    error:
      transactionsError ??
      accountsError ??
      (hasUsdExpenses ? fxError : null),
  };
};
