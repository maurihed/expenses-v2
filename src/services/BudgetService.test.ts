import { afterEach, describe, expect, it, vi } from "vitest";
import BudgetService from "./BudgetService";

const mockFetch = (payload: unknown) => {
  const fn = vi
    .fn()
    .mockResolvedValue({ ok: true, text: async () => JSON.stringify(payload) });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
};

describe("BudgetService month conversion", () => {
  afterEach(() => vi.restoreAllMocks());

  it("getBudget convierte el mes 0-indexado a 1-12", async () => {
    const fn = mockFetch({ id: "1", year: 2026, month: 1, amount: 100, currency: "MXN" });
    await BudgetService.getBudget(2026, 0);
    expect(fn.mock.calls[0][0]).toContain("month=1");
  });

  it("upsertBudget envía el mes 1-12", async () => {
    const fn = mockFetch({ id: "1", year: 2026, month: 9, amount: 100, currency: "MXN" });
    await BudgetService.upsertBudget({ year: 2026, month: 8, amount: 100 });
    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body.month).toBe(9);
  });
});
