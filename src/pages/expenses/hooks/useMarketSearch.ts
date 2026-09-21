import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MarketService from "@/services/MarketService";
import type { MarketSearchResult } from "@/types";
import { useQuery } from "react-query";

export const useMarketSearch = (query: string) => {
  const debounced = useDebouncedValue(query.trim(), 300);
  const { data, isFetching, error } = useQuery<MarketSearchResult[]>(
    ["market-search", debounced],
    () => MarketService.search(debounced),
    { enabled: debounced.length >= 2, staleTime: 5 * 60 * 1000, retry: 0 }
  );

  return {
    results: data ?? [],
    searching: isFetching,
    searchError: error as Error | null,
  };
};
