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
import { cn, formatDateOnly } from "@/lib/utils";
import type { Person } from "@/types";
import { LoaderCircle, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { usePersonMutations } from "../hooks/usePersons";

type PersonAdjustmentDrawerProps = {
  person: Person | null;
  onClose: () => void;
};

function PersonAdjustmentDrawer({ person, onClose }: PersonAdjustmentDrawerProps) {
  const { addAdjustment } = usePersonMutations();
  const [sign, setSign] = useState<"+" | "-">("+");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => formatDateOnly(new Date()));

  const magnitude = Number(amount);
  const canSubmit =
    Boolean(person) &&
    amount.trim().length > 0 &&
    Number.isFinite(magnitude) &&
    magnitude > 0 &&
    reason.trim().length > 0 &&
    date.length > 0 &&
    !addAdjustment.isLoading;

  const handleConfirm = () => {
    if (!canSubmit || !person) return;
    addAdjustment.mutate(
      {
        id: person.id,
        adjustment: {
          amount: sign === "+" ? magnitude : -magnitude,
          reason: reason.trim(),
          date,
        },
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Drawer
      open={Boolean(person)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent aria-describedby="person-adjustment-drawer">
        <DrawerHeader>
          <DrawerTitle className="font-serif">Ajustar presupuesto</DrawerTitle>
          <DrawerDescription>
            {person ? `Movimiento manual para ${person.name}` : ""}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tipo de ajuste</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={sign === "+"}
                onClick={() => setSign("+")}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-200",
                  sign === "+"
                    ? "border-primary bg-primary-100 text-primary-700"
                    : "border-border hover:bg-muted"
                )}
              >
                <Plus />
                Agregar
              </button>
              <button
                type="button"
                aria-pressed={sign === "-"}
                onClick={() => setSign("-")}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-200",
                  sign === "-"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:bg-muted"
                )}
              >
                <Minus />
                Descontar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="adjustment-amount">
              Monto
            </label>
            <Input
              id="adjustment-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="adjustment-reason">
              Motivo
            </label>
            <Input
              id="adjustment-reason"
              type="text"
              placeholder="Bono, retiro, corrección…"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="adjustment-date">
              Fecha
            </label>
            <Input
              id="adjustment-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          {addAdjustment.error && (
            <p role="alert" className="text-sm text-destructive">
              {addAdjustment.error.message}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button type="button" className="cursor-pointer" onClick={handleConfirm} disabled={!canSubmit}>
            {addAdjustment.isLoading && <LoaderCircle className="animate-spin" />}
            Guardar ajuste
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer"
            onClick={onClose}
            disabled={addAdjustment.isLoading}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default PersonAdjustmentDrawer;
