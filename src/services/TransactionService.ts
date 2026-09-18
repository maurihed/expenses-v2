import { formatDateOnly, parseDateOnly } from "@/lib/DateUtils";
import type { Transaction } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const TRANSACTION_URL = `${VITE_API_BASE_URL}/transactions`;

class TransactionService {
  public async addTransaction(newTransaction: Transaction): Promise<Transaction> {
    try {
      const response = await fetch(TRANSACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTransaction,
          date: formatDateOnly(newTransaction.date),
        }),
      });
      const { id } = await response.json();
      const transaction = { ...newTransaction, id };

      return Promise.resolve(transaction);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  public async editTransaction({
    transactionToEdit,
    transactionEdited,
  }: {
    transactionToEdit: Transaction;
    transactionEdited: Transaction;
  }): Promise<Transaction> {
    const transaction = {
      ...transactionToEdit,
      ...transactionEdited,
    };

    await fetch(`${TRANSACTION_URL}/${transactionToEdit.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...transaction,
        date: formatDateOnly(transaction.date),
      }),
    });

    return Promise.resolve(transaction);
  }
  public async deleteTransaction(transaction: Transaction): Promise<string> {
    try {
      await fetch(`${TRANSACTION_URL}/${transaction.id}`, {
        method: "DELETE",
      });

      return Promise.resolve(transaction.id);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getTransactions(searchParams: URLSearchParams): Promise<Transaction[]> {
    try {
      const response = await fetch(`${TRANSACTION_URL}?${searchParams.toString()}`);
      const transactions = await response.json();
      return Promise.resolve(
        transactions?.map((transaction: Transaction) => ({
          ...transaction,
          date: parseDateOnly(transaction.date),
        })) ?? []
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default new TransactionService();
