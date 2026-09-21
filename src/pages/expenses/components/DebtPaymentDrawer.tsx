import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DrawerSelector from "@/components/ui/drawer-selector";
import { formatDateOnly } from "@/lib/DateUtils";
import { formatMoney, getDateString } from "@/lib/utils";
import type { Account, Debt } from "@/types";
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { useDebts } from "../hooks/useDebts";

function DebtPaymentDrawer({ debt, onClose }: { debt: Debt | null; onClose: () => void }) {
  const { addPayment, debtMutationLoading } = useDebts();
  const { accounts } = useAccounts();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (debt) {
      setAmount(String(debt.remaining));
      setDate(new Date());
      setAccountId("");
      setNotes("");
      addPayment.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debt]);

  const parsedAmount = Number(amount);
  const canSubmit =
    debt != null &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= debt.remaining + 0.001 &&
    !debtMutationLoading;

  // Solo cuentas de la misma moneda que la deuda (el backend lo valida).
  const matchingAccounts = debt
    ? accounts.filter((account: Account) => account.currency === debt.currency)
    : [];
  const accountItems = [
    { key: "", value: "Sin cuenta (solo registrar)" },
    ...matchingAccounts.map((account: Account) => ({
      key: account.id,
      value: `${account.name} (${account.currency})`,
    })),
  ];

  const handleConfirm = () => {
    if (!debt || !canSubmit) return;
    addPayment.mutate(
      {
        id: debt.id,
        payload: {
          amount: parsedAmount,
          date: formatDateOnly(date),
          accountId: accountId || null,
          notes: notes.trim() ? notes.trim() : null,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Drawer
      open={debt != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent aria-describedby="debt-payment-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">Abonar a deuda</DrawerTitle>
          <DrawerDescription id="debt-payment-description">
            {debt
              ? `${debt.counterparty} · pendiente ${formatMoney(debt.remaining, debt.currency)}`
              : ""}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-2">
          <div>
            <label htmlFor="debt-payment-amount" className="text-sm font-medium">
              Monto
            </label>
            <Input
              id="debt-payment-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fecha</label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start cursor-pointer">
                  <CalendarIcon className="mr-2 size-4" />
                  {getDateString(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selected) => {
                    if (selected) setDate(selected);
                    setDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium">Cuenta (opcional)</label>
            <DrawerSelector
              items={accountItems}
              value={accountId}
              onChange={setAccountId}
              renderItem={(item) => <span>{item.value}</span>}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Si eliges una cuenta se registrará el movimiento y se ajustará el saldo.
            </p>
          </div>

          <div>
            <label htmlFor="debt-payment-notes" className="text-sm font-medium">
              Notas (opcional)
            </label>
            <Input
              id="debt-payment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {addPayment.error && (
            <p role="alert" className="text-sm text-destructive">
              {addPayment.error.message}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button type="button" onClick={handleConfirm} disabled={!canSubmit}>
            {debtMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
            Confirmar abono
          </Button>
          <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default DebtPaymentDrawer;
