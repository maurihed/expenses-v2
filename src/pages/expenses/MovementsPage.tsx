import ExpensesHeader from "./components/ExpensesHeader";
import ExpensesList from "./components/ExpensesList";

function MovementsPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <ExpensesHeader />
      <ExpensesList />
    </div>
  );
}

export default MovementsPage;
