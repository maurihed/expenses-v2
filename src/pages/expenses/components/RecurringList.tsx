import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Loader } from "@/components/ui/loader";
import { cn, formatMoney, getDateString, parseDateOnly } from "@/lib/utils";
import type {
  RecurringFrequency,
  RecurringRule,
  RecurringRunResult,
  RecurringType,
} from "@/types";
import { Pencil, Play, Power, PowerOff, Repeat } from "lucide-react";
import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { useRecurring, useRecurringMutations } from "../hooks/useRecurring";
import RecurringRuleModal from "./RecurringRuleModal";

const typeLabels: Record<RecurringType, string> = {
  subscription: "Suscripción",
  income: "Ingreso",
  interest: "Interés",
};

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

const formatRunResult = (result: RecurringRunResult) => {
  const parts = [
    `${result.created} creado${result.created === 1 ? "" : "s"}`,
    `${result.skipped} omitido${result.skipped === 1 ? "" : "s"}`,
  ];
  if (result.failed) {
    parts.push(`${result.failed} con error`);
  }
  return parts.join(", ");
};

function RecurringCard({
  rule,
  accountName,
  currency,
  onEdit,
  onToggle,
  toggling,
}: {
  rule: RecurringRule;
  accountName: string;
  currency: string;
  onEdit: (rule: RecurringRule) => void;
  onToggle: (rule: RecurringRule) => void;
  toggling: boolean;
}) {
  const isInterest = rule.type === "interest";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md",
        !rule.active && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-display font-semibold">{rule.name}</span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {typeLabels[rule.type]}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs",
                rule.active
                  ? "bg-primary-100 text-primary-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {rule.active ? "Activa" : "Inactiva"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{accountName}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 cursor-pointer"
          aria-label={`Editar ${rule.name}`}
          onClick={() => onEdit(rule)}
        >
          <Pencil />
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Monto</dt>
          <dd className="font-semibold tabular-nums">
            {isInterest ? "Interés por tramos" : formatMoney(rule.amount ?? 0, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Frecuencia</dt>
          <dd className="font-medium">{frequencyLabels[rule.frequency]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Próxima ejecución</dt>
          <dd className="font-medium tabular-nums">
            {getDateString(parseDateOnly(rule.nextRunDate))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Última ejecución</dt>
          <dd className="font-medium tabular-nums">
            {rule.lastRunDate ? getDateString(parseDateOnly(rule.lastRunDate)) : "—"}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        variant={rule.active ? "outline" : "default"}
        size="sm"
        className="mt-4 w-full cursor-pointer"
        disabled={toggling}
        onClick={() => onToggle(rule)}
      >
        {rule.active ? <PowerOff /> : <Power />}
        {rule.active ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}

function RecurringList() {
  const { rules, loadingRules, error, refreshRules } = useRecurring();
  const { accounts } = useAccounts(true, true);
  const { updateRule, deactivateRule, runNow } = useRecurringMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringRule | null>(null);
  const [runResult, setRunResult] = useState<RecurringRunResult | null>(null);

  const accountName = (accountId: string) =>
    accounts.find((account) => account.id === accountId)?.name ?? "Cuenta";
  const accountCurrency = (accountId: string) =>
    accounts.find((account) => account.id === accountId)?.currency ?? "MXN";

  const openNew = () => {
    setRuleToEdit(null);
    setModalOpen(true);
  };

  const openEdit = (rule: RecurringRule) => {
    setRuleToEdit(rule);
    setModalOpen(true);
  };

  const handleToggle = (rule: RecurringRule) => {
    if (rule.active) {
      deactivateRule.mutate(rule.id);
    } else {
      updateRule.mutate({ id: rule.id, rule: { active: true } });
    }
  };

  const handleRunNow = () => {
    setRunResult(null);
    runNow.mutate(undefined, { onSuccess: (result) => setRunResult(result) });
  };

  const toggling = deactivateRule.isLoading || updateRule.isLoading;

  return (
    <>
      <ExpenseSection className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Tus recurrentes</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleRunNow}
              disabled={runNow.isLoading}
            >
              <Play />
              {runNow.isLoading ? "Ejecutando…" : "Ejecutar ahora"}
            </Button>
            <Button type="button" className="cursor-pointer" onClick={openNew}>
              Agregar recurrente
            </Button>
          </div>
        </div>

        {runResult && (
          <p role="status" className="mt-3 rounded-md bg-primary-100 p-3 text-sm text-primary-700">
            {formatRunResult(runResult)}
          </p>
        )}

        {runNow.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {runNow.error.message}
          </p>
        )}

        {loadingRules && <Loader />}

        {!loadingRules && Boolean(error) && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">Error al cargar recurrentes</p>
            <Button variant="outline" className="cursor-pointer" onClick={() => refreshRules()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loadingRules && !error && rules.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="rounded-full bg-primary-100 p-3">
              <Repeat className="text-primary-700" aria-hidden="true" />
            </span>
            <p className="font-display text-lg">Sin recurrentes</p>
            <p className="text-sm text-muted-foreground">
              Automatiza tus suscripciones, ingresos e intereses.
            </p>
            <Button className="cursor-pointer" onClick={openNew}>
              Agregar recurrente
            </Button>
          </div>
        )}

        {!loadingRules && !error && rules.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {rules.map((rule) => (
              <RecurringCard
                key={rule.id}
                rule={rule}
                accountName={accountName(rule.accountId)}
                currency={accountCurrency(rule.accountId)}
                onEdit={openEdit}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>
        )}
      </ExpenseSection>

      <RecurringRuleModal
        open={modalOpen}
        rule={ruleToEdit}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default RecurringList;
