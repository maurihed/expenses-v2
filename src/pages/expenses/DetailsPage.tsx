import MonthSummary from "./components/Details/MonthSummary";
import PatrimonyCard from "./components/Details/PatrimonyCard";
import StatCards from "./components/Details/StatCards";

function DetailsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <h1 className="font-display text-2xl">Detalles</h1>
      <PatrimonyCard />
      <StatCards />
      <MonthSummary />
    </div>
  );
}

export default DetailsPage;
