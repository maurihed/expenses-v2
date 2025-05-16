import type { Account } from "@/types";

const { VITE_GO_BASE_URL } = import.meta.env;
const ACCOUNTS_URL = `${VITE_GO_BASE_URL}/accounts`;

class AccountService {
  public async addAccount(account: Account): Promise<Account> {
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

  public async updateAccountBalance({
    accountId,
    newBalance,
  }: {
    accountId: string;
    newBalance: number;
  }): Promise<Account> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}`);
      const account = await response.json();

      const adjustedBalance = account.balance + newBalance;

      await fetch(`${ACCOUNTS_URL}/${accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...account, balance: adjustedBalance }),
      });
      return Promise.resolve({ ...account, balance: adjustedBalance });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getAccounts(): Promise<Account[]> {
    try {
      const response = await fetch(ACCOUNTS_URL);
      const accounts = await response.json();
      return Promise.resolve(accounts);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const accountService = new AccountService();
export default accountService;
