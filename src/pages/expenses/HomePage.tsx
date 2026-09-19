import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpenseSection } from "@/components/ui/expense-section";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumInvestments,
} from "@/lib/accountTotals";
import { debtTotalsToMxn } from "@/lib/debtTotals";
import { formatMoney, getDateString, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAccounts } from "./hooks/useAccounts";
import { useDebts } from "./hooks/useDebts";
import { useFxRate } from "./hooks/useFxRate";
import { useTransactions } from "./hooks/useTransactions";
import TopExpenses from "./components/TopExpenses";

function HomePage() {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { debts } = useDebts();
  const { fx } = useFxRate();
  const { month, year } = useExpensesStore((state) => state.monthYear);

  const usdRate = fx?.rate ?? null;
  const totals = netTotalsByCurrency(accounts);
  const totalMxn = convertTotalsToMxn(totals, usdRate);
  const investmentAccounts = accounts.filter((account) => account.type === "INVESTMENT");
  const investmentsMxn = sumInvestments(accounts, usdRate);
  const debtTotals = debtTotalsToMxn(debts, usdRate);
  const hasForeign = totals.some((entry) => entry.currency !== "MXN");

  const spentThisMonth = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const recent = transactions.slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExpenseSection className="p-4">
          <p className="text-sm text-muted-foreground">Dinero total</p>
          {totalMxn != null ? (
            <>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatMoney(totalMxn, "MXN")}
              </p>
              {hasForeign && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {totals
                    .map(({ currency, total }) => formatMoney(total, currency))
                    .join(" · ")}
                </p>
              )}
            </>
          ) : (
            <div className="mt-1">
              {totals.length === 0 ? (
                <p className="text-2xl font-bold tabular-nums">{formatMoney(0, "MXN")}</p>
              ) : (
                totals.map(({ currency, total }) => (
                  <p key={currency} className="text-2xl font-bold tabular-nums">
                    {formatMoney(total, currency)}
                  </p>
                ))
              )}
            </div>
          )}
          {fx && (
            <p className="mt-2 text-xs text-muted-foreground">
              1 USD = {formatMoney(fx.rate, "MXN")}
              {fx.stale ? " (en caché)" : ""} · {getDateString(new Date(fx.fetchedAt))}
            </p>
          )}
        </ExpenseSection>

        <ExpenseSection className="p-4">
          <p className="text-sm text-muted-foreground">Inversiones</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {investmentAccounts.length === 0
              ? "—"
              : investmentsMxn != null
                ? formatMoney(investmentsMxn, "MXN")
                : "—"}
          </p>
        </ExpenseSection>

        <ExpenseSection className="p-4">
          <p className="text-sm text-muted-foreground">Deudas por pagar</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {debtTotals != null ? formatMoney(debtTotals.payable, "MXN") : "—"}
          </p>
          {debtTotals != null && debtTotals.receivable > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Por cobrar: {formatMoney(debtTotals.receivable, "MXN")}
            </p>
          )}
        </ExpenseSection>

        <ExpenseSection className="p-4">
          <p className="text-sm text-muted-foreground">
            Gastado en {getMonthName(month)} {year}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(spentThisMonth)}</p>
        </ExpenseSection>
      </div>

      <ExpenseSection className="p-4">
        <h2 className="font-display text-lg">Gastos por categoría</h2>
        <TopExpenses />
      </ExpenseSection>

      <ExpenseSection className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg">Movimientos recientes</h2>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => navigate("/movimientos")}
          >
            Ver todos
            <ArrowRight />
          </Button>
        </div>

        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay movimientos este mes.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {recent.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-3">
                {transaction.type === "transfer" ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </span>
                ) : (
                  <CategoryIcon category={transaction.category} />
                )}
                <div className="min-w-0 grow">
                  <p className="truncate font-semibold">{transaction.description}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {getDateString(transaction.date)}
                  </p>
                </div>
                <span
                  className={clsx("shrink-0 tabular-nums", {
                    "text-red-500": transaction.type === "expense",
                    "text-green-500": transaction.type === "income",
                    "text-muted-foreground": transaction.type === "transfer",
                  })}
                >
                  {transaction.type === "expense" ? "-" : transaction.type === "income" ? "+" : ""}
                  {formatMoney(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ExpenseSection>
    </div>
  );
}

export default HomePage;
