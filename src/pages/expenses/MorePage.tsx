import { ExpenseSection } from "@/components/ui/expense-section";
import { ChevronRight, HandCoins, Repeat, Tags, Users } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";
import { useNavigate } from "react-router";

type MoreLink = {
  to: string;
  label: string;
  description: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
};

const links: MoreLink[] = [
  {
    to: "/cuentas",
    label: "Cuentas",
    description: "Cuentas, tarjetas de crédito y MSI",
    icon: Tags,
  },
  {
    to: "/categorias",
    label: "Categorías",
    description: "Administra tus categorías de gasto",
    icon: Tags,
  },
  {
    to: "/recurrentes",
    label: "Recurrentes",
    description: "Suscripciones, ingresos e intereses",
    icon: Repeat,
  },
  {
    to: "/personas",
    label: "Personas",
    description: "Presupuesto personal de cada quien",
    icon: Users,
  },
  {
    to: "/deudas",
    label: "Deudas",
    description: "Por cobrar y por pagar, con abonos",
    icon: HandCoins,
  },
];

function MorePage() {
  const navigate = useNavigate();
  // "Cuentas" ya vive en su propio tab; se evita duplicarlo en Más.
  const items = links.filter((link) => link.to !== "/cuentas");

  return (
    <div className="grid grid-cols-1 gap-4">
      <h1 className="pt-2 font-display text-2xl">Más</h1>
      <ExpenseSection className="p-2">
        <ul className="flex flex-col">
          {items.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <button
                type="button"
                onClick={() => navigate(to)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-left transition-colors duration-200 hover:bg-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block font-semibold">{label}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </ExpenseSection>
    </div>
  );
}

export default MorePage;
