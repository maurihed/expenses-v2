import TransactionService from "@/services/TransactionService";
import { useExpensesStore } from "@/stores/expenses.store";
import type { MonthYearType, Transaction } from "@/types";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useTransactions = (enabled = true) => {
  const { month, year } = useExpensesStore((state) => state.monthYear) as MonthYearType;

  const getTransactions = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("month", month.toString());
    searchParams.set("year", year.toString());
    return async () => await TransactionService.getTransactions(searchParams);
  }, [month, year]);

  const queryId = ["transactions", month, year];
  const queryClient = useQueryClient();

  const invalidateTransactionData = () => {
    queryClient.invalidateQueries(queryId);
    queryClient.invalidateQueries(["accounts"]);
    queryClient.invalidateQueries(["persons"]);
    queryClient.invalidateQueries(["person-summary"]);
    // MSI purchases change the committed installments shown in credit summary.
    queryClient.invalidateQueries(["credit-summary"]);
  };
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery(queryId, getTransactions, {
    staleTime: Infinity,
    enabled,
  });

  const {
    mutate: newTransaction,
    isLoading: newTransactionLoading,
    error: newTransactionError,
  } = useMutation<Transaction, Error, Transaction>(TransactionService.addTransaction, {
    onSuccess: (addedTransaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(queryId, (prevTransactions) => [
        addedTransaction,
        ...(prevTransactions ?? []),
      ]);
      invalidateTransactionData();
    },
  });

  const {
    mutate: editTransaction,
    isLoading: editTransactionLoading,
    error: editTransactionError,
  } = useMutation<
    Transaction,
    Error,
    { transactionToEdit: Transaction; transactionEdited: Transaction }
  >(TransactionService.editTransaction, {
    onSuccess: (editedTransaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(
        queryId,
        (prevTransactions) =>
          prevTransactions?.map((prevTransaction) =>
            prevTransaction.id === editedTransaction.id
              ? { ...editedTransaction }
              : prevTransaction
          ) ?? []
      );
      invalidateTransactionData();
    },
  });

  const {
    mutate: deleteTransaction,
    isLoading: isDeleting,
    error: deleteTransactionError,
  } = useMutation<string, Error, Transaction>(TransactionService.deleteTransaction, {
    onSuccess: (id) => {
      queryClient.setQueryData<Transaction[]>(
        queryId,
        (prevTransactions) =>
          prevTransactions?.filter((transaction) => transaction.id !== id) ?? []
      );
      invalidateTransactionData();
    },
  });

  return {
    transactions: transactions || [],
    loading: isLoading,
    isDeleting,
    mutationLoading: newTransactionLoading || editTransactionLoading,
    error,
    newTransactionError,
    editTransactionError,
    deleteTransactionError,
    transactionMutationError: newTransactionError ?? editTransactionError,
    refetch,
    newTransaction,
    editTransaction,
    deleteTransaction,
  };
};
