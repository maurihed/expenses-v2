import FxService from "@/services/FxService";
import { useQuery } from "react-query";

export const useFxRate = (base = "USD", quote = "MXN") => {
  const { data, isLoading, error, refetch } = useQuery(
    ["fx-rate", base, quote],
    () => FxService.getRate(base, quote),
    { staleTime: 60 * 60 * 1000, retry: 0 }
  );

  return {
    fx: data ?? null,
    loadingFx: isLoading,
    fxError: error,
    refreshFx: refetch,
  };
};
