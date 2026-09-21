import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { Tags } from "lucide-react";
import { useNavigate } from "react-router";
import { useTransactions } from "../../hooks/useTransactions";
import MonthYearPicker from "./MonthYearPicker";

function ExpensesHeader() {
  const navigate = useNavigate();
  const { transactions } = useTransactions(false);

  const total = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, cur) => acc + cur.amount, 0);

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
      <p className="font-display text-4xl font-bold tabular-nums">{formatMoney(total)}</p>
    </div>
  );
}

export default ExpensesHeader;
