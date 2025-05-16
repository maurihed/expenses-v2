import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpenseSection } from "@/components/ui/expense-section";
import { formatDate, formatTransactionDate } from "@/lib/DateUtils";
import { formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Transaction } from "@/types";
import clsx from "clsx";
import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactions } from "../hooks/useTransactions";
import ExpensesFilters from "./ExpensesFilters";

function ExpensesList() {
  const { transactions, loading, error } = useTransactions();
  const { accounts } = useAccounts(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(new Set<string>());
  const openEditTransactionModal = useExpensesStore((state) => state.openEditTransactionModal);

  const cleanFilters = () => {
    setSearch("");
    setCategories(new Set());
  };

  if (loading) {
    return <ExpenseSection>Cargando transacciones...</ExpenseSection>;
  }

  if (error) {
    return <ExpenseSection>Error al cargar transacciones</ExpenseSection>;
  }
  if (transactions.length === 0) {
    return (
      <ExpenseSection>
        <p>No hay transacciones disponibles</p>
      </ExpenseSection>
    );
  }

  // handle Filters
  let filteredTransactions = transactions;
  if (search) {
    filteredTransactions = transactions.filter((transaction) =>
      transaction.description?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (categories.size > 0) {
    filteredTransactions = filteredTransactions.filter((transaction) =>
      categories.has(transaction.category)
    );
  }

  const transformedTransactions: { [key: string]: Transaction[] } = {};
  filteredTransactions.forEach((transaction) => {
    const date = formatDate(transaction.date);
    if (!transformedTransactions[date]) {
      transformedTransactions[date] = [];
    }
    transformedTransactions[date].push(transaction);
  });

  const getTotalExpenses = (transactions: Transaction[]) => {
    const total = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    return formatMoney(total);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((account) => account.id === accountId);
    return account?.name ?? "Pendiente";
  };

  return (
    <>
      <ExpensesFilters
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        onCategorySelected={setCategories}
      />

      <ExpenseSection className="p-4">
        {!filteredTransactions.length && (
          <div className="flex flex-col justify-center gap-4 p-8">
            <p className="text-center">
              No hay transacciones que cumplan con la busqueda, intenta
            </p>
            <Button className="border-b border-white" size="sm" onClick={cleanFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
        {Object.entries(transformedTransactions).map(([_date, _transactions]) => (
          <div key={_date}>
            <h3 className="text-left mb-4">
              <span className="font-bold">{formatTransactionDate(_date)}</span>
              <span className="text-slate-400 text-sm ml-2">
                {getTotalExpenses(_transactions)}
              </span>
            </h3>
            <ul className="flex flex-col gap-4">
              {_transactions.map((transaction) => (
                <li
                  className="flex items-center justify-between gap-4"
                  key={transaction.id}
                  onClick={() => openEditTransactionModal(transaction)}
                >
                  <CategoryIcon category={transaction.category} />
                  <div className="grow grid grid-cols-1">
                    <p className="font-bold">{transaction.description}</p>
                    <p className="text-slate-400">
                      {transaction.category} | {getAccountName(transaction.accountId)}
                    </p>
                  </div>

                  <span
                    className={clsx({
                      ["text-red-500"]: transaction.type === "expense",
                      ["text-green-500"]: transaction.type === "income",
                    })}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatMoney(transaction.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </ExpenseSection>
    </>
  );
}

export default ExpensesList;
