import type { Account, Transaction } from "@/types";
import { describe, expect, it } from "vitest";
import { sumExpensesToMxn } from "./expenseTotals";

const account = (over: Partial<Account>): Account =>
  ({
    id: over.id ?? Math.random().toString(),
    name: "Cuenta",
    balance: 0,
    type: "CASH",
    currency: "MXN",
    ...over,
  }) as Account;

const transaction = (over: Partial<Transaction>): Transaction =>
  ({
    id: over.id ?? Math.random().toString(),
    type: "expense",
    accountId: "account",
    amount: 0,
    description: "Movimiento",
    date: new Date("2026-01-01"),
    category: "Otros",
    ...over,
  }) as Transaction;

describe("sumExpensesToMxn", () => {
  it("suma solo gastos en MXN sin necesitar tasa", () => {
    expect(
      sumExpensesToMxn(
        [
          transaction({ accountId: "mxn", amount: 100 }),
          transaction({ accountId: "mxn", amount: 50 }),
          transaction({ accountId: "mxn", amount: 999, type: "income" }),
          transaction({ accountId: "mxn", amount: 999, type: "transfer" }),
        ],
        [account({ id: "mxn", currency: "MXN" })],
        null
      )
    ).toBe(150);
  });

  it("convierte los gastos de cuentas en USD con la tasa", () => {
    expect(
      sumExpensesToMxn(
        [
          transaction({ accountId: "mxn", amount: 100 }),
          transaction({ accountId: "usd", amount: 10 }),
        ],
        [account({ id: "mxn", currency: "MXN" }), account({ id: "usd", currency: "USD" })],
        17.5
      )
    ).toBeCloseTo(275, 6);
  });

  it("devuelve null si un gasto USD no tiene tasa", () => {
    expect(
      sumExpensesToMxn(
        [transaction({ accountId: "usd", amount: 10 })],
        [account({ id: "usd", currency: "USD" })],
        null
      )
    ).toBeNull();
  });

  it("devuelve null si la cuenta del gasto no está disponible", () => {
    expect(sumExpensesToMxn([transaction({ accountId: "missing", amount: 10 })], [], null)).toBeNull();
  });

  it("sin gastos suma 0", () => {
    expect(sumExpensesToMxn([], [], null)).toBe(0);
  });
});
