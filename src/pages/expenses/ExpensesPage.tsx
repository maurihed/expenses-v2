import AccountList from "./components/AccountList";
import ExpensesHeader from "./components/ExpensesHeader";
import ExpensesList from "./components/ExpensesList";
import ExpensesTrend from "./components/ExpensesTrend";
import TopExpenses from "./components/TopExpenses";
import TransactionModal from "./components/TransactionModal";

function ExpensesPage() {
  // const { year, month } = useExpensesStore((state) => state.monthYear);

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        <ExpensesHeader />
        <h2 className="text-xl">Cuentas</h2>
        <AccountList />
        <h2 className="text-xl">5 Categorias con mas gastos</h2>
        <TopExpenses />
        <h2 className="text-xl">Tendencia de gastos</h2>
        <ExpensesTrend />
        <h2 className="text-xl">Transacciones</h2>
        <ExpensesList />
      </div>
      <TransactionModal />
    </>
  );
}

export default ExpensesPage;
