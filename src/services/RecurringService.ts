import { parseJsonResponse } from "@/lib/http";
import type { RecurringRule, RecurringRulePayload, RecurringRunResult } from "@/types";

const { VITE_API_BASE_URL } = import.meta.env;
const RECURRING_URL = `${VITE_API_BASE_URL}/recurring`;

class RecurringService {
  public async getRules(includeInactive = false): Promise<RecurringRule[]> {
    try {
      const url = includeInactive ? `${RECURRING_URL}?includeInactive=true` : RECURRING_URL;
      const response = await fetch(url);
      return await parseJsonResponse<RecurringRule[]>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async createRule(payload: RecurringRulePayload): Promise<RecurringRule> {
    try {
      const response = await fetch(RECURRING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<RecurringRule>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async updateRule(
    id: string,
    payload: Partial<RecurringRulePayload>
  ): Promise<RecurringRule> {
    try {
      const response = await fetch(`${RECURRING_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await parseJsonResponse<RecurringRule>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async deactivateRule(id: string): Promise<void> {
    try {
      const response = await fetch(`${RECURRING_URL}/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse<unknown>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async runNow(): Promise<RecurringRunResult> {
    try {
      const response = await fetch(`${RECURRING_URL}/run`, {
        method: "POST",
      });
      return await parseJsonResponse<RecurringRunResult>(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const recurringService = new RecurringService();
export default recurringService;
