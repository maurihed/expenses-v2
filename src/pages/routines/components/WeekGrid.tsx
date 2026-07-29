import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledDay } from "../types";

interface WeekGridProps {
  days: ScheduledDay[];
  dayStatusMap: Record<string, boolean>;
}

function WeekGrid({ days, dayStatusMap }: WeekGridProps) {
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {days.map((day) => {
        const isCompleted = day.hasWorkout
          ? (dayStatusMap[day.date] ?? false)
          : false;
        const hasProgram = day.hasWorkout;

        return (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                day.isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              {day.dayName.slice(0, 1)}
            </span>
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-200",
                isCompleted
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : day.isToday && hasProgram
                    ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                    : hasProgram
                      ? "bg-muted text-muted-foreground ring-1 ring-border"
                      : "bg-transparent text-muted-foreground/20",
              )}
            >
              {isCompleted ? (
                <Check className="size-5" />
              ) : hasProgram ? (
                <span className="text-lg font-bold">{day.dayNumber}</span>
              ) : (
                <span className="text-sm font-medium opacity-40">
                  {day.dayNumber}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeekGrid;
