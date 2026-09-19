import { Loader } from "@/components/ui/loader";
import { formatMoney } from "@/lib/utils";
import type { Account } from "@/types";
import { AlertTriangle } from "lucide-react";
import { useCreditSummary } from "../../hooks/useAccounts";

type Props = {
  account: Account;
};

function CreditSummary({ account }: Props) {
  const { creditSummary, loadingCreditSummary } = useCreditSummary(account.id);

  if (loadingCreditSummary) {
    return <Loader className="py-2" />;
  }

  if (!creditSummary) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar el resumen de crédito</p>;
  }

  const msiCommitted = creditSummary.msiCommitted ?? 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Deuda total</span>
          <span className="flex items-center gap-1 font-semibold text-destructive tabular-nums">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            {formatMoney(creditSummary.totalDebt, account.currency)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Pago del periodo</span>
          <span className="font-semibold tabular-nums">
            {formatMoney(creditSummary.periodPayment, account.currency)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Disponible</span>
          <span className="font-semibold tabular-nums">
            {creditSummary.available === null
              ? "—"
              : formatMoney(creditSummary.available, account.currency)}
          </span>
        </div>
      </div>

      {msiCommitted > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Meses sin intereses comprometidos
          </span>
          <span className="font-semibold tabular-nums">
            {formatMoney(msiCommitted, account.currency)}
          </span>
        </div>
      )}
    </>
  );
}

export default CreditSummary;
