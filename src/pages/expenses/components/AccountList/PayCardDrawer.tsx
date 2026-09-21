import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccountMutations, useAccounts, useCreditSummary } from "../../hooks/useAccounts";

function PayCardDrawer() {
  const payCardAccountId = useExpensesStore((state) => state.payCardAccountId);
  const closePayCardDrawer = useExpensesStore((state) => state.closePayCardDrawer);
  const { accounts } = useAccounts();
  const { creditSummary } = useCreditSummary(payCardAccountId ?? "", Boolean(payCardAccountId));
  const { payCard } = useAccountMutations();

  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");

  const card = accounts.find((account) => account.id === payCardAccountId) ?? null;
  const sources = accounts.filter((account) => account.id !== payCardAccountId);
  const selectedSourceId = sourceId || sources[0]?.id || "";

  useEffect(() => {
    setSourceId("");
    setAmount("");
  }, [payCardAccountId]);

  const parsedAmount = Number(amount);
  const canSubmit =
    Boolean(payCardAccountId && selectedSourceId) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleConfirm = () => {
    if (!canSubmit || !payCardAccountId) return;
    payCard.mutate(
      {
        accountId: selectedSourceId,
        toAccountId: payCardAccountId,
        amount: parsedAmount,
        date: new Date(),
        description: card ? `Pago tarjeta ${card.name}` : undefined,
      },
      { onSuccess: () => closePayCardDrawer() }
    );
  };

  return (
    <Drawer
      open={Boolean(payCardAccountId)}
      onOpenChange={(open) => {
        if (!open) closePayCardDrawer();
      }}
    >
      <DrawerContent aria-describedby="pay-card-drawer">
        <DrawerHeader>
          <DrawerTitle className="font-display">Pagar tarjeta</DrawerTitle>
          <DrawerDescription>
            {card ? `Transferencia hacia ${card.name}` : "Selecciona una cuenta de origen"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-4 pb-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Cuenta de origen</span>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay otras cuentas disponibles para transferir.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setSourceId(source.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left cursor-pointer transition-colors duration-200",
                      selectedSourceId === source.id
                        ? "border-primary bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{source.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatMoney(source.balance, source.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="pay-card-amount">
              Monto
            </label>
            <Input
              id="pay-card-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {creditSummary && creditSummary.periodPayment > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setAmount(String(creditSummary.periodPayment))}
              >
                Usar pago del periodo:{" "}
                {formatMoney(creditSummary.periodPayment, card?.currency ?? "MXN")}
              </Button>
            )}
          </div>

          {payCard.error && (
            <p role="alert" className="text-sm text-destructive">
              {payCard.error.message}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button type="button" onClick={handleConfirm} disabled={!canSubmit || payCard.isLoading}>
            {payCard.isLoading && <LoaderCircle className="animate-spin mr-2" />}
            Confirmar pago
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={closePayCardDrawer}
            disabled={payCard.isLoading}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default PayCardDrawer;
