import { Button } from "@/components/ui/button";
import { computeMonthStats } from "@/lib/dashboardStats";
import { formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import { Tags } from "lucide-react";
import { useNavigate } from "react-router";
import { useMonthlySpending } from "../../hooks/useMonthlySpending";
import MonthYearPicker from "./MonthYearPicker";

function ExpensesHeader() {
  const navigate = useNavigate();
  const { transactions, accounts, usdRate } = useMonthlySpending();
  const { month, year } = useExpensesStore((state) => state.monthYear);
  const { income, expense, balance } = computeMonthStats(
    transactions,
    month,
    year,
    new Date(),
    accounts,
    usdRate
  );

  const money = (value: number | null) => (value != null ? formatMoney(value, "MXN") : "—");

  return (
    <div className="brand-gradient brand-glow relative overflow-hidden rounded-3xl px-4 pb-6 pt-4 text-center text-white">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 cursor-pointer text-white hover:bg-white/15 hover:text-white"
        aria-label="Administrar categorías"
        onClick={() => navigate("/categorias")}
      >
        <Tags />
      </Button>
      <MonthYearPicker inverted />
      <p className="mt-2 text-sm text-white/80">Total gastado</p>
      <p className="font-display text-4xl font-bold tabular-nums">{money(expense)}</p>
      <p className="mt-1 text-xs text-white/80 tabular-nums">
        Ingresos {money(income)} · Balance {money(balance)}
      </p>
    </div>
  );
}

export default ExpensesHeader;
