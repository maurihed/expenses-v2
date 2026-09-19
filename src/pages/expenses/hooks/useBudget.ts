import BudgetService from "@/services/BudgetService";
import type { BudgetPayload } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useBudget = (year: number, month: number, enabled = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery(
    ["budget", year, month],
    () => BudgetService.getBudget(year, month),
    { staleTime: Infinity, enabled }
  );

  const upsertBudget = useMutation(
    (payload: BudgetPayload) => BudgetService.upsertBudget(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["budget"]);
      },
    }
  );

  return {
    budget: data ?? null,
    loadingBudget: isLoading,
    budgetError: error,
    refreshBudget: refetch,
    upsertBudget,
  };
};
