import { Button } from "@/components/ui/button";
import type { Holding } from "@/types";
import { useState } from "react";
import { useAccounts } from "./hooks/useAccounts";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import InvestmentPositions from "./components/InvestmentPositions";
import AddHoldingDrawer from "./components/InvestmentPositions/AddHoldingDrawer";
import EditHoldingDrawer from "./components/InvestmentPositions/EditHoldingDrawer";

function InvestmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, loadingAccounts } = useAccounts();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);

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
          className="size-11 cursor-pointer"
          aria-label="Volver a cuentas"
          onClick={() => navigate("/cuentas")}
        >
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-2xl">{account.name}</h1>
      </div>

      <InvestmentPositions account={account} onAdd={() => setAddOpen(true)} onEdit={setEditing} />

      <AddHoldingDrawer
        accountId={account.id}
        currency={account.currency}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <EditHoldingDrawer
        accountId={account.id}
        holding={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

export default InvestmentDetailPage;
