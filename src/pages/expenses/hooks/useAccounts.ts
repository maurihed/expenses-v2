import AccountService from "@/services/AccountService";
import TransactionService from "@/services/TransactionService";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Account, AccountPayload, CreditSummary, MonthYearType, TransferInput } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useAccounts = (enabled = true, includeArchived = false) => {
  const { data, isLoading, error, refetch } = useQuery<Account[]>(
    ["accounts", { includeArchived }],
    () => AccountService.getAccounts(includeArchived),
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

export const useCreditSummary = (accountId: string, enabled = true) => {
  const { data, isLoading } = useQuery<CreditSummary>(
    ["credit-summary", accountId],
    () => AccountService.getCreditSummary(accountId),
    {
      staleTime: Infinity, // Refresh only when invalidated after a payment
      enabled: enabled && Boolean(accountId),
    }
  );

  return {
    creditSummary: data ?? null,
    loadingCreditSummary: isLoading,
  };
};

export const useAccountMutations = () => {
  const queryClient = useQueryClient();
  const { month, year } = useExpensesStore((state) => state.monthYear) as MonthYearType;

  const invalidateAccountData = () => {
    queryClient.invalidateQueries(["accounts"]);
    queryClient.invalidateQueries(["transactions", month, year]);
    queryClient.invalidateQueries(["credit-summary"]);
  };

  const createAccount = useMutation<Account, Error, AccountPayload>(
    (account: AccountPayload) => AccountService.createAccount(account),
    { onSuccess: invalidateAccountData }
  );

  const updateAccount = useMutation<Account, Error, { id: string; account: AccountPayload }>(
    ({ id, account }: { id: string; account: AccountPayload }) =>
      AccountService.updateAccount(id, account),
    { onSuccess: invalidateAccountData }
  );

  const archiveAccount = useMutation<Account, Error, string>(
    (id: string) => AccountService.archiveAccount(id),
    { onSuccess: invalidateAccountData }
  );

  const payCard = useMutation<{ id: string }, Error, TransferInput>(
    (transfer: TransferInput) => TransactionService.createTransfer(transfer),
    { onSuccess: invalidateAccountData }
  );

  return {
    createAccount,
    updateAccount,
    archiveAccount,
    payCard,
    accountMutationLoading:
      createAccount.isLoading || updateAccount.isLoading || archiveAccount.isLoading,
    payingCard: payCard.isLoading,
  };
};
