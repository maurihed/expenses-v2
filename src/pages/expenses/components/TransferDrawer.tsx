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
import DrawerSelector from "@/components/ui/drawer-selector";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDateString } from "@/lib/utils";
import TransactionService from "@/services/TransactionService";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Account } from "@/types";
import { ArrowDown, CalendarIcon, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { useAccounts } from "../hooks/useAccounts";

function TransferDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts } = useAccounts();
  const queryClient = useQueryClient();
  const { month, year } = useExpensesStore((state) => state.monthYear);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFromId(accounts[0]?.id ?? "");
      setToId("");
      setAmount("");
      setDate(new Date());
      setDescription("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = (account: Account) => `${account.name} (${account.currency})`;
  const fromItems = accounts.map((account: Account) => ({ key: account.id, value: label(account) }));
  const toItems = useMemo(
    () => accounts.filter((account: Account) => account.id !== fromId).map((account: Account) => ({ key: account.id, value: label(account) })),
    [accounts, fromId]
  );

  const parsedAmount = Number(amount);
  const canSubmit =
    fromId !== "" &&
    toId !== "" &&
    fromId !== toId &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await TransactionService.createTransfer({
        accountId: fromId,
        toAccountId: toId,
        amount: parsedAmount,
        date,
        description: description.trim() ? description.trim() : undefined,
      });
      queryClient.invalidateQueries(["accounts"]);
      queryClient.invalidateQueries(["transactions", month, year]);
      queryClient.invalidateQueries(["credit-summary"]);
      onClose();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby="transfer-drawer-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">Transferir entre cuentas</DrawerTitle>
          <DrawerDescription id="transfer-drawer-description">
            Mueve dinero de una cuenta a otra (incluye pagar tarjeta).
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-2">
          <div>
            <label className="text-sm font-medium">Cuenta origen</label>
            <DrawerSelector
              items={fromItems}
              value={fromId}
              onChange={setFromId}
              renderItem={(item) => <span>{item.value}</span>}
            />
          </div>

          <div className="flex justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ArrowDown className="size-4" aria-hidden="true" />
            </span>
          </div>

          <div>
            <label className="text-sm font-medium">Cuenta destino</label>
            <DrawerSelector
              items={toItems}
              value={toId}
              onChange={setToId}
              renderItem={(item) => <span>{item.value}</span>}
            />
          </div>

          <div>
            <label htmlFor="transfer-amount" className="text-sm font-medium">
              Monto
            </label>
            <Input
              id="transfer-amount"
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
            <label htmlFor="transfer-description" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <Input
              id="transfer-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {loading && <LoaderCircle className="mr-2 animate-spin" />}
            Transferir
          </Button>
          <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default TransferDrawer;
