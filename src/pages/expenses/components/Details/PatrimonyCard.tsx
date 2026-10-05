import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { computePatrimony } from "@/lib/dashboardStats";
import { formatMoney, getDateString } from "@/lib/utils";
import { useAccounts } from "../../hooks/useAccounts";
import { useDebts } from "../../hooks/useDebts";
import { useFxRate } from "../../hooks/useFxRate";

function PatrimonyCard() {
  const { accounts, loadingAccounts } = useAccounts();
  const { debts } = useDebts();
  const { fx } = useFxRate();
  const usdRate = fx?.rate ?? null;

  const { assetsMxn, debtsMxn, netMxn } = computePatrimony(accounts, debts, usdRate);

  const assets = assetsMxn ?? 0;
  const debtsValue = debtsMxn ?? 0;
  const combined = assets + debtsValue;
  const assetsShare = combined > 0 ? (assets / combined) * 100 : 0;

  return (
    <ExpenseSection className="brand-gradient brand-glow p-4 text-white">
      <p className="text-sm text-white/80">Patrimonio neto</p>
      {loadingAccounts ? (
        <Loader className="py-2" />
      ) : (
        <p className="mt-1 font-display text-3xl font-bold tabular-nums">
          {netMxn != null ? formatMoney(netMxn, "MXN") : "—"}
        </p>
      )}

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25"
        role="img"
        aria-label={`Activos ${Math.round(assetsShare)}%, deudas ${Math.round(100 - assetsShare)}%`}
      >
        <div className="h-full rounded-full bg-white" style={{ width: `${assetsShare}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-white/80">
        <span className="tabular-nums">
          Activos {assetsMxn != null ? formatMoney(assetsMxn, "MXN") : "—"}
        </span>
        <span className="tabular-nums">
          Deudas {debtsMxn != null ? formatMoney(debtsMxn, "MXN") : "—"}
        </span>
      </div>

      {fx && (
        <p className="mt-2 text-xs text-white/70">
          1 USD = {formatMoney(fx.rate, "MXN")}
          {fx.stale ? " (en caché)" : ""} · {getDateString(new Date(fx.fetchedAt))}
        </p>
      )}
    </ExpenseSection>
  );
}

export default PatrimonyCard;
