import { summarizePositions } from "@/lib/portfolio";
import AccountService from "@/services/AccountService";
import type { Account, PortfolioSummary } from "@/types";
import { useQueries } from "react-query";

/**
 * Carga las posiciones de todas las cuentas de inversión y las agrega en un
 * solo resumen de variación del día.
 */
export const usePositionsSummary = (accounts: Account[], usdRate: number | null) => {
  const investmentAccounts = accounts.filter((account) => account.type === "INVESTMENT");
  const results = useQueries(
    investmentAccounts.map((account) => ({
      queryKey: ["holdings", account.id],
      queryFn: () => AccountService.getHoldings(account.id),
      staleTime: 5 * 60 * 1000,
      retry: 0,
    }))
  );

  const portfolios = results
    .map((result) => result.data)
    .filter((portfolio): portfolio is PortfolioSummary => portfolio != null);

  return {
    summary: summarizePositions(portfolios, usdRate),
    loading: results.some((result) => result.isLoading || result.isFetching),
    error: results.find((result) => result.isError)?.error ?? null,
    hasInvestmentAccounts: investmentAccounts.length > 0,
  };
};
