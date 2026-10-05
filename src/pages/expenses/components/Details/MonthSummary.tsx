import { ExpenseSection } from "@/components/ui/expense-section";
import { computeMonthStats } from "@/lib/dashboardStats";
import { formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import clsx from "clsx";
import { useTransactions } from "../../hooks/useTransactions";
import MonthYearPicker from "../ExpensesHeader/MonthYearPicker";

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={clsx(
          "font-semibold tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MonthSummary() {
  const { transactions } = useTransactions();
  const { month, year } = useExpensesStore((state) => state.monthYear);
  const stats = computeMonthStats(transactions, month, year);

  const savingsRate =
    stats.savingsRate != null ? `${Math.round(stats.savingsRate * 100)}%` : "—";

  return (
    <ExpenseSection className="p-4">
      <h2 className="font-display text-lg">Resumen del mes</h2>
      <MonthYearPicker />

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="font-bold tabular-nums text-positive">{formatMoney(stats.income, "MXN")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gastos</p>
          <p className="font-bold tabular-nums text-negative">{formatMoney(stats.expense, "MXN")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p
            className={clsx(
              "font-bold tabular-nums",
              stats.balance < 0 ? "text-negative" : "text-positive"
            )}
          >
            {formatMoney(stats.balance, "MXN")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <Row label="Tasa de ahorro" value={savingsRate} />
        <Row label="Promedio diario de gasto" value={formatMoney(stats.avgDaily, "MXN")} />
        <Row label="Movimientos del mes" value={String(stats.count)} />
        <Row
          label="Categoría con más gasto"
          value={
            stats.topCategory
              ? `${stats.topCategory.category} · ${formatMoney(stats.topCategory.amount, "MXN")}`
              : "—"
          }
        />
      </div>
    </ExpenseSection>
  );
}

export default MonthSummary;
