import { formatDateOnly, parseDateOnly } from "@/lib/DateUtils";
import { parseJsonResponse } from "@/lib/http";
import type { Transaction, TransferInput } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const TRANSACTION_URL = `${VITE_API_BASE_URL}/transactions`;

const toPayload = (transaction: Transaction) => ({
  ...transaction,
  category: transaction.type === "transfer" ? undefined : transaction.category,
  toAccountId: transaction.type === "transfer" ? transaction.toAccountId : undefined,
  personId: transaction.scope === "personal" ? transaction.personId : undefined,
  date: formatDateOnly(transaction.date),
});

class TransactionService {
  public async addTransaction(newTransaction: Transaction): Promise<Transaction> {
    try {
      const response = await fetch(TRANSACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toPayload(newTransaction)),
      });
      const { id } = await parseJsonResponse<{ id: string }>(response);
      const transaction = { ...newTransaction, id };

      return Promise.resolve(transaction);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  public async createTransfer(transfer: TransferInput): Promise<{ id: string }> {
    try {
      const response = await fetch(TRANSACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "transfer",
          accountId: transfer.accountId,
          toAccountId: transfer.toAccountId,
          amount: transfer.amount,
          date: formatDateOnly(transfer.date),
          description: transfer.description,
        }),
      });
      const { id } = await parseJsonResponse<{ id: string }>(response);
      return Promise.resolve({ id });
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

    try {
      const response = await fetch(`${TRANSACTION_URL}/${transactionToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toPayload(transaction)),
      });
      await parseJsonResponse<Transaction>(response);

      return Promise.resolve(transaction);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  public async deleteTransaction(transaction: Transaction): Promise<string> {
    try {
      const response = await fetch(`${TRANSACTION_URL}/${transaction.id}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);

      return Promise.resolve(transaction.id);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getTransactions(searchParams: URLSearchParams): Promise<Transaction[]> {
    try {
      const response = await fetch(`${TRANSACTION_URL}?${searchParams.toString()}`);
      const transactions = await parseJsonResponse<Transaction[]>(response);
      return Promise.resolve(
        transactions?.map((transaction: Transaction) => ({
          ...transaction,
          date: parseDateOnly(transaction.date),
          scope: transaction.scope ?? "joint",
          personId: transaction.personId ?? null,
        })) ?? []
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default new TransactionService();
