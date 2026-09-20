import { cn } from "@/lib/utils";
import TransactionModal from "@/pages/expenses/components/TransactionModal";
import { useExpensesStore } from "@/stores/expenses.store";
import { ArrowLeftRight, Home, Menu, Plus, Wallet, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

type Tab = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const tabs: Tab[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/cuentas", label: "Cuentas", icon: Wallet },
  { to: "/mas", label: "Más", icon: Menu },
];

function MobileLayout({ children }: { children: React.ReactNode }) {
  const openNewTransactionModal = useExpensesStore((state) => state.openNewTransactionModal);
  const buttonCommonClasses =
    "inline-flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors duration-200 hover:bg-primary hover:text-primary-foreground";

  return (
    <div>
      <div className="min-h-screen w-full max-w-7xl mx-auto px-4 pb-[80px]">{children}</div>
      <nav className="bg-card text-slate-800 dark:text-white py-2 text-center w-full fixed bottom-0">
        <ul className="flex justify-around gap-1">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                end={end}
                className={({ isActive }) =>
                  cn(buttonCommonClasses, { "bg-primary text-primary-foreground": isActive })
                }
                to={to}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        onClick={() => openNewTransactionModal()}
        aria-label="Agregar movimiento"
        className="fixed bottom-[88px] right-4 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
      >
        <Plus className="size-7" aria-hidden="true" />
      </button>
      <TransactionModal />
    </div>
  );
}

export default MobileLayout;
