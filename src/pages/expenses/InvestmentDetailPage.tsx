import { Button } from "@/components/ui/button";
import { useAccounts } from "./hooks/useAccounts";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import InvestmentPositions from "./components/InvestmentPositions";

function InvestmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, loadingAccounts } = useAccounts();

  const account = accounts.find((entry) => entry.id === id) ?? null;

  if (loadingAccounts) {
    return <div className="pt-2 text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!account || account.type !== "INVESTMENT") {
    return (
      <div className="flex flex-col items-start gap-3 pt-2">
        <Button variant="ghost" className="cursor-pointer" onClick={() => navigate("/cuentas")}>
          <ArrowLeft />
          Volver
        </Button>
        <p className="text-sm text-muted-foreground">Cuenta de inversión no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          aria-label="Volver a cuentas"
          onClick={() => navigate("/cuentas")}
        >
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-2xl">{account.name}</h1>
      </div>

      <InvestmentPositions account={account} onAdd={() => {}} onEdit={() => {}} />
    </div>
  );
}

export default InvestmentDetailPage;
