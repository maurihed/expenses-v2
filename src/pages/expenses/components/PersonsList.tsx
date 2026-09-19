import { Button } from "@/components/ui/button";
import { ExpenseSection } from "@/components/ui/expense-section";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { cn, formatMoney } from "@/lib/utils";
import type { Person } from "@/types";
import { Pencil, SlidersHorizontal, Users } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { usePersonMutations, usePersons, usePersonSummary } from "../hooks/usePersons";
import PersonAdjustmentDrawer from "./PersonAdjustmentDrawer";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

function PersonCard({ person, onAdjust }: { person: Person; onAdjust: (person: Person) => void }) {
  const { summary, loadingSummary } = usePersonSummary(person.id);
  const { updatePerson } = usePersonMutations();
  const [editing, setEditing] = useState(false);
  const [allowance, setAllowance] = useState(String(person.weeklyAllowance));

  useEffect(() => {
    setAllowance(String(person.weeklyAllowance));
  }, [person.weeklyAllowance]);

  const parsedAllowance = Number(allowance);
  const canSaveAllowance =
    allowance.trim().length > 0 &&
    Number.isFinite(parsedAllowance) &&
    parsedAllowance >= 0 &&
    !updatePerson.isLoading;

  const accrued = summary ? formatMoney(summary.accrued) : loadingSummary ? "…" : "—";
  const spent = summary?.spent ?? person.spent;
  const balance = summary?.balance ?? person.balance;

  const handleSaveAllowance = (event: FormEvent) => {
    event.preventDefault();
    if (!canSaveAllowance) return;
    updatePerson.mutate(
      { id: person.id, person: { weeklyAllowance: parsedAllowance } },
      { onSuccess: () => setEditing(false) }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-sm font-semibold text-primary-700"
          >
            {getInitials(person.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-semibold">{person.name}</p>
            <p className="text-xs text-muted-foreground">
              Monto semanal{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoney(person.weeklyAllowance)}
              </span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="cursor-pointer"
          aria-label={`Editar monto semanal de ${person.name}`}
          aria-expanded={editing}
          onClick={() => setEditing((value) => !value)}
        >
          <Pencil />
        </Button>
      </div>

      {editing && (
        <form className="mt-3 flex flex-col gap-2" onSubmit={handleSaveAllowance}>
          <label className="text-sm font-medium" htmlFor={`allowance-${person.id}`}>
            Monto semanal (MXN)
          </label>
          <Input
            id={`allowance-${person.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={allowance}
            onChange={(event) => setAllowance(event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="grow cursor-pointer" disabled={!canSaveAllowance}>
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                setAllowance(String(person.weeklyAllowance));
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
          {updatePerson.error && (
            <p role="alert" className="text-sm text-destructive">
              {updatePerson.error.message}
            </p>
          )}
        </form>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">Acumulado</dt>
          <dd className="text-sm font-semibold tabular-nums">{accrued}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Gastado</dt>
          <dd className="text-sm font-semibold tabular-nums">{formatMoney(spent)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Disponible</dt>
          <dd
            className={cn(
              "text-sm font-semibold tabular-nums",
              balance < 0 && "text-destructive"
            )}
          >
            {formatMoney(balance)}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        className="mt-4 w-full cursor-pointer"
        onClick={() => onAdjust(person)}
      >
        <SlidersHorizontal />
        Ajustar
      </Button>
    </div>
  );
}

function PersonsList() {
  const { persons, loadingPersons, error, refreshPersons } = usePersons();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  return (
    <>
      <ExpenseSection className="p-4">
        {loadingPersons && <Loader />}

        {!loadingPersons && Boolean(error) && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">Error al cargar personas</p>
            <Button variant="outline" className="cursor-pointer" onClick={() => refreshPersons()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loadingPersons && !error && persons.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="rounded-full bg-primary-100 p-3">
              <Users className="text-primary-700" aria-hidden="true" />
            </span>
            <p className="font-serif text-lg">Sin personas</p>
            <p className="text-sm text-muted-foreground">
              Aún no hay personas registradas.
            </p>
          </div>
        )}

        {!loadingPersons && !error && persons.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {persons.map((person) => (
              <PersonCard key={person.id} person={person} onAdjust={setSelectedPerson} />
            ))}
          </div>
        )}
      </ExpenseSection>

      <PersonAdjustmentDrawer
        key={selectedPerson?.id ?? "none"}
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </>
  );
}

export default PersonsList;
