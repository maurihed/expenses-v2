import PersonsList from "./components/PersonsList";

function PersonsPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <h1 className="pt-2 font-display text-2xl">Personas</h1>
      <PersonsList />
    </div>
  );
}

export default PersonsPage;
