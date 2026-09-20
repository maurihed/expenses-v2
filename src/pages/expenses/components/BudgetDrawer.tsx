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
import { getMonthName } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useBudget } from "../hooks/useBudget";

function BudgetDrawer({
  open,
  year,
  month,
  current,
  onClose,
}: {
  open: boolean;
  year: number;
  month: number;
  current: number | null;
  onClose: () => void;
}) {
  const { upsertBudget } = useBudget(year, month, false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(current != null ? String(current) : "");
      upsertBudget.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parsed = Number(amount);
  const canSubmit =
    amount.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && !upsertBudget.isLoading;

  const handleSave = () => {
    if (!canSubmit) return;
    upsertBudget.mutate(
      { year, month, amount: parsed, currency: "MXN" },
      { onSuccess: onClose }
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby="budget-drawer-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">Presupuesto de {getMonthName(month)}</DrawerTitle>
          <DrawerDescription id="budget-drawer-description">
            Monto mensual para gastos del matrimonio (en MXN).
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 px-4 pb-2">
          <label htmlFor="budget-amount" className="text-sm font-medium">
            Monto
          </label>
          <Input
            id="budget-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {upsertBudget.error && (
            <p role="alert" className="text-sm text-destructive">
              {upsertBudget.error.message}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button type="button" onClick={handleSave} disabled={!canSubmit}>
            {upsertBudget.isLoading && <LoaderCircle className="mr-2 animate-spin" />}
            Guardar
          </Button>
          <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default BudgetDrawer;
