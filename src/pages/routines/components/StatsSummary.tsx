import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Day } from "../types";

interface StatsSummaryProps {
  days: Day[];
  dayStatusMap: Record<string, boolean>;
  completedCount: number;
  totalDays: number;
  percentage: number;
}

function StatsSummary({
  days,
  dayStatusMap,
  completedCount,
  totalDays,
  percentage,
}: StatsSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Días completados
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{completedCount}</span>
            <span className="text-sm font-medium text-muted-foreground">
              / {totalDays}
            </span>
          </div>
        </div>
        <div className="flex-1 rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Racha actual
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="size-5 text-primary" />
            <span className="text-3xl font-bold">{completedCount}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-medium">Progreso del programa</span>
          </div>
          <span className="text-sm font-bold">{percentage}%</span>
        </div>

        <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {days.map((day) => {
            const isCompleted = dayStatusMap[day.day] ?? false;
            return (
              <div
                key={day.day}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-all",
                  isCompleted
                    ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "border-border text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {isCompleted ? "✓" : days.indexOf(day) + 1}
                </span>
                <span className="truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;
