import { ExpenseSection } from "@/components/ui/expense-section";
import BudgetCard from "./components/BudgetCard";
import ExpensesHeader from "./components/ExpensesHeader";
import ExpensesList from "./components/ExpensesList";
import TopExpenses from "./components/TopExpenses";

function HomePage() {
  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <ExpensesHeader />
      <BudgetCard />
      <ExpenseSection className="p-4">
        <h2 className="font-display text-lg">Gastos por categoría</h2>
        <TopExpenses />
      </ExpenseSection>
      <ExpensesList />
    </div>
  );
}

export default HomePage;
