import AccountService from "@/services/AccountService";
import type { Account } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useAccounts = (enabled = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<Account[]>(
    "accounts",
    AccountService.getAccounts,
    {
      staleTime: Infinity, // Disable background fetching
      enabled,
    }
  );

  const { mutate: updateAccountBalance } = useMutation(AccountService.updateAccountBalance, {
    onSuccess: (updatedAccount: Account) => {
      queryClient.setQueryData<Account[]>(
        "accounts",
        (preAccounts) =>
          preAccounts?.map((prevAccount) =>
            prevAccount.id === updatedAccount.id ? { ...updatedAccount } : prevAccount
          ) ?? []
      );
    },
  });

  return {
    accounts: data || [],
    loadingAccounts: isLoading,
    error,
    updateAccountBalance,
    refreshAccounts: refetch,
  };
};
