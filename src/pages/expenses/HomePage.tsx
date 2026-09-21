import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
  sumInvestments,
} from "@/lib/accountTotals";
import { debtTotalsToMxn } from "@/lib/debtTotals";
import { formatMoney, getDateString, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import clsx from "clsx";
import { ArrowRight, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import BudgetDrawer from "./components/BudgetDrawer";
import { useAccounts } from "./hooks/useAccounts";
import { useBudget } from "./hooks/useBudget";
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
  const { budget, loadingBudget, budgetError, refreshBudget } = useBudget(year, month);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const usdRate = fx?.rate ?? null;
  const totals = netTotalsByCurrency(accounts);
  const totalMxn = convertTotalsToMxn(totals, usdRate);
  const investmentAccounts = accounts.filter((account) => account.type === "INVESTMENT");
  const investmentsMxn = sumInvestments(accounts, usdRate);
  const creditDebtMxn = sumCreditDebtToMxn(accounts, usdRate);
  const debtTotals = debtTotalsToMxn(debts, usdRate);
  const debtActual =
    creditDebtMxn != null && debtTotals != null ? creditDebtMxn + debtTotals.payable : null;
  const hasForeign = totals.some((entry) => entry.currency !== "MXN");

  const spentThisMonth = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const budgetAmount = budget && budget.amount > 0 ? budget.amount : null;
  const budgetRemaining = budgetAmount != null ? budgetAmount - spentThisMonth : null;
  const budgetProgress =
    budgetAmount && budgetAmount > 0
      ? Math.min(100, (spentThisMonth / budgetAmount) * 100)
      : 0;

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
          <p className="text-sm text-muted-foreground">Deuda actual</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {debtActual != null ? formatMoney(debtActual, "MXN") : "—"}
          </p>
          {creditDebtMxn != null && debtTotals != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Crédito {formatMoney(creditDebtMxn, "MXN")} · Por pagar{" "}
              {formatMoney(debtTotals.payable, "MXN")}
            </p>
          )}
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg">Presupuesto de {getMonthName(month)}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            aria-label="Definir presupuesto"
            onClick={() => setBudgetOpen(true)}
          >
            <Pencil />
          </Button>
        </div>

        {loadingBudget ? (
          <div className="py-4">
            <Loader />
          </div>
        ) : budgetError ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-destructive">Error al cargar el presupuesto</p>
            <Button variant="outline" className="cursor-pointer" onClick={() => refreshBudget()}>
              Reintentar
            </Button>
          </div>
        ) : budgetAmount == null ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Aún no defines un presupuesto para este mes.
            </p>
            <Button className="cursor-pointer" onClick={() => setBudgetOpen(true)}>
              Definir presupuesto
            </Button>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Gastado</p>
                <p className="font-bold tabular-nums">
                  {formatMoney(spentThisMonth, "MXN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {budgetRemaining != null && budgetRemaining < 0 ? "Excedido" : "Disponible"}
                </p>
                <p
                  className={clsx("font-bold tabular-nums", {
                    "text-destructive": budgetRemaining != null && budgetRemaining < 0,
                  })}
                >
                  {formatMoney(Math.abs(budgetRemaining ?? 0), "MXN")}
                </p>
              </div>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(budgetProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={clsx("h-full rounded-full", {
                  "bg-primary": budgetRemaining != null && budgetRemaining >= 0,
                  "bg-destructive": budgetRemaining != null && budgetRemaining < 0,
                })}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Presupuesto {formatMoney(budgetAmount, "MXN")}
            </p>
          </div>
        )}
      </ExpenseSection>

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
                    "text-negative": transaction.type === "expense",
                    "text-positive": transaction.type === "income",
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

      <BudgetDrawer
        open={budgetOpen}
        year={year}
        month={month}
        current={budgetAmount}
        onClose={() => setBudgetOpen(false)}
      />
    </div>
  );
}

export default HomePage;
