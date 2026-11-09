import { ExpenseSection } from "@/components/ui/expense-section";
import {
  convertTotalsToMxn,
  netTotalsByCurrency,
  sumCreditDebtToMxn,
  sumInvestments,
} from "@/lib/accountTotals";
import { debtTotalsToMxn } from "@/lib/debtTotals";
import { summarizeDailyInterest } from "@/lib/interest";
import { cn, formatMoney, getMonthName } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { ReactNode } from "react";
import { useDebts } from "../../hooks/useDebts";
import { useMonthlySpending } from "../../hooks/useMonthlySpending";
import { usePositionsSummary } from "../../hooks/usePositionsSummary";
import { useRecurring } from "../../hooks/useRecurring";
import CreditPeriodTotal from "./CreditPeriodTotal";

const signedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
const signedMoney = (value: number) =>
  `${value > 0 ? "+" : ""}${formatMoney(value, "MXN")}`;
const moneyOrDash = (value: number | null) =>
  value != null ? formatMoney(value, "MXN") : "—";

function StatCard({
  label,
  value,
  children,
  loading = false,
  error = false,
  tone,
}: {
  label: string;
  value: string;
  children?: ReactNode;
  loading?: boolean;
  error?: boolean;
  tone?: "positive" | "negative";
}) {
  return (
    <ExpenseSection className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative"
        )}
      >
        {loading ? "…" : error ? "—" : value}
      </p>
      {error ? (
        <p className="mt-1 text-xs text-destructive">No se pudo cargar</p>
      ) : (
        !loading && children && <div className="mt-1 flex flex-col gap-0.5">{children}</div>
      )}
    </ExpenseSection>
  );
}

function StatCards() {
  const {
    accounts: allAccounts,
    loadingAccounts,
    accountsError,
    usdRate,
    loadingFx,
    fxError,
    spentMxn,
    loading: spentLoading,
    error: spentError,
  } = useMonthlySpending();
  const { debts, loadingDebts, error: debtsError } = useDebts();
  const { rules, loadingRules, error: rulesError } = useRecurring();
  const { month, year } = useExpensesStore((state) => state.monthYear);

  const accounts = allAccounts.filter((account) => !account.archived);
  const totals = netTotalsByCurrency(accounts);
  const totalMxn = convertTotalsToMxn(totals, usdRate);
  const hasForeign = totals.some((entry) => entry.currency !== "MXN");
  const perCurrency = totals.map(({ currency, total }) => formatMoney(total, currency)).join(" · ");

  const investmentAccounts = accounts.filter((account) => account.type === "INVESTMENT");
  const investmentsMxn = sumInvestments(accounts, usdRate);

  const creditDebtMxn = sumCreditDebtToMxn(accounts, usdRate);
  const debtTotals = debtTotalsToMxn(debts, usdRate);
  const debtActual =
    creditDebtMxn != null && debtTotals.payable != null
      ? creditDebtMxn + debtTotals.payable
      : null;
  const hasReceivables = debts.some((debt) => debt.type === "receivable");
  const showReceivable =
    debtTotals.receivable == null ? hasReceivables : debtTotals.receivable > 0;

  const needsFx =
    accounts.some((account) => account.type === "CREDIT" && account.currency === "USD") ||
    debts.some((debt) => debt.currency === "USD");
  const debtLoading = loadingAccounts || loadingDebts || (needsFx && loadingFx);
  const debtError = Boolean(
    accountsError || debtsError || (needsFx && Boolean(fxError))
  );

  const interest = summarizeDailyInterest(rules, accounts, usdRate);
  const interestLoading = loadingRules || loadingAccounts || (interest.needsFx && loadingFx);
  const interestError = Boolean(
    rulesError || accountsError || (interest.needsFx && Boolean(fxError))
  );

  const {
    summary: positions,
    loading: loadingPositions,
    error: positionsQueryError,
  } = usePositionsSummary(accounts, usdRate);
  const positionsLoading = loadingPositions || (positions.needsFx && loadingFx);
  const positionsError = Boolean(
    positionsQueryError || (positions.needsFx && Boolean(fxError))
  );
  const positionsTone =
    positions.changePercent == null
      ? undefined
      : positions.changePercent > 0
        ? "positive"
        : positions.changePercent < 0
          ? "negative"
          : undefined;
  const bestText = positions.best
    ? `Mejor ${positions.best.symbol} ${signedPercent(positions.best.changePercent)}`
    : null;
  const worstText =
    positions.worst && positions.worst.changePercent < 0
      ? `Peor ${positions.worst.symbol} ${signedPercent(positions.worst.changePercent)}`
      : null;
  const extremesText = [bestText, worstText].filter(Boolean).join(" · ");

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatCard
        label="Dinero total"
        value={totalMxn != null ? formatMoney(totalMxn, "MXN") : "—"}
      >
        {totalMxn != null
          ? hasForeign && <span className="text-xs text-muted-foreground tabular-nums">{perCurrency}</span>
          : totals.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{perCurrency}</span>
            )}
      </StatCard>

      <StatCard
        label="Inversiones"
        value={
          investmentAccounts.length === 0
            ? "—"
            : investmentsMxn != null
              ? formatMoney(investmentsMxn, "MXN")
              : "—"
        }
      >
        <span className="text-xs text-muted-foreground">
          {investmentAccounts.length === 0
            ? "Sin cuentas de inversión"
            : `${investmentAccounts.length} cuenta${investmentAccounts.length === 1 ? "" : "s"}`}
        </span>
      </StatCard>

      <StatCard
        label="Deuda actual"
        value={debtActual != null ? formatMoney(debtActual, "MXN") : "—"}
        loading={debtLoading}
        error={debtError}
      >
        <span className="text-xs text-muted-foreground tabular-nums">
          Crédito {creditDebtMxn != null ? formatMoney(creditDebtMxn, "MXN") : "—"} · Por pagar{" "}
          {debtTotals.payable != null ? formatMoney(debtTotals.payable, "MXN") : "—"}
        </span>
        {showReceivable && (
          <span className="text-xs text-muted-foreground tabular-nums">
            Por cobrar{" "}
            {debtTotals.receivable != null ? formatMoney(debtTotals.receivable, "MXN") : "—"}
          </span>
        )}
        <CreditPeriodTotal
          accounts={accounts}
          usdRate={usdRate}
          loadingFx={loadingFx}
          fxError={Boolean(fxError)}
        />
        {debtActual == null && (
          <span className="text-xs text-muted-foreground">No se pudo convertir a MXN</span>
        )}
      </StatCard>

      <StatCard
        label={`Gastado en ${getMonthName(month)}`}
        value={spentMxn != null ? formatMoney(spentMxn, "MXN") : "—"}
        loading={spentLoading}
        error={Boolean(spentError)}
      >
        <span className="text-xs text-muted-foreground tabular-nums">{year}</span>
        {spentMxn == null && (
          <span className="text-xs text-muted-foreground">No se pudo convertir a MXN</span>
        )}
      </StatCard>

      <StatCard
        label="Interés diario"
        value={interest.ruleCount === 0 ? "—" : moneyOrDash(interest.dailyMxn)}
        loading={interestLoading}
        error={interestError}
        tone={interest.dailyMxn != null && interest.dailyMxn > 0 ? "positive" : undefined}
      >
        {interest.ruleCount === 0 ? (
          <span className="text-xs text-muted-foreground">Sin reglas de interés activas</span>
        ) : (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              Mensual ≈ {moneyOrDash(interest.monthlyMxn)} · Anual ≈{" "}
              {moneyOrDash(interest.annualMxn)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {interest.accountCount} cuenta{interest.accountCount === 1 ? "" : "s"} ·{" "}
              {interest.ruleCount} regla{interest.ruleCount === 1 ? "" : "s"} activa
              {interest.ruleCount === 1 ? "" : "s"}
            </span>
            {interest.dailyMxn == null && (
              <span className="text-xs text-muted-foreground">No se pudo convertir a MXN</span>
            )}
          </>
        )}
      </StatCard>

      <StatCard
        label="Posiciones"
        value={
          positions.positionCount === 0 || positions.changePercent == null
            ? "—"
            : signedPercent(positions.changePercent)
        }
        loading={positionsLoading}
        error={positionsError}
        tone={positionsTone}
      >
        {positions.positionCount === 0 ? (
          <span className="text-xs text-muted-foreground">
            {investmentAccounts.length === 0 ? "Sin cuentas de inversión" : "Sin posiciones"}
          </span>
        ) : (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              Hoy{" "}
              {positions.dailyChangeMxn != null ? signedMoney(positions.dailyChangeMxn) : "—"}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {positions.positionCount}{" "}
              {positions.positionCount === 1 ? "posición" : "posiciones"} · Valor{" "}
              {moneyOrDash(positions.currentValueMxn)}
            </span>
            {extremesText && (
              <span className="text-xs text-muted-foreground tabular-nums">{extremesText}</span>
            )}
            {positions.staleCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {positions.staleCount} precio{positions.staleCount === 1 ? "" : "s"} en caché
              </span>
            )}
            {positions.changePercent == null && (
              <span className="text-xs text-muted-foreground">
                Sin cierre anterior para calcular la variación
              </span>
            )}
          </>
        )}
      </StatCard>
    </div>
  );
}

export default StatCards;
