import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Day } from "../types";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

interface WeekGridProps {
  days: Day[];
  dayStatusMap: Record<string, boolean>;
}

function WeekGrid({ days, dayStatusMap }: WeekGridProps) {
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {DAY_LABELS.map((label, i) => {
        const dayName = DAY_NAMES[i];
        const programDay = days.find((d) => d.day === dayName);
        const isCompleted = programDay
          ? dayStatusMap[programDay.day] ?? false
          : false;
        const hasProgram = !!programDay;

        return (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-200",
                isCompleted
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : hasProgram
                    ? "bg-muted text-muted-foreground ring-1 ring-border"
                    : "bg-transparent text-muted-foreground/20",
              )}
            >
              {isCompleted ? (
                <Check className="size-5" />
              ) : hasProgram ? (
                <span className="text-lg font-bold">{i + 1}</span>
              ) : (
                <span className="text-lg">·</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeekGrid;
