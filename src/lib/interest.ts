import type { Account, InterestTier, RecurringRule } from "@/types";
import { toMxn } from "./accountTotals";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Interés de un periodo según tramos marginales:
 * `Σ porciónDelTramo × (annualRate / periodsPerYear)`.
 */
export const computeTieredInterest = (
  balance: number,
  tiers: InterestTier[],
  periodsPerYear: number
): number => {
  if (balance <= 0 || tiers.length === 0 || periodsPerYear <= 0) return 0;

  const sorted = [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });

  let previousCap = 0;
  let interest = 0;

  for (const tier of sorted) {
    const cap = tier.upTo ?? Infinity;
    const portion = Math.max(0, Math.min(balance, cap) - previousCap);
    interest += (portion * tier.annualRate) / periodsPerYear;
    previousCap = cap;
    if (balance <= previousCap) break;
  }

  return roundMoney(interest);
};

export const computeDailyInterest = (balance: number, tiers: InterestTier[]): number =>
  computeTieredInterest(balance, tiers, 365);

export const computeMonthlyInterest = (balance: number, tiers: InterestTier[]): number =>
  computeTieredInterest(balance, tiers, 12);

export const computeAnnualInterest = (balance: number, tiers: InterestTier[]): number =>
  computeTieredInterest(balance, tiers, 1);

export type DailyInterestSummary = {
  /** Equivalente diario estimado, en MXN. */
  dailyMxn: number | null;
  /** Equivalente mensual estimado, en MXN. */
  monthlyMxn: number | null;
  /** Equivalente anual estimado, en MXN. */
  annualMxn: number | null;
  accountCount: number;
  ruleCount: number;
  /** Hay reglas sobre cuentas USD y se necesita la tasa FX. */
  needsFx: boolean;
};

/**
 * Resume las reglas de interés activas que apuntan a una cuenta activa.
 * Cada regla se calcula con el saldo actual de su cuenta y se convierte a MXN.
 */
export const summarizeDailyInterest = (
  rules: RecurringRule[],
  accounts: Account[],
  usdRate: number | null
): DailyInterestSummary => {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const activeRules = rules.filter(
    (rule) =>
      rule.type === "interest" && rule.active && accountById.has(rule.accountId)
  );

  const accountIds = new Set<string>();
  let needsFx = false;
  let daily = 0;
  let monthly = 0;
  let annual = 0;
  let convertible = true;

  for (const rule of activeRules) {
    const account = accountById.get(rule.accountId);
    if (!account) continue;

    accountIds.add(account.id);
    if (account.currency === "USD") needsFx = true;

    const tiers = rule.interestTiers ?? [];
    const dailyMxn = toMxn(computeDailyInterest(account.balance, tiers), account.currency, usdRate);
    const monthlyMxn = toMxn(
      computeMonthlyInterest(account.balance, tiers),
      account.currency,
      usdRate
    );
    const annualMxn = toMxn(
      computeAnnualInterest(account.balance, tiers),
      account.currency,
      usdRate
    );

    if (dailyMxn == null || monthlyMxn == null || annualMxn == null) {
      convertible = false;
      continue;
    }

    daily += dailyMxn;
    monthly += monthlyMxn;
    annual += annualMxn;
  }

  return {
    dailyMxn: convertible ? roundMoney(daily) : null,
    monthlyMxn: convertible ? roundMoney(monthly) : null,
    annualMxn: convertible ? roundMoney(annual) : null,
    accountCount: accountIds.size,
    ruleCount: activeRules.length,
    needsFx,
  };
};
