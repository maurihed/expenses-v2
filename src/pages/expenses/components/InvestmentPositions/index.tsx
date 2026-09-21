import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { cn, formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { Account, Holding } from "@/types";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useHoldings } from "../../hooks/useHoldings";

type Props = {
  account: Account;
  onAdd: () => void;
  onEdit: (holding: Holding) => void;
};

function InvestmentPositions({ account, onAdd, onEdit }: Props) {
  const { portfolio, loadingHoldings, holdingsError, refreshHoldings } = useHoldings(account.id);
  const openEditAccountModal = useExpensesStore((state) => state.openEditAccountModal);

  if (loadingHoldings) {
    return (
      <ExpenseSection className="p-4">
        <Loader />
      </ExpenseSection>
    );
  }

  if (holdingsError) {
    return (
      <ExpenseSection className="p-4">
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-destructive">Error al cargar posiciones</p>
          <Button
            variant="outline"
            className="h-11 cursor-pointer"
            onClick={() => refreshHoldings()}
          >
            Reintentar
          </Button>
        </div>
      </ExpenseSection>
    );
  }

  const holdings = portfolio?.holdings ?? [];

  return (
    <ExpenseSection className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Valor total</p>
          <p className="text-2xl font-bold tabular-nums">
            {portfolio?.totalValue != null
              ? formatMoney(portfolio.totalValue, account.currency)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Efectivo {formatMoney(portfolio?.cashBalance ?? 0, account.currency)}
            {" · "}
            Posiciones{" "}
            {portfolio?.positionsValue != null
              ? formatMoney(portfolio.positionsValue, account.currency)
              : "—"}
          </p>
          {portfolio?.changePercent != null && (
            <span
              className={cn(
                "mt-1 flex items-center gap-1 text-sm tabular-nums",
                portfolio.changePercent >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {portfolio.changePercent >= 0 ? (
                <TrendingUp className="size-4" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-4" aria-hidden="true" />
              )}
              {portfolio.changePercent >= 0 ? "+" : ""}
              {portfolio.changePercent.toFixed(2)}% hoy
            </span>
          )}
          {portfolio?.stale && (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              Precio en caché
            </span>
          )}
        </div>
        <Button
          variant="outline"
          className="h-11 cursor-pointer"
          onClick={() => openEditAccountModal(account)}
        >
          Editar cuenta
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg">Posiciones</h3>
        <Button className="h-11 cursor-pointer" onClick={onAdd}>
          Agregar ETF
        </Button>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="font-display text-lg">Aún no tienes ETFs</p>
          <p className="text-sm text-muted-foreground">
            Agrega tu primer ETF para ver su valor de mercado.
          </p>
          <Button className="h-11 cursor-pointer" onClick={onAdd}>
            Agregar ETF
          </Button>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {holdings.map((holding) => (
            <li key={holding.id}>
              <button
                type="button"
                onClick={() => onEdit(holding)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors duration-200 hover:bg-muted"
              >
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {holding.symbol}
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-medium">
                    {holding.name ?? holding.symbol}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {holding.quantity} ×{" "}
                    {holding.price != null ? formatMoney(holding.price, holding.currency) : "—"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {holding.marketValueAccountCurrency != null
                      ? formatMoney(holding.marketValueAccountCurrency, account.currency)
                      : "—"}
                  </span>
                  {holding.changePercent != null && (
                    <span
                      className={cn(
                        "block text-xs tabular-nums",
                        holding.changePercent >= 0 ? "text-positive" : "text-negative"
                      )}
                    >
                      {holding.changePercent >= 0 ? "+" : ""}
                      {holding.changePercent.toFixed(2)}%
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ExpenseSection>
  );
}

export default InvestmentPositions;
