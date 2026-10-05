import type { Account } from "@/types";
import { formatMoney } from "@/lib/utils";
import AccountService from "@/services/AccountService";
import { useQueries } from "react-query";

/**
 * Suma el pago del periodo de todas las tarjetas de crédito. Consulta el
 * resumen de cada tarjeta (el backend ya lo cachea por cuenta).
 */
function CreditPeriodTotal({ accounts }: { accounts: Account[] }) {
  const creditAccounts = accounts.filter((account) => account.type === "CREDIT");
  const results = useQueries(
    creditAccounts.map((account) => ({
      queryKey: ["credit-summary", account.id],
      queryFn: () => AccountService.getCreditSummary(account.id),
      staleTime: Infinity,
    }))
  );

  if (creditAccounts.length === 0) return null;

  const loading = results.some((result) => result.isLoading);
  const total = results.reduce((sum, result) => sum + (result.data?.periodPayment ?? 0), 0);

  return (
    <span className="block text-xs text-muted-foreground tabular-nums">
      Pago del periodo {loading ? "…" : formatMoney(total, "MXN")}
    </span>
  );
}

export default CreditPeriodTotal;
