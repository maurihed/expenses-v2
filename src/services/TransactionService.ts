import AccountService from "@/services/AccountService";
import type { Transaction } from "@/types";

const { VITE_GO_BASE_URL } = import.meta.env;
const TRANSACTION_URL = `${VITE_GO_BASE_URL}/transactions`;

class TransactionService {
  public async addTransaction(newTransaction: Transaction): Promise<Transaction> {
    try {
      const response = await fetch(TRANSACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });
      const { id } = await response.json();
      const transaction = { ...newTransaction, id };
      // update account balance
      await TransactionService.updateBalance(transaction);

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
    const body = {
      ...transactionToEdit,
      ...transactionEdited,
    };

    await fetch(`${TRANSACTION_URL}/${transactionToEdit.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // update account balance
    await TransactionService.updateBalance(transactionToEdit, transactionEdited);

    return Promise.resolve(body);
  }
  public async deleteTransaction(transaction: Transaction): Promise<string> {
    try {
      await fetch(`${TRANSACTION_URL}/${transaction.id}`, {
        method: "DELETE",
      });

      // update account balance
      await AccountService.updateAccountBalance({
        accountId: transaction.accountId,
        newBalance: transaction.type === "expense" ? transaction.amount : -transaction.amount,
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
          date: new Date(transaction.date),
        })) ?? []
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public static async updateBalance(
    transaction: Transaction,
    transactionEddited?: Transaction
  ) {
    // handle the case when a new transaction is added
    if (!transactionEddited) {
      await AccountService.updateAccountBalance({
        accountId: transaction.accountId,
        newBalance: transaction.type === "expense" ? -transaction.amount : transaction.amount,
      });
      return;
    }

    // handle the case when a transaction is edited
    const isSameAccount = transaction.accountId === transactionEddited.accountId;
    // If the modification does not affect the account balance, do not update the account balance
    if (
      isSameAccount &&
      transaction.amount === transactionEddited.amount &&
      transaction.type === transactionEddited.type
    ) {
      return;
    }

    // If the transaction is edited and the account is the same, we need to update the balance
    if (isSameAccount) {
      const adjustment =
        (transaction.type === "expense" ? transaction.amount : -transaction.amount) +
        (transactionEddited.type === "expense"
          ? -transactionEddited.amount
          : transactionEddited.amount);

      await AccountService.updateAccountBalance({
        accountId: transactionEddited.accountId,
        newBalance: adjustment,
      });
      return;
    }

    // If the transaction is edited and the account is different, we need to update the balance of both accounts
    await AccountService.updateAccountBalance({
      accountId: transaction.accountId,
      newBalance: transaction.type === "expense" ? transaction.amount : -transaction.amount,
    });
    await AccountService.updateAccountBalance({
      accountId: transactionEddited.accountId,
      newBalance:
        transactionEddited.type === "expense"
          ? -transactionEddited.amount
          : transactionEddited.amount,
    });
  }
}

export default new TransactionService();
