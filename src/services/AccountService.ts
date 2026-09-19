import type { Account, AccountPayload, CreditSummary } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const ACCOUNTS_URL = `${VITE_API_BASE_URL}/accounts`;

class AccountService {
  public async getAccounts(includeArchived = false): Promise<Account[]> {
    try {
      const url = includeArchived ? `${ACCOUNTS_URL}?includeArchived=true` : ACCOUNTS_URL;
      const response = await fetch(url);
      const accounts = await response.json();
      return Promise.resolve(accounts);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createAccount(account: AccountPayload): Promise<Account> {
    try {
      const response = await fetch(ACCOUNTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      });
      const newAccount = await response.json();
      return Promise.resolve(newAccount);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateAccount(id: string, account: AccountPayload): Promise<Account> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      });
      const updatedAccount = await response.json();
      return Promise.resolve(updatedAccount);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async archiveAccount(id: string): Promise<Account> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}`, {
        method: "DELETE",
      });
      const archivedAccount = await response.json();
      return Promise.resolve(archivedAccount);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getCreditSummary(id: string): Promise<CreditSummary> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}/credit-summary`);
      const summary = await response.json();
      return Promise.resolve(summary);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const accountService = new AccountService();
export default accountService;
