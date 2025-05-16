import type { Transaction } from "@/types";
import { create } from "zustand";

type FilterType = {
  search: string;
  categories: Set<String>;
};

interface AuthState {
  monthYear: { month: number; year: number };
  transactionModalOpen: boolean;
  transactionAccountId: string | null;
  transactionToEdit: Transaction | null;
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  setMonthYear: (monthYear: { month: number; year: number }) => void;
  openNewTransactionModal: (accountId: string) => void;
  openEditTransactionModal: (transactionId: Transaction) => void;
  closeTransactionModal: () => void;
}

export const useExpensesStore = create<AuthState>((set) => {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  return {
    monthYear: { month, year },
    transactionModalOpen: false,
    transactionAccountId: null,
    transactionToEdit: null,
    filters: { search: "", categories: new Set() },
    setMonthYear: (monthYear) => set({ monthYear }),
    openNewTransactionModal: (accountId: string) =>
      set({
        transactionToEdit: null,
        transactionAccountId: accountId,
        transactionModalOpen: true,
      }),
    openEditTransactionModal: (transaction: Transaction) =>
      set({
        transactionAccountId: null,
        transactionToEdit: transaction,
        transactionModalOpen: true,
      }),
    closeTransactionModal: () => set({ transactionModalOpen: false }),
    setFilters: (filters: FilterType) => set({ filters }),
  };
});
