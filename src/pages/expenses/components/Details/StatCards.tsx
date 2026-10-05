import { ExpenseSection } from "@/components/ui/expense-section";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
  sumInvestments,
} from "@/lib/accountTotals";
import { debtTotalsToMxn } from "@/lib/debtTotals";
import { formatMoney, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { ReactNode } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import { useDebts } from "../../hooks/useDebts";
import { useFxRate } from "../../hooks/useFxRate";
import { useTransactions } from "../../hooks/useTransactions";
import CreditPeriodTotal from "./CreditPeriodTotal";

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <ExpenseSection className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {children && <div className="mt-1 flex flex-col gap-0.5">{children}</div>}
    </ExpenseSection>
  );
}

function StatCards() {
  const { accounts } = useAccounts();
  const { debts } = useDebts();
  const { fx } = useFxRate();
  const { transactions } = useTransactions();
  const { month, year } = useExpensesStore((state) => state.monthYear);
  const usdRate = fx?.rate ?? null;

  const totals = netTotalsByCurrency(accounts);
  const totalMxn = convertTotalsToMxn(totals, usdRate);
  const hasForeign = totals.some((entry) => entry.currency !== "MXN");
  const perCurrency = totals.map(({ currency, total }) => formatMoney(total, currency)).join(" · ");

  const investmentAccounts = accounts.filter((account) => account.type === "INVESTMENT");
  const investmentsMxn = sumInvestments(accounts, usdRate);

  const creditDebtMxn = sumCreditDebtToMxn(accounts, usdRate);
  const debtTotals = debtTotalsToMxn(debts, usdRate);
  const debtActual =
    creditDebtMxn != null && debtTotals != null ? creditDebtMxn + debtTotals.payable : null;

  const spentThisMonth = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Dinero total"
        value={totalMxn != null ? formatMoney(totalMxn, "MXN") : "—"}
      >
        {totalMxn != null
          ? hasForeign && <span className="text-xs text-muted-foreground tabular-nums">{perCurrency}</span>
          : totals.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{perCurrency}</span>
            )}
      </StatCard>

      <StatCard
        label="Inversiones"
        value={
          investmentAccounts.length === 0
            ? "—"
            : investmentsMxn != null
              ? formatMoney(investmentsMxn, "MXN")
              : "—"
        }
      >
        <span className="text-xs text-muted-foreground">
          {investmentAccounts.length === 0
            ? "Sin cuentas de inversión"
            : `${investmentAccounts.length} cuenta${investmentAccounts.length === 1 ? "" : "s"}`}
        </span>
      </StatCard>

      <StatCard
        label="Deuda actual"
        value={debtActual != null ? formatMoney(debtActual, "MXN") : "—"}
      >
        {creditDebtMxn != null && debtTotals != null && (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              Crédito {formatMoney(creditDebtMxn, "MXN")} · Por pagar{" "}
              {formatMoney(debtTotals.payable, "MXN")}
            </span>
            {debtTotals.receivable > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                Por cobrar {formatMoney(debtTotals.receivable, "MXN")}
              </span>
            )}
            <CreditPeriodTotal accounts={accounts} />
          </>
        )}
      </StatCard>

      <StatCard
        label={`Gastado en ${getMonthName(month)}`}
        value={formatMoney(spentThisMonth, "MXN")}
      >
        <span className="text-xs text-muted-foreground tabular-nums">{year}</span>
      </StatCard>
    </div>
  );
}

export default StatCards;
