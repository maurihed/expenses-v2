import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledDay } from "../types";

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
  days: ScheduledDay[];
  activeIndex: number;
  completedDates: Set<string>;
  onSelect: (index: number) => void;
}

function DaySelector({
  days,
  activeIndex,
  completedDates,
  onSelect,
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
      {days.map((day, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedDates.has(day.date);
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl px-5 py-3 font-medium transition-all duration-200 min-w-[72px]",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : day.isToday
                  ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              {DAY_ABBREVIATIONS[day.dayName] ?? day.dayName.slice(0, 3)}
            </span>
            <span className="text-lg leading-none">{day.dayNumber}</span>
            {day.isToday && !isActive && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-primary">
                Hoy
              </span>
            )}
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
