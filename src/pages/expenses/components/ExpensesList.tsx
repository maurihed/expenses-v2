import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Loader } from "@/components/ui/loader";
import { ExpenseSection } from "@/components/ui/expense-section";
import { formatDate, formatTransactionDate } from "@/lib/DateUtils";
import { formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Transaction } from "@/types";
import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { usePersons } from "../hooks/usePersons";
import { useTransactions } from "../hooks/useTransactions";
import ExpensesFilters from "./ExpensesFilters";

function ExpensesList() {
  const { transactions, loading, error, refetch } = useTransactions();
  const { accounts } = useAccounts(false);
  const hasPersonal = transactions.some(
    (transaction) => transaction.type !== "transfer" && transaction.scope === "personal"
  );
  const { persons } = usePersons(hasPersonal);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(new Set<string>());
  const openEditTransactionModal = useExpensesStore((state) => state.openEditTransactionModal);

  const cleanFilters = () => {
    setSearch("");
    setCategories(new Set());
  };

  if (loading) {
    return <ExpenseSection><Loader /></ExpenseSection>;
  }

  if (error) {
    return (
      <ExpenseSection>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-destructive">Error al cargar transacciones</p>
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </ExpenseSection>
    );
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

  const getPersonName = (personId?: string | null) => {
    if (!personId) return "";
    return persons.find((person) => person.id === personId)?.name ?? "";
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
            <Button size="sm" onClick={cleanFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
        {Object.entries(transformedTransactions).map(([_date, _transactions]) => (
          <div key={_date}>
            <h3 className="text-left mb-4">
              <span className="font-bold">{formatTransactionDate(_date)}</span>
              <span className="text-slate-600 dark:text-slate-400 text-sm ml-2">
                {getTotalExpenses(_transactions)}
              </span>
            </h3>
            <ul className="flex flex-col gap-4">
              {_transactions.map((transaction) => {
                const isTransfer = transaction.type === "transfer";
                const destinationName = transaction.toAccountId
                  ? getAccountName(transaction.toAccountId)
                  : "";
                const personName =
                  !isTransfer && transaction.scope === "personal"
                    ? getPersonName(transaction.personId)
                    : "";
                const subtitle = isTransfer
                  ? destinationName
                    ? `Transferencia | ${destinationName}`
                    : "Transferencia"
                  : personName
                    ? `${transaction.category} | ${getAccountName(transaction.accountId)} · Personal: ${personName}`
                    : `${transaction.category} | ${getAccountName(transaction.accountId)}`;
                return (
                  <li
                    className="flex items-center justify-between gap-4 cursor-pointer"
                    key={transaction.id}
                    onClick={() => openEditTransactionModal(transaction)}
                  >
                    {isTransfer ? (
                      <span className="rounded-full p-2 flex items-center justify-center w-10 h-10 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        <ArrowLeftRight size={24} />
                      </span>
                    ) : (
                      <CategoryIcon category={transaction.category} />
                    )}
                    <div className="grow min-w-0 grid grid-cols-1">
                      <p className="font-bold truncate">{transaction.description}</p>
                      <p className="text-slate-600 dark:text-slate-400 truncate" title={subtitle}>
                        {subtitle}
                      </p>
                    </div>

                    <span
                      className={clsx({
                        ["text-red-500"]: transaction.type === "expense",
                        ["text-green-500"]: transaction.type === "income",
                        ["text-muted-foreground"]: isTransfer,
                      })}
                    >
                      {transaction.type === "expense"
                        ? "-"
                        : transaction.type === "income"
                          ? "+"
                          : ""}
                      {formatMoney(transaction.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </ExpenseSection>
    </>
  );
}

export default ExpensesList;
