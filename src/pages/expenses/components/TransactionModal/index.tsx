import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExpensesStore } from "@/stores/expenses.store";
import { LoaderCircle } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import TransactionForm from "./TransactionForm";

function TransactionModal() {
  const isOpen = useExpensesStore((state) => state.transactionModalOpen);
  const transactionAccountId = useExpensesStore((state) => state.transactionAccountId);
  const transactionToEdit = useExpensesStore((state) => state.transactionToEdit);
  const { deleteTransaction, isDeleting, deleteTransactionError } = useTransactions(false);

  const closeModal = useExpensesStore((state) => state.closeTransactionModal);

  const handleDeleteTransaction = () => {
    if (transactionToEdit) {
      deleteTransaction(transactionToEdit, { onSuccess: () => closeModal() });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] md:max-h-[85vh] grid-rows-[min-content_1fr]"
        aria-describedby="transaction modal form"
      >
        <DialogHeader className="flex flex-row flex-wrap items-center gap-2">
          {transactionToEdit && (
            <Button
              className="mr-6"
              variant="destructive"
              size="sm"
              type="button"
              onClick={handleDeleteTransaction}
              disabled={isDeleting}
            >
              {isDeleting && <LoaderCircle className="animate-spin mr-2" />}
              Eliminar
            </Button>
          )}
          <DialogTitle>
            {transactionToEdit ? "Editar transaccion" : "Nueva transaccion"}
          </DialogTitle>
          {deleteTransactionError && (
            <p role="alert" className="w-full text-sm text-destructive">
              {deleteTransactionError.message}
            </p>
          )}
        </DialogHeader>
        <TransactionForm
          accountId={transactionAccountId}
          transactionToEdit={transactionToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TransactionModal;
