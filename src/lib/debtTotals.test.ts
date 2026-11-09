import type { Debt } from "@/types";
import { describe, expect, it } from "vitest";
import { debtTotalsToMxn } from "./debtTotals";

const debt = (over: Partial<Debt>): Debt => {
  const amount = over.amount ?? 0;
  const paid = over.paid ?? 0;
  return {
    id: over.id ?? Math.random().toString(),
    type: "receivable",
    counterparty: "X",
    amount,
    currency: "MXN",
    date: "2026-01-01",
    dueDate: null,
    notes: null,
    archived: false,
    paid,
    remaining: Math.max(0, amount - paid),
    status: "OPEN",
    ...over,
  } as Debt;
};

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

  it("marca null solo el lado que no se puede convertir", () => {
    const result = debtTotalsToMxn(
      [
        debt({ type: "payable", amount: 1000 }),
        debt({ type: "receivable", amount: 10, currency: "USD" }),
      ],
      null
    );
    expect(result).toEqual({ payable: 1000, receivable: null });
  });

  it("mantiene las deudas por cobrar si una por pagar no se puede convertir", () => {
    const result = debtTotalsToMxn(
      [
        debt({ type: "payable", amount: 10, currency: "USD" }),
        debt({ type: "receivable", amount: 500 }),
      ],
      null
    );
    expect(result).toEqual({ payable: null, receivable: 500 });
  });

  it("sin deudas devuelve ceros", () => {
    expect(debtTotalsToMxn([], null)).toEqual({ payable: 0, receivable: 0 });
  });
});
