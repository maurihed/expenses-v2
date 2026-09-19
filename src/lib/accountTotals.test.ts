import type { Account } from "@/types";
import { describe, expect, it } from "vitest";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumInvestments,
  toMxn,
} from "./accountTotals";

const acc = (over: Partial<Account>): Account =>
  ({
    id: over.id ?? Math.random().toString(),
    name: "Cuenta",
    balance: 0,
    type: "CASH",
    currency: "MXN",
    ...over,
  }) as Account;

describe("netTotalsByCurrency", () => {
  it("agrupa por moneda y resta el crédito", () => {
    const totals = netTotalsByCurrency([
      acc({ balance: 1000, type: "DEBIT", currency: "MXN" }),
      acc({ balance: 500, type: "CREDIT", currency: "MXN" }),
      acc({ balance: 100, type: "CASH", currency: "USD" }),
    ]);
    expect(totals).toEqual([
      { currency: "MXN", total: 500 },
      { currency: "USD", total: 100 },
    ]);
  });
});

describe("toMxn", () => {
  it("MXN es identidad", () => {
    expect(toMxn(100, "MXN", null)).toBe(100);
    expect(toMxn(100, "MXN", 17)).toBe(100);
  });

  it("USD usa la tasa", () => {
    expect(toMxn(10, "USD", 17.5)).toBeCloseTo(175, 6);
  });

  it("USD sin tasa devuelve null", () => {
    expect(toMxn(10, "USD", null)).toBeNull();
  });
});

describe("convertTotalsToMxn", () => {
  it("convierte y suma monedas mezcladas con tasa", () => {
    expect(
      convertTotalsToMxn(
        [
          { currency: "MXN", total: 1000 },
          { currency: "USD", total: 10 },
        ],
        17.5
      )
    ).toBeCloseTo(1175, 6);
  });

  it("devuelve null si falta la tasa para una moneda extranjera", () => {
    expect(
      convertTotalsToMxn(
        [
          { currency: "MXN", total: 1000 },
          { currency: "USD", total: 10 },
        ],
        null
      )
    ).toBeNull();
  });

  it("funciona con solo MXN aunque no haya tasa", () => {
    expect(convertTotalsToMxn([{ currency: "MXN", total: 250 }], null)).toBe(250);
  });
});

describe("sumInvestments", () => {
  it("suma cuentas de inversión convertidas a MXN", () => {
    expect(
      sumInvestments(
        [
          acc({ type: "INVESTMENT", currency: "MXN", balance: 5000 }),
          acc({ type: "INVESTMENT", currency: "USD", balance: 100 }),
          acc({ type: "CASH", currency: "MXN", balance: 9999 }),
        ],
        17
      )
    ).toBeCloseTo(6700, 6);
  });

  it("devuelve null si una inversión USD no tiene tasa", () => {
    expect(sumInvestments([acc({ type: "INVESTMENT", currency: "USD", balance: 1 })], null)).toBeNull();
  });

  it("sin inversiones suma 0", () => {
    expect(sumInvestments([acc({ type: "CASH", balance: 100 })], null)).toBe(0);
  });
});
