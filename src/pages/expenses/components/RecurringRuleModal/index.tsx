import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { RecurringRule } from "@/types";
import RecurringRuleForm from "./RecurringRuleForm";

type Props = {
  open: boolean;
  rule: RecurringRule | null;
  onClose: () => void;
};

function RecurringRuleModal({ open, rule, onClose }: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby="recurring-rule-modal-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {rule ? "Editar recurrente" : "Nuevo recurrente"}
          </DrawerTitle>
          <DrawerDescription id="recurring-rule-modal-description">
            {rule
              ? "Actualiza los datos de la regla recurrente."
              : "Automatiza una suscripción, ingreso o interés periódico."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-6">
          {open && <RecurringRuleForm key={rule?.id ?? "new"} rule={rule} onClose={onClose} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default RecurringRuleModal;
