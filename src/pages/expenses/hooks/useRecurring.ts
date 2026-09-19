import RecurringService from "@/services/RecurringService";
import { useExpensesStore } from "@/stores/expenses.store";
import type {
  MonthYearType,
  RecurringRule,
  RecurringRulePayload,
  RecurringRunResult,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useRecurring = (enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery<RecurringRule[]>(
    ["recurring"],
    () => RecurringService.getRules(true),
    {
      staleTime: Infinity, // Disable background fetching
      enabled,
    }
  );

  return {
    rules: data || [],
    loadingRules: isLoading,
    error,
    refreshRules: refetch,
  };
};

export const useRecurringMutations = () => {
  const queryClient = useQueryClient();
  const { month, year } = useExpensesStore((state) => state.monthYear) as MonthYearType;

  const invalidateRecurringData = () => {
    queryClient.invalidateQueries(["recurring"]);
    queryClient.invalidateQueries(["accounts"]);
    queryClient.invalidateQueries(["transactions", month, year]);
  };

  const createRule = useMutation<RecurringRule, Error, RecurringRulePayload>(
    (payload: RecurringRulePayload) => RecurringService.createRule(payload),
    { onSuccess: invalidateRecurringData }
  );

  const updateRule = useMutation<
    RecurringRule,
    Error,
    { id: string; rule: Partial<RecurringRulePayload> }
  >(({ id, rule }) => RecurringService.updateRule(id, rule), {
    onSuccess: invalidateRecurringData,
  });

  const deactivateRule = useMutation<void, Error, string>(
    (id: string) => RecurringService.deactivateRule(id),
    { onSuccess: invalidateRecurringData }
  );

  const runNow = useMutation<RecurringRunResult, Error, void>(
    () => RecurringService.runNow(),
    { onSuccess: invalidateRecurringData }
  );

  return {
    createRule,
    updateRule,
    deactivateRule,
    runNow,
    recurringMutationLoading:
      createRule.isLoading || updateRule.isLoading || deactivateRule.isLoading,
  };
};
