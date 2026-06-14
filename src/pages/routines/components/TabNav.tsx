import { CalendarDays, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex gap-1 rounded-xl bg-muted p-1">
      {TABS.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={activeTab === id ? "default" : "ghost"}
          onClick={() => onTabChange(id)}
          className="flex-1"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}

export default TabNav;
