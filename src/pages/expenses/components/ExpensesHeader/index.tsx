import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { Tags } from "lucide-react";
import { useNavigate } from "react-router";
import { useTransactions } from "../../hooks/useTransactions";
import MonthYearPicker from "./MonthYearPicker";

function ExpensesHeader() {
  const navigate = useNavigate();
  const { transactions } = useTransactions(false);

  const { income, expense } = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "expense") acc.expense += transaction.amount;
      if (transaction.type === "income") acc.income += transaction.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

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
      <p className="font-display text-4xl font-bold tabular-nums">{formatMoney(expense)}</p>
      <p className="mt-1 text-xs text-white/80 tabular-nums">
        Ingresos {formatMoney(income)} · Balance {formatMoney(income - expense)}
      </p>
    </div>
  );
}

export default ExpensesHeader;
