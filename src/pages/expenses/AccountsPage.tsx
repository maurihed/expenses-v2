import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import AccountList from "./components/AccountList";
import TransferDrawer from "./components/TransferDrawer";

function AccountsPage() {
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-3 pt-2">
        <h1 className="font-display text-2xl">Cuentas</h1>
        <Button className="cursor-pointer" onClick={() => setTransferOpen(true)}>
          <ArrowLeftRight />
          Transferir
        </Button>
      </div>
      <AccountList />
      <TransferDrawer open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}

export default AccountsPage;
