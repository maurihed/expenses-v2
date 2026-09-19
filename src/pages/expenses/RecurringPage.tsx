import RecurringList from "./components/RecurringList";

function RecurringPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="pt-2">
        <h1 className="font-display text-2xl">Recurrentes</h1>
        <p className="text-sm text-muted-foreground">
          Suscripciones, ingresos e intereses que se ejecutan solos.
        </p>
      </div>
      <RecurringList />
    </div>
  );
}

export default RecurringPage;
