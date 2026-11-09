import { formatMoney } from "@/lib/utils";
import { toMxn } from "@/lib/accountTotals";
import type { Account } from "@/types";
import AccountService from "@/services/AccountService";
import { useQueries } from "react-query";

type Props = {
  accounts: Account[];
  usdRate: number | null;
  loadingFx: boolean;
  fxError: boolean;
};

/**
 * Suma el pago del periodo de todas las tarjetas de crédito, convertido a MXN
 * según la moneda de cada tarjeta. Consulta el resumen de cada tarjeta (el
 * backend ya lo cachea por cuenta).
 */
function CreditPeriodTotal({ accounts, usdRate, loadingFx, fxError }: Props) {
  const creditAccounts = accounts.filter((account) => account.type === "CREDIT");
  const needsFx = creditAccounts.some((account) => account.currency === "USD");
  const results = useQueries(
    creditAccounts.map((account) => ({
      queryKey: ["credit-summary", account.id],
      queryFn: () => AccountService.getCreditSummary(account.id),
      staleTime: Infinity,
    }))
  );

  if (creditAccounts.length === 0) return null;

  const loading =
    results.some((result) => result.isLoading || result.isFetching) ||
    (needsFx && loadingFx);
  const failed = results.some((result) => result.isError) || (needsFx && fxError);

  let total: number | null = 0;
  if (!loading && !failed) {
    for (let index = 0; index < creditAccounts.length; index++) {
      const periodPayment = results[index].data?.periodPayment;
      const converted =
        periodPayment == null
          ? null
          : toMxn(periodPayment, creditAccounts[index].currency, usdRate);
      if (converted == null) {
        total = null;
        break;
      }
      total += converted;
    }
  }

  return (
    <span className="block text-xs text-muted-foreground tabular-nums">
      Pago del periodo {loading ? "…" : failed || total == null ? "—" : formatMoney(total, "MXN")}
    </span>
  );
}

export default CreditPeriodTotal;
