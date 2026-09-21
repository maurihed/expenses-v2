import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { Holding } from "@/types";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useHoldingMutations } from "../../hooks/useHoldings";

type Props = {
  accountId: string;
  holding: Holding | null;
  onClose: () => void;
};

function EditHoldingDrawer({ accountId, holding, onClose }: Props) {
  const [quantity, setQuantity] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateHolding, deleteHolding, holdingMutationLoading } = useHoldingMutations(accountId);

  useEffect(() => {
    if (holding) {
      setQuantity(String(holding.quantity));
      setConfirmDelete(false);
      setError(null);
    }
  }, [holding]);

  if (!holding) return null;

  const parsedQuantity = Number(quantity);
  const canSubmit = Number.isFinite(parsedQuantity) && parsedQuantity > 0 && !holdingMutationLoading;

  const handleSave = () => {
    if (!canSubmit) return;
    setError(null);
    updateHolding.mutate(
      { id: holding.id, payload: { quantity: parsedQuantity } },
      { onSuccess: () => onClose(), onError: (mutationError) => setError(mutationError.message) }
    );
  };

  const handleDelete = () => {
    setError(null);
    deleteHolding.mutate(holding.id, {
      onSuccess: () => onClose(),
      onError: (mutationError) => setError(mutationError.message),
    });
  };

  return (
    <Drawer
      open={holding != null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerContent aria-describedby="edit-holding-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {holding.symbol} · {holding.name ?? holding.symbol}
          </DrawerTitle>
          <DrawerDescription id="edit-holding-description">
            {holding.price != null
              ? `Precio actual ${formatMoney(holding.price, holding.currency)}`
              : "Sin precio disponible"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cantidad</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.00000001"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-11"
            />
          </label>

          <p className="text-xs text-muted-foreground">Editar la cantidad no ajusta el efectivo.</p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
              <p className="text-sm">¿Eliminar esta posición? No ajusta el efectivo.</p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setConfirmDelete(false)}
                  disabled={holdingMutationLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={handleDelete}
                  disabled={holdingMutationLoading}
                >
                  {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
                  Sí, eliminar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={holdingMutationLoading}
            >
              Eliminar posición
            </Button>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={onClose}
              disabled={holdingMutationLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
              disabled={!canSubmit}
            >
              {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default EditHoldingDrawer;
