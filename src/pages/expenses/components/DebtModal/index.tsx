import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Debt, DebtType } from "@/types";
import DebtForm from "./DebtForm";

function DebtModal({
  open,
  debt,
  defaultType,
  onClose,
}: {
  open: boolean;
  debt: Debt | null;
  defaultType: DebtType;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby="debt-modal-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {debt ? "Editar deuda" : "Nueva deuda"}
          </DrawerTitle>
          <DrawerDescription id="debt-modal-description">
            Registra deudas por cobrar o por pagar; la fecha límite es opcional.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {open && (
            <DebtForm debt={debt} defaultType={defaultType} onClose={onClose} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default DebtModal;
