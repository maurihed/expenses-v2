import type { Account, InterestTier, RecurringRule } from "@/types";
import { describe, expect, it } from "vitest";
import {
  computeAnnualInterest,
  computeDailyInterest,
  computeMonthlyInterest,
  summarizeDailyInterest,
} from "./interest";

const account = (over: Partial<Account>): Account =>
  ({
    id: over.id ?? Math.random().toString(),
    name: "Cuenta",
    balance: 0,
    type: "INVESTMENT",
    currency: "MXN",
    creditLimit: null,
    statementClosingDay: null,
    paymentDueDay: null,
    archived: false,
    ...over,
  }) as Account;

const rule = (over: Partial<RecurringRule>): RecurringRule =>
  ({
    id: over.id ?? Math.random().toString(),
    name: "Interés",
    type: "interest",
    accountId: "account",
    categoryId: null,
    scope: "joint",
    personId: null,
    amount: null,
    frequency: "monthly",
    dayOfMonth: null,
    dayOfWeek: null,
    startDate: "2026-01-01",
    endDate: null,
    nextRunDate: "2026-02-01",
    lastRunDate: null,
    interestTiers: [{ upTo: null, annualRate: 0.1 }],
    active: true,
    ...over,
  }) as RecurringRule;

const tiers: InterestTier[] = [
  { upTo: 10000, annualRate: 0.1 },
  { upTo: null, annualRate: 0.02 },
];

describe("computeTieredInterest", () => {
  it("calcula tramos marginales sobre el saldo", () => {
    expect(computeMonthlyInterest(15000, tiers)).toBe(91.67);
  });

  it("calcula equivalentes diario y anual", () => {
    expect(computeDailyInterest(15000, tiers)).toBe(3.01);
    expect(computeAnnualInterest(15000, tiers)).toBe(1100);
  });

  it("ordena los tramos por límite", () => {
    expect(
      computeMonthlyInterest(15000, [
        { upTo: null, annualRate: 0.02 },
        { upTo: 10000, annualRate: 0.1 },
      ])
    ).toBe(91.67);
  });

  it("devuelve 0 sin tramos o sin saldo", () => {
    expect(computeMonthlyInterest(1000, [])).toBe(0);
    expect(computeMonthlyInterest(0, tiers)).toBe(0);
  });
});

describe("summarizeDailyInterest", () => {
  it("suma las reglas activas de interés y convierte USD", () => {
    const result = summarizeDailyInterest(
      [
        rule({ accountId: "mxn", interestTiers: [{ upTo: null, annualRate: 0.1 }] }),
        rule({
          accountId: "usd",
          interestTiers: [{ upTo: null, annualRate: 0.05 }],
        }),
        rule({ accountId: "mxn", active: false }),
        rule({ accountId: "mxn", type: "income" }),
      ],
      [
        account({ id: "mxn", balance: 100000, currency: "MXN" }),
        account({ id: "usd", balance: 1000, currency: "USD" }),
      ],
      20
    );

    expect(result.ruleCount).toBe(2);
    expect(result.accountCount).toBe(2);
    expect(result.needsFx).toBe(true);
    expect(result.dailyMxn).toBeCloseTo(30.2, 6);
    expect(result.monthlyMxn).toBeCloseTo(916.73, 6);
    expect(result.annualMxn).toBeCloseTo(11000, 6);
  });

  it("devuelve null si falta la tasa de una cuenta USD", () => {
    const result = summarizeDailyInterest(
      [rule({ accountId: "usd" })],
      [account({ id: "usd", balance: 1000, currency: "USD" })],
      null
    );

    expect(result.dailyMxn).toBeNull();
    expect(result.monthlyMxn).toBeNull();
    expect(result.annualMxn).toBeNull();
    expect(result.needsFx).toBe(true);
  });

  it("ignora reglas cuya cuenta ya no está activa", () => {
    const result = summarizeDailyInterest(
      [rule({ accountId: "archived" })],
      [],
      null
    );

    expect(result.ruleCount).toBe(0);
    expect(result.accountCount).toBe(0);
    expect(result.dailyMxn).toBe(0);
  });

  it("sin reglas devuelve ceros", () => {
    expect(summarizeDailyInterest([], [], null)).toEqual({
      dailyMxn: 0,
      monthlyMxn: 0,
      annualMxn: 0,
      accountCount: 0,
      ruleCount: 0,
      needsFx: false,
    });
  });
});
