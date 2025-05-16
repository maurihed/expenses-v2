import TransactionService from "@/services/TransactionService";
import { useExpensesStore } from "@/stores/expenses.store";
import type { MonthYearType, Transaction } from "@/types";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useAccounts } from "./useAccounts";

export const useTransactions = (enabled = true) => {
  const { month, year } = useExpensesStore((state) => state.monthYear) as MonthYearType;
  const { refreshAccounts } = useAccounts(false);

  const getTransactions = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("month", month.toString());
    searchParams.set("year", year.toString());
    return async () => await TransactionService.getTransactions(searchParams);
  }, [month, year]);

  const queryId = ["transactions", month, year];
  const queryClient = useQueryClient();
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery(queryId, getTransactions, {
    staleTime: Infinity,
    enabled,
  });

  const { mutate: newTransaction, isLoading: newTransactionLoading } = useMutation(
    TransactionService.addTransaction,
    {
      onSuccess: (addedTransaction: Transaction) => {
        queryClient.setQueryData<Transaction[]>(queryId, (prevTransactions) => [
          addedTransaction,
          ...(prevTransactions ?? []),
        ]);
        refreshAccounts();
      },
    }
  );

  const { mutate: editTransaction, isLoading: editTransactionLoading } = useMutation(
    TransactionService.editTransaction,
    {
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
        refreshAccounts();
      },
    }
  );

  const { mutate: deleteTransaction, isLoading: isDeleting } = useMutation(
    TransactionService.deleteTransaction,
    {
      onSuccess: (id) => {
        queryClient.setQueryData<Transaction[]>(
          queryId,
          (prevTransactions) =>
            prevTransactions?.filter((transaction) => transaction.id !== id) ?? []
        );
        refreshAccounts();
      },
    }
  );

  return {
    transactions: transactions || [],
    loading: isLoading,
    isDeleting,
    mutationLoading: newTransactionLoading || editTransactionLoading,
    error,
    newTransaction,
    editTransaction,
    deleteTransaction,
  };
};
