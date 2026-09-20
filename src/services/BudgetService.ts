import { parseJsonResponse } from "@/lib/http";
import type { Budget, BudgetPayload } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const BUDGETS_URL = `${VITE_API_BASE_URL}/budgets`;

/**
 * La app usa `month` 0-indexado (0 = enero, como `Date.getMonth()`), pero la API
 * de presupuestos usa mes calendario 1-12. Se convierte aquí, en el borde.
 */
class BudgetService {
  public async getBudget(year: number, month: number): Promise<Budget | null> {
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month + 1) });
      const response = await fetch(`${BUDGETS_URL}?${params.toString()}`);
      return await parseJsonResponse<Budget | null>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async upsertBudget(payload: BudgetPayload): Promise<Budget> {
    try {
      const response = await fetch(BUDGETS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, month: payload.month + 1 }),
      });
      return await parseJsonResponse<Budget>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const budgetService = new BudgetService();
export default budgetService;
