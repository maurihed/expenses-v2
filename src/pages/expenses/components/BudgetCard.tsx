import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { formatMoney, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import clsx from "clsx";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useBudget } from "../hooks/useBudget";
import { useTransactions } from "../hooks/useTransactions";
import BudgetDrawer from "./BudgetDrawer";

function BudgetCard() {
  const { transactions } = useTransactions();
  const { month, year } = useExpensesStore((state) => state.monthYear);
  const { budget, loadingBudget, budgetError, refreshBudget } = useBudget(year, month);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const spentThisMonth = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const budgetAmount = budget && budget.amount > 0 ? budget.amount : null;
  const budgetRemaining = budgetAmount != null ? budgetAmount - spentThisMonth : null;
  const budgetProgress =
    budgetAmount && budgetAmount > 0 ? Math.min(100, (spentThisMonth / budgetAmount) * 100) : 0;

  return (
    <>
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
                <p className="font-bold tabular-nums">{formatMoney(spentThisMonth, "MXN")}</p>
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

      <BudgetDrawer
        open={budgetOpen}
        year={year}
        month={month}
        current={budgetAmount}
        onClose={() => setBudgetOpen(false)}
      />
    </>
  );
}

export default BudgetCard;
