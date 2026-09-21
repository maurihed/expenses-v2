import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import { netTotalsByCurrency, toMxn } from "@/lib/accountTotals";
import { cn, formatMoney } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import type { AccountType } from "@/types";
import { Pencil, Plus, Wallet, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";
import { useAccounts } from "../hooks/useAccounts";
import { useFxRate } from "../hooks/useFxRate";
import AccountModal from "./AccountModal";
import CreditSummary from "./AccountList/CreditSummary";
import PayCardDrawer from "./AccountList/PayCardDrawer";

const typeLabels: Record<AccountType, string> = {
  CASH: "Efectivo",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  INVESTMENT: "Inversión",
};

function AccountList() {
  const { accounts, loadingAccounts, error, refreshAccounts } = useAccounts();
  const openTransactionModal = useExpensesStore((state) => state.openNewTransactionModal);
  const openNewAccountModal = useExpensesStore((state) => state.openNewAccountModal);
  const openEditAccountModal = useExpensesStore((state) => state.openEditAccountModal);
  const openPayCardDrawer = useExpensesStore((state) => state.openPayCardDrawer);
  const { fx } = useFxRate();
  const usdRate = fx?.rate ?? null;
  const navigate = useNavigate();

  const totalsByCurrency = netTotalsByCurrency(accounts);

  return (
    <>
      <ExpenseSection className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg">Tus cuentas</h3>
          <Button className="cursor-pointer" onClick={openNewAccountModal}>
            <Plus />
            Agregar cuenta
          </Button>
        </div>

        {loadingAccounts && <Loader />}

        {!loadingAccounts && Boolean(error) && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">Error al cargar cuentas</p>
            <Button variant="outline" onClick={() => refreshAccounts()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loadingAccounts && !error && accounts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="rounded-full bg-primary-100 p-3">
              <Wallet className="text-primary-700" aria-hidden="true" />
            </span>
            <p className="font-display text-lg">Sin cuentas</p>
            <p className="text-sm text-muted-foreground">
              Agrega tu primera cuenta para empezar.
            </p>
            <Button className="cursor-pointer" onClick={openNewAccountModal}>
              <Plus />
              Agregar cuenta
            </Button>
          </div>
        )}

        {!loadingAccounts && !error && accounts.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {accounts.map((account) => {
              const isCredit = account.type === "CREDIT";
              return (
                <div
                  key={account.id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openEditAccountModal(account)}
                      className="flex min-w-0 grow flex-col items-start gap-1 text-left cursor-pointer"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-display font-semibold">{account.name}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide",
                            isCredit
                              ? "bg-primary-100 text-primary-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {typeLabels[account.type]}
                        </span>
                      </span>
                      {!isCredit && account.type !== "INVESTMENT" && (
                        <>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              account.balance < 0 && "text-destructive"
                            )}
                          >
                            {formatMoney(account.balance, account.currency)}
                          </span>
                          {account.currency === "USD" && usdRate != null && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              ≈ {formatMoney(toMxn(account.balance, "USD", usdRate) ?? 0, "MXN")}
                            </span>
                          )}
                        </>
                      )}

                      {account.type === "INVESTMENT" && (
                        <>
                          <span className="font-semibold tabular-nums">
                            {account.totalValue != null
                              ? formatMoney(account.totalValue, account.currency)
                              : "—"}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            Efectivo {formatMoney(account.cashBalance ?? account.balance, account.currency)}
                            {" · "}
                            Posiciones{" "}
                            {account.positionsValue != null
                              ? formatMoney(account.positionsValue, account.currency)
                              : "—"}
                          </span>
                          {account.totalValue == null && (
                            <span className="text-xs text-destructive">
                              Sin precio para alguna posición
                            </span>
                          )}
                          {account.stale && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" aria-hidden="true" />
                              Precio en caché
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="cursor-pointer"
                        aria-label={`Editar ${account.name}`}
                        onClick={() => openEditAccountModal(account)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="cursor-pointer"
                        aria-label={`Agregar transacción a ${account.name}`}
                        onClick={() => openTransactionModal(account.id)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>

                  {account.type === "INVESTMENT" && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Button
                        className="cursor-pointer"
                        onClick={() => navigate(`/cuentas/${account.id}`)}
                      >
                        Posiciones
                      </Button>
                      {account.changePercent != null && (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm tabular-nums",
                            account.changePercent >= 0 ? "text-positive" : "text-negative"
                          )}
                        >
                          {account.changePercent >= 0 ? (
                            <TrendingUp className="size-4" aria-hidden="true" />
                          ) : (
                            <TrendingDown className="size-4" aria-hidden="true" />
                          )}
                          {account.changePercent >= 0 ? "+" : ""}
                          {account.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}

                  {isCredit && (
                    <div className="mt-3 flex flex-col gap-3">
                      <CreditSummary account={account} />
                      <Button
                        className="cursor-pointer"
                        onClick={() => openPayCardDrawer(account.id)}
                      >
                        Pagar tarjeta
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loadingAccounts && !error && accounts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 px-1">
              {totalsByCurrency.map(({ currency, total }) => (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total {currency}</span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </ExpenseSection>

      <AccountModal />
      <PayCardDrawer />
    </>
  );
}

export default AccountList;
