import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { parseDateOnly } from "@/lib/DateUtils";
import { cn, formatMoney, getDateString } from "@/lib/utils";
import type { Debt, DebtType } from "@/types";
import { HandCoins, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import DebtModal from "./components/DebtModal";
import DebtPaymentDrawer from "./components/DebtPaymentDrawer";
import { useDebts } from "./hooks/useDebts";

const typeLabels: Record<DebtType, string> = {
  receivable: "Por cobrar",
  payable: "Por pagar",
};

function DebtCard({
  debt,
  onEdit,
  onPay,
}: {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onPay: (debt: Debt) => void;
}) {
  const progress = debt.amount > 0 ? Math.min(100, (debt.paid / debt.amount) * 100) : 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{debt.counterparty}</p>
          <p className="text-sm text-muted-foreground">
            {typeLabels[debt.type]} · {formatMoney(debt.amount, debt.currency)}
            {debt.dueDate ? ` · vence ${getDateString(parseDateOnly(debt.dueDate))}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs",
            debt.status === "SETTLED"
              ? "bg-primary-100 text-primary-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          {debt.status === "SETTLED" ? "Liquidada" : "Pendiente"}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pendiente</span>
          <span className="font-semibold tabular-nums">
            {formatMoney(debt.remaining, debt.currency)}
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Abonado {formatMoney(debt.paid, debt.currency)}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 cursor-pointer"
          disabled={debt.status === "SETTLED"}
          onClick={() => onPay(debt)}
        >
          <HandCoins />
          Abonar
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="cursor-pointer"
          aria-label={`Editar deuda de ${debt.counterparty}`}
          onClick={() => onEdit(debt)}
        >
          <Pencil />
        </Button>
      </div>
    </div>
  );
}

function DebtsPage() {
  const [type, setType] = useState<DebtType>("receivable");
  const { debts, loadingDebts, error, refreshDebts } = useDebts(false, type);
  const [modalOpen, setModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  const openNew = () => {
    setDebtToEdit(null);
    setModalOpen(true);
  };
  const openEdit = (debt: Debt) => {
    setDebtToEdit(debt);
    setModalOpen(true);
  };

  const totalRemaining = debts.reduce((acc, debt) => acc + debt.remaining, 0);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-3 pt-2">
        <h1 className="font-display text-2xl">Deudas</h1>
        <Button className="cursor-pointer" onClick={openNew}>
          <Plus />
          Agregar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["receivable", "payable"] as DebtType[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "cursor-pointer rounded-md border p-2 text-sm font-medium transition-colors duration-200",
              type === option ? "border-primary bg-primary-100 text-primary-700" : "border-border"
            )}
          >
            {typeLabels[option]}
          </button>
        ))}
      </div>

      <ExpenseSection className="p-4">
        {loadingDebts && <Loader />}

        {!loadingDebts && Boolean(error) && (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-destructive">Error al cargar deudas</p>
            <Button variant="outline" className="cursor-pointer" onClick={() => refreshDebts()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loadingDebts && !error && debts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="rounded-full bg-primary-100 p-3">
              <HandCoins className="text-primary-700" aria-hidden="true" />
            </span>
            <p className="font-display text-lg">Sin deudas {typeLabels[type].toLowerCase()}</p>
          </div>
        )}

        {!loadingDebts && !error && debts.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total pendiente</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(totalRemaining, "MXN")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {debts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onPay={setPaymentDebt} />
              ))}
            </div>
          </>
        )}
      </ExpenseSection>

      <DebtModal
        open={modalOpen}
        debt={debtToEdit}
        defaultType={type}
        onClose={() => setModalOpen(false)}
      />
      <DebtPaymentDrawer debt={paymentDebt} onClose={() => setPaymentDebt(null)} />
    </div>
  );
}

export default DebtsPage;
