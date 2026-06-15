import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Day } from "../types";

const DAY_ABBREVIATIONS: Record<string, string> = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIÉ",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SÁB",
  Domingo: "DOM",
};

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
      {days.map((day, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedDays.has(day.day);
        return (
          <button
            key={day.day}
            onClick={() => onSelect(index)}
            className={cn(
              "flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl px-5 py-3 font-medium transition-all duration-200 min-w-[72px]",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              {DAY_ABBREVIATIONS[day.day] ?? day.day.slice(0, 3)}
            </span>
            <span className="text-lg leading-none">{index + 1}</span>
            {isCompleted && (
              <span className="mt-0.5">
                <Check
                  className={cn(
                    "size-3.5",
                    isActive ? "text-primary-foreground" : "text-emerald-500",
                  )}
                />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default DaySelector;
