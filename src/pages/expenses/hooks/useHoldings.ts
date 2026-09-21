import AccountService from "@/services/AccountService";
import type { Holding, HoldingPayload, PortfolioSummary } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const useHoldings = (accountId: string, enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery<PortfolioSummary>(
    ["holdings", accountId],
    () => AccountService.getHoldings(accountId),
    {
      enabled: enabled && Boolean(accountId),
      staleTime: 5 * 60 * 1000,
      retry: 0,
    }
  );

  return {
    portfolio: data ?? null,
    loadingHoldings: isLoading,
    holdingsError: error as Error | null,
    refreshHoldings: refetch,
  };
};

export const useHoldingMutations = (accountId: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries(["holdings", accountId]);
    queryClient.invalidateQueries(["accounts"]);
  };

  const createHolding = useMutation<Holding, Error, HoldingPayload>(
    (payload: HoldingPayload) => AccountService.createHolding(accountId, payload),
    { onSuccess: invalidate }
  );

  const updateHolding = useMutation<
    Holding,
    Error,
    { id: string; payload: HoldingPayload }
  >(({ id, payload }) => AccountService.updateHolding(accountId, id, payload), {
    onSuccess: invalidate,
  });

  const deleteHolding = useMutation<void, Error, string>(
    (id: string) => AccountService.deleteHolding(accountId, id),
    { onSuccess: invalidate }
  );

  return {
    createHolding,
    updateHolding,
    deleteHolding,
    holdingMutationLoading:
      createHolding.isLoading || updateHolding.isLoading || deleteHolding.isLoading,
  };
};
