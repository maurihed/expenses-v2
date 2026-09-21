import { parseJsonResponse } from "@/lib/http";
import type {
  Account,
  AccountPayload,
  CreditSummary,
  Holding,
  HoldingPayload,
  PortfolioSummary,
} from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const ACCOUNTS_URL = `${VITE_API_BASE_URL}/accounts`;

class AccountService {
  public async getAccounts(includeArchived = false): Promise<Account[]> {
    try {
      const url = includeArchived ? `${ACCOUNTS_URL}?includeArchived=true` : ACCOUNTS_URL;
      const response = await fetch(url);
      return await parseJsonResponse<Account[]>(response);
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
      return await parseJsonResponse<Account>(response);
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
      return await parseJsonResponse<Account>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async archiveAccount(id: string): Promise<void> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getCreditSummary(id: string): Promise<CreditSummary> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}/credit-summary`);
      return await parseJsonResponse<CreditSummary>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getHoldings(accountId: string): Promise<PortfolioSummary> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings`);
      return await parseJsonResponse<PortfolioSummary>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createHolding(accountId: string, payload: HoldingPayload): Promise<Holding> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Holding>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateHolding(
    accountId: string,
    holdingId: string,
    payload: HoldingPayload
  ): Promise<Holding> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings/${holdingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Holding>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async deleteHolding(accountId: string, holdingId: string): Promise<void> {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${accountId}/holdings/${holdingId}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const accountService = new AccountService();
export default accountService;
