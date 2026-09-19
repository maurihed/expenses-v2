import type { Debt } from "@/types";
import { describe, expect, it } from "vitest";
import { debtTotalsToMxn } from "./debtTotals";

const debt = (over: Partial<Debt>): Debt =>
  ({
    id: over.id ?? Math.random().toString(),
    type: "receivable",
    counterparty: "X",
    amount: 0,
    currency: "MXN",
    date: "2026-01-01",
    dueDate: null,
    notes: null,
    archived: false,
    paid: 0,
    remaining: 0,
    status: "OPEN",
    ...over,
  }) as Debt;

describe("debtTotalsToMxn", () => {
  it("separa por pagar y por cobrar usando el pendiente", () => {
    const result = debtTotalsToMxn(
      [
        debt({ type: "payable", amount: 1000, paid: 400 }),
        debt({ type: "receivable", amount: 500, paid: 0 }),
      ],
      null
    );
    expect(result).toEqual({ payable: 600, receivable: 500 });
  });

  it("convierte deudas en USD con la tasa", () => {
    const result = debtTotalsToMxn([debt({ type: "payable", amount: 10, currency: "USD" })], 17);
    expect(result).toEqual({ payable: 170, receivable: 0 });
  });

  it("devuelve null si una deuda USD no tiene tasa", () => {
    expect(debtTotalsToMxn([debt({ currency: "USD", amount: 10 })], null)).toBeNull();
  });

  it("sin deudas devuelve ceros", () => {
    expect(debtTotalsToMxn([], null)).toEqual({ payable: 0, receivable: 0 });
  });
});
