import { Flame, History, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledDay } from "../types";
import { parseDateKey } from "../utils/calendar";

const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatHistoryDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  const weekday = [
    "Dom",
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
    "Sáb",
  ][d.getDay()];
  return `${weekday} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

interface StatsSummaryProps {
  workoutDays: ScheduledDay[];
  dayStatusMap: Record<string, boolean>;
  completedCount: number;
  totalDays: number;
  percentage: number;
  trainingStreak: number;
  totalHistoricalCompletions: number;
  completedDateKeys: string[];
}

function StatsSummary({
  workoutDays,
  dayStatusMap,
  completedCount,
  totalDays,
  percentage,
  trainingStreak,
  totalHistoricalCompletions,
  completedDateKeys,
}: StatsSummaryProps) {
  const recentHistory = completedDateKeys.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border-2 border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Esta semana
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
            Racha
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="size-5 text-primary" />
            <span className="text-3xl font-bold">{trainingStreak}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-medium">Progreso de la semana</span>
          </div>
          <span className="text-sm font-bold">{percentage}%</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {totalHistoricalCompletions} entrenos completados en total
        </p>

        <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {workoutDays.map((day) => {
            const isCompleted = dayStatusMap[day.date] ?? false;
            return (
              <div
                key={day.date}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-all",
                  isCompleted
                    ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : day.isToday
                      ? "border-primary/30 bg-primary/5 text-foreground"
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
                  {isCompleted ? "✓" : day.dayNumber}
                </span>
                <span className="truncate">
                  {day.dayName}
                  {day.isToday ? " · Hoy" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {recentHistory.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <span className="text-sm font-medium">Historial reciente</span>
          </div>
          <ul className="space-y-1.5">
            {recentHistory.map((dateKey) => (
              <li
                key={dateKey}
                className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium">{formatHistoryDate(dateKey)}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Completado
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StatsSummary;
