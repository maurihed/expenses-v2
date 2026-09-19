import DebtService from "@/services/DebtService";
import { useExpensesStore } from "@/stores/expenses.store";
import type {
  Debt,
  DebtPayload,
  DebtPaymentPayload,
  DebtType,
  MonthYearType,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useDebts = (includeArchived = false, type?: DebtType) => {
  const queryClient = useQueryClient();
  const { month, year } = useExpensesStore((state) => state.monthYear) as MonthYearType;

  const { data, isLoading, error, refetch } = useQuery(
    ["debts", { includeArchived, type }],
    () => DebtService.getDebts(includeArchived, type),
    { staleTime: Infinity }
  );

  const invalidate = () => {
    queryClient.invalidateQueries(["debts"]);
    queryClient.invalidateQueries(["accounts"]);
    queryClient.invalidateQueries(["transactions", month, year]);
    queryClient.invalidateQueries(["credit-summary"]);
  };

  const createDebt = useMutation<Debt, Error, DebtPayload>(
    (payload: DebtPayload) => DebtService.createDebt(payload),
    { onSuccess: invalidate }
  );
  const updateDebt = useMutation<Debt, Error, { id: string; payload: Partial<DebtPayload> }>(
    ({ id, payload }: { id: string; payload: Partial<DebtPayload> }) =>
      DebtService.updateDebt(id, payload),
    { onSuccess: invalidate }
  );
  const archiveDebt = useMutation<void, Error, string>(
    (id: string) => DebtService.archiveDebt(id),
    { onSuccess: invalidate }
  );
  const addPayment = useMutation<Debt, Error, { id: string; payload: DebtPaymentPayload }>(
    ({ id, payload }: { id: string; payload: DebtPaymentPayload }) =>
      DebtService.addPayment(id, payload),
    { onSuccess: invalidate }
  );
  const removePayment = useMutation<Debt, Error, { id: string; paymentId: string }>(
    ({ id, paymentId }: { id: string; paymentId: string }) =>
      DebtService.removePayment(id, paymentId),
    { onSuccess: invalidate }
  );

  return {
    debts: data ?? [],
    loadingDebts: isLoading,
    error,
    refreshDebts: refetch,
    createDebt,
    updateDebt,
    archiveDebt,
    addPayment,
    removePayment,
    debtMutationLoading:
      createDebt.isLoading ||
      updateDebt.isLoading ||
      archiveDebt.isLoading ||
      addPayment.isLoading ||
      removePayment.isLoading,
  };
};
