import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useExpensesStore } from "@/stores/expenses.store";
import AccountForm from "./AccountForm";

function AccountModal() {
  const isOpen = useExpensesStore((state) => state.accountModalOpen);
  const accountToEdit = useExpensesStore((state) => state.accountToEdit);
  const closeModal = useExpensesStore((state) => state.closeAccountModal);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DrawerContent aria-describedby="account-modal-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">
            {accountToEdit ? "Editar cuenta" : "Nueva cuenta"}
          </DrawerTitle>
          <DrawerDescription id="account-modal-description">
            {accountToEdit
              ? "Actualiza los datos de la cuenta."
              : "Agrega una cuenta de efectivo, débito, crédito o inversión."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {isOpen && (
            <AccountForm account={accountToEdit} onClose={closeModal} onArchived={closeModal} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default AccountModal;
