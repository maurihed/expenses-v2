import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { ExpenseSection } from "@/components/ui/expense-section";
import { useExpensesStore } from "@/stores/expenses.store";
import { Plus, Wallet } from "lucide-react";
import { formatMoney } from "../../../lib/utils";
import { useAccounts } from "../hooks/useAccounts";

function AccountList() {
  const { accounts, loadingAccounts, error } = useAccounts();
  const openTransactionModal = useExpensesStore((state) => state.openNewTransactionModal);

  if (loadingAccounts) {
    <ExpenseSection>
      <p>Cargando cuentas...</p>;
    </ExpenseSection>;
  }

  if (error) {
    return (
      <ExpenseSection>
        <p>Error al cargar cuentas</p>
      </ExpenseSection>
    );
  }

  if (accounts.length === 0) {
    return (
      <ExpenseSection>
        <p>No hay cuentas disponibles</p>
      </ExpenseSection>
    );
  }

  return (
    <ExpenseSection className="py-4 grid grid-cols-1 gap-4">
      {accounts.map((account) => (
        <div className="flex items-center justify-between px-4 gap-4" key={account.id}>
          <div className="bg-green-700 rounded-full p-2 flex items-center justify-center">
            <Wallet />
          </div>
          <div className="grow">
            <p className="font-bold">{account.name}</p>
            <p className="text-slate-600 dark:text-slate-300">
              {formatMoney(account.balance)}
            </p>
          </div>
          <Button
            variant="outline"
            className="grow-0 rounded-full w-[36px]"
            onClick={() => openTransactionModal(account.id)}
          >
            <Plus />
          </Button>
        </div>
      ))}
      <Separator />
      <div className="flex items-center justify-between px-4 gap-4">
        <span>Total</span>
        <span className="font-bold">
          {formatMoney(accounts.reduce((acc, account) => acc + account.balance, 0))}
        </span>
      </div>
    </ExpenseSection>
  );
}

export default AccountList;
