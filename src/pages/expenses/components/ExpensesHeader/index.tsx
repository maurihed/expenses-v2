import { formatMoney } from "@/lib/utils";
import { useTransactions } from "../../hooks/useTransactions";
import MonthYearPicker from "./MonthYearPicker";

function ExpensesHeader() {
  const { transactions } = useTransactions(false);

  const total = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div className="text-center bg-card rounded-b-lg pb-4">
      <MonthYearPicker />
      <p className="text-slate-600 dark:text-slate-300">Total Gastado</p>
      <p className="text-3xl font-bold">{formatMoney(total)}</p>
    </div>
  );
}

export default ExpensesHeader;
