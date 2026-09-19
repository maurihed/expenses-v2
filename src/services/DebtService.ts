import { parseJsonResponse } from "@/lib/http";
import type {
  Debt,
  DebtPayload,
  DebtPayment,
  DebtPaymentPayload,
  DebtType,
} from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const DEBTS_URL = `${VITE_API_BASE_URL}/debts`;

class DebtService {
  public async getDebts(includeArchived = false, type?: DebtType): Promise<Debt[]> {
    try {
      const params = new URLSearchParams();
      if (includeArchived) params.set("includeArchived", "true");
      if (type) params.set("type", type);
      const query = params.toString();
      const response = await fetch(query ? `${DEBTS_URL}?${query}` : DEBTS_URL);
      return await parseJsonResponse<Debt[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createDebt(payload: DebtPayload): Promise<Debt> {
    try {
      const response = await fetch(DEBTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Debt>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateDebt(id: string, payload: Partial<DebtPayload>): Promise<Debt> {
    try {
      const response = await fetch(`${DEBTS_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Debt>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async archiveDebt(id: string): Promise<void> {
    try {
      const response = await fetch(`${DEBTS_URL}/${id}`, { method: "DELETE" });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getPayments(debtId: string): Promise<DebtPayment[]> {
    try {
      const response = await fetch(`${DEBTS_URL}/${debtId}/payments`);
      return await parseJsonResponse<DebtPayment[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async addPayment(debtId: string, payload: DebtPaymentPayload): Promise<Debt> {
    try {
      const response = await fetch(`${DEBTS_URL}/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<Debt>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async removePayment(debtId: string, paymentId: string): Promise<Debt> {
    try {
      const response = await fetch(`${DEBTS_URL}/${debtId}/payments/${paymentId}`, {
        method: "DELETE",
      });
      return await parseJsonResponse<Debt>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const debtService = new DebtService();
export default debtService;
