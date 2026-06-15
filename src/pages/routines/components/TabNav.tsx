import { CalendarDays, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "entrenamiento" | "progreso";

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: "entrenamiento", label: "Entrenamiento", icon: Dumbbell },
  { id: "progreso", label: "Progreso", icon: CalendarDays },
];

function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-1 rounded-2xl bg-muted p-1">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default TabNav;
