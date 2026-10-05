import type { Account, Debt, Transaction } from "@/types";
import { Categories } from "@/types";
import { describe, expect, it } from "vitest";
import { computeMonthStats, computePatrimony } from "./dashboardStats";

const acc = (over: Partial<Account>): Account =>
  ({
    id: over.id ?? Math.random().toString(),
    name: "Cuenta",
    balance: 0,
    type: "CASH",
    currency: "MXN",
    ...over,
  }) as Account;

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    id: Math.random().toString(),
    type: "expense",
    accountId: "a",
    amount: 0,
    description: "x",
    date: new Date(),
    category: Categories.OTROS,
    ...over,
  }) as Transaction;

const debt = (over: Partial<Debt>): Debt =>
  ({
    id: Math.random().toString(),
    type: "payable",
    counterparty: "x",
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

describe("computePatrimony", () => {
  it("resta crédito y deudas por pagar de los activos", () => {
    const result = computePatrimony(
      [
        acc({ type: "CASH", balance: 10000 }),
        acc({ type: "CREDIT", balance: 3000 }),
      ],
      [debt({ type: "payable", remaining: 500 }), debt({ type: "receivable", remaining: 200 })],
      17
    );
    expect(result.assetsMxn).toBe(7000); // 10000 - 3000
    expect(result.debtsMxn).toBe(3500); // 3000 + 500
    expect(result.netMxn).toBe(3500);
  });

  it("devuelve null si falta la tasa para una cuenta USD", () => {
    const result = computePatrimony([acc({ type: "CASH", currency: "USD", balance: 10 })], [], null);
    expect(result.assetsMxn).toBeNull();
    expect(result.netMxn).toBeNull();
  });

  it("sin deudas el patrimonio es el dinero total", () => {
    const result = computePatrimony([acc({ balance: 250 })], [], null);
    expect(result.debtsMxn).toBe(0);
    expect(result.netMxn).toBe(250);
  });
});

describe("computeMonthStats", () => {
  const today = new Date(2026, 8, 10); // 10 sep 2026

  it("calcula ingresos, gastos, balance y tasa de ahorro", () => {
    const stats = computeMonthStats(
      [
        tx({ type: "income", amount: 1000 }),
        tx({ type: "expense", amount: 300 }),
        tx({ type: "expense", amount: 100 }),
        tx({ type: "transfer", amount: 50 }),
      ],
      8,
      2026,
      today
    );
    expect(stats.income).toBe(1000);
    expect(stats.expense).toBe(400);
    expect(stats.balance).toBe(600);
    expect(stats.savingsRate).toBeCloseTo(0.6, 6);
    expect(stats.count).toBe(4);
  });

  it("promedia sobre los días transcurridos en el mes actual", () => {
    const stats = computeMonthStats([tx({ type: "expense", amount: 500 })], 8, 2026, today);
    expect(stats.avgDaily).toBeCloseTo(50, 6); // 500 / 10 días
  });

  it("promedia sobre el mes completo en un mes pasado", () => {
    const stats = computeMonthStats([tx({ type: "expense", amount: 300 })], 6, 2026, today);
    expect(stats.avgDaily).toBeCloseTo(300 / 31, 6);
  });

  it("encuentra la categoría con más gasto", () => {
    const stats = computeMonthStats(
      [
        tx({ type: "expense", amount: 100, category: Categories.RESTAURANTE }),
        tx({ type: "expense", amount: 700, category: Categories.VIVIENTE }),
        tx({ type: "expense", amount: 200, category: Categories.RESTAURANTE }),
      ],
      8,
      2026,
      today
    );
    expect(stats.topCategory).toEqual({ category: Categories.VIVIENTE, amount: 700 });
  });

  it("sin ingresos la tasa de ahorro es null", () => {
    const stats = computeMonthStats([tx({ type: "expense", amount: 100 })], 8, 2026, today);
    expect(stats.savingsRate).toBeNull();
  });

  it("sin movimientos devuelve ceros", () => {
    const stats = computeMonthStats([], 8, 2026, today);
    expect(stats).toMatchObject({
      income: 0,
      expense: 0,
      balance: 0,
      avgDaily: 0,
      count: 0,
      topCategory: null,
    });
  });
});
