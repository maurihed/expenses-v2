import { CalendarCheck } from "lucide-react";
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
    <div className="grid grid-cols-7 gap-2">
      {DAY_LABELS.map((label, i) => {
        const dayName = DAY_NAMES[i];
        const programDay = days.find((d) => d.day === dayName);
        const isCompleted = programDay
          ? dayStatusMap[programDay.day] ?? false
          : false;
        const hasProgram = !!programDay;

        return (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                isCompleted
                  ? "bg-emerald-500 text-white shadow-sm"
                  : hasProgram
                    ? "bg-muted text-muted-foreground"
                    : "bg-transparent text-muted-foreground/30",
              )}
            >
              {isCompleted ? (
                <CalendarCheck className="size-5" />
              ) : hasProgram ? (
                "—"
              ) : (
                "·"
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeekGrid;
