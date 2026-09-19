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
    <div className="relative text-center bg-card rounded-b-lg pb-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 cursor-pointer"
        aria-label="Administrar categorías"
        onClick={() => navigate("/categorias")}
      >
        <Tags />
      </Button>
      <MonthYearPicker />
      <p className="text-slate-600 dark:text-slate-300">Total Gastado</p>
      <p className="text-3xl font-bold">{formatMoney(total)}</p>
    </div>
  );
}

export default ExpensesHeader;
