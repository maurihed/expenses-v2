import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExpensesStore } from "@/stores/expenses.store";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTransactions } from "../../hooks/useTransactions";
import TransactionForm from "./TransactionForm";

function TransactionModal() {
  const isOpen = useExpensesStore((state) => state.transactionModalOpen);
  const transactionAccountId = useExpensesStore((state) => state.transactionAccountId);
  const transactionToEdit = useExpensesStore((state) => state.transactionToEdit);
  const [deletionStarted, setDeletionStarted] = useState(false);
  const { deleteTransaction, isDeleting } = useTransactions(false);

  const closeModal = useExpensesStore((state) => state.closeTransactionModal);

  const handleDeleteTransaction = () => {
    if (transactionToEdit) {
      deleteTransaction(transactionToEdit);
      setDeletionStarted(true);
    }
  };

  useEffect(() => {
    if (deletionStarted && !isDeleting) {
      closeModal();
      setDeletionStarted(false);
    }
  }, [deletionStarted, isDeleting]);

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className="w-full max-w-2xl h-full md:max-h-[85vh] grid-rows-[min-content_1fr]"
        aria-describedby="transaction modal form"
      >
        <DialogHeader className="flex flex-row items-center">
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
            {transactionAccountId ? "Nueva transaccion" : "Editar transaccion"}
          </DialogTitle>
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
