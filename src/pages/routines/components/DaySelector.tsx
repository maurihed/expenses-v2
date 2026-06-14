import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Day } from "../types";

interface DaySelectorProps {
  days: Day[];
  activeIndex: number;
  completedDays: Set<string>;
  onSelect: (index: number) => void;
}

function DaySelector({
  days,
  activeIndex,
  completedDays,
  onSelect,
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {days.map((day, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedDays.has(day.day);
        return (
          <button
            key={day.day}
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isCompleted && (
              <Check className="size-3.5" />
            )}
            {day.day}
          </button>
        );
      })}
    </div>
  );
}

export default DaySelector;
