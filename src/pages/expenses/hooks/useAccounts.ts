import AccountService from "@/services/AccountService";
import type { Account } from "@/types";
import { useQuery } from "react-query";

export const useAccounts = (enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery<Account[]>(
    "accounts",
    AccountService.getAccounts,
    {
      staleTime: Infinity, // Disable background fetching
      enabled,
    }
  );

  return {
    accounts: data || [],
    loadingAccounts: isLoading,
    error,
    refreshAccounts: refetch,
  };
};
