import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpenseSection } from "@/components/ui/expense-section";
import { netTotalsByCurrency } from "@/lib/accountTotals";
import { formatMoney, getDateString, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAccounts } from "./hooks/useAccounts";
import { useTransactions } from "./hooks/useTransactions";
import TopExpenses from "./components/TopExpenses";

function HomePage() {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { month, year } = useExpensesStore((state) => state.monthYear);

  const totals = netTotalsByCurrency(accounts);
  const spentThisMonth = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const recent = transactions.slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ExpenseSection className="p-4">
          <p className="text-sm text-muted-foreground">Dinero total</p>
          {totals.length === 0 ? (
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(0, "MXN")}</p>
          ) : (
            totals.map(({ currency, total }) => (
              <p key={currency} className="mt-1 text-2xl font-bold tabular-nums">
                {formatMoney(total, currency)}
              </p>
            ))
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
