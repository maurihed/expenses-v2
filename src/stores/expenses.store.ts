import type { Account, Category, Transaction } from "@/types";
import { create } from "zustand";

type FilterType = {
  search: string;
  categories: Set<string>;
};

interface AuthState {
  monthYear: { month: number; year: number };
  transactionModalOpen: boolean;
  transactionAccountId: string | null;
  transactionToEdit: Transaction | null;
  accountModalOpen: boolean;
  accountToEdit: Account | null;
  categoryModalOpen: boolean;
  categoryToEdit: Category | null;
  payCardAccountId: string | null;
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  setMonthYear: (monthYear: { month: number; year: number }) => void;
  openNewTransactionModal: (accountId?: string | null) => void;
  openEditTransactionModal: (transactionId: Transaction) => void;
  closeTransactionModal: () => void;
  openNewAccountModal: () => void;
  openEditAccountModal: (account: Account) => void;
  closeAccountModal: () => void;
  openNewCategoryModal: () => void;
  openEditCategoryModal: (category: Category) => void;
  closeCategoryModal: () => void;
  openPayCardDrawer: (accountId: string) => void;
  closePayCardDrawer: () => void;
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
    accountModalOpen: false,
    accountToEdit: null,
    categoryModalOpen: false,
    categoryToEdit: null,
    payCardAccountId: null,
    filters: { search: "", categories: new Set() },
    setMonthYear: (monthYear) => set({ monthYear }),
    openNewTransactionModal: (accountId?: string | null) =>
      set({
        transactionToEdit: null,
        transactionAccountId: accountId ?? null,
        transactionModalOpen: true,
      }),
    openEditTransactionModal: (transaction: Transaction) =>
      set({
        transactionAccountId: null,
        transactionToEdit: transaction,
        transactionModalOpen: true,
      }),
    closeTransactionModal: () => set({ transactionModalOpen: false }),
    openNewAccountModal: () => set({ accountToEdit: null, accountModalOpen: true }),
    openEditAccountModal: (account: Account) =>
      set({ accountToEdit: account, accountModalOpen: true }),
    closeAccountModal: () => set({ accountModalOpen: false }),
    openNewCategoryModal: () => set({ categoryToEdit: null, categoryModalOpen: true }),
    openEditCategoryModal: (category: Category) =>
      set({ categoryToEdit: category, categoryModalOpen: true }),
    closeCategoryModal: () => set({ categoryModalOpen: false }),
    openPayCardDrawer: (accountId: string) => set({ payCardAccountId: accountId }),
    closePayCardDrawer: () => set({ payCardAccountId: null }),
    setFilters: (filters: FilterType) => set({ filters }),
  };
});
