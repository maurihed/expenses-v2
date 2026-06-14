import { useMemo } from "react";
import { CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "../types";

interface ProgressViewProps {
  user: User;
  loading?: boolean;
  isDayComplete: (userId: string, dayName: string, totalExercises: number) => boolean;
}

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

function ProgressView({ user, loading, isDayComplete }: ProgressViewProps) {
  const days = user.program.week.days;

  const { dayStatusMap, completedCount, totalDays, percentage } = useMemo(() => {
    const total = days.length;
    let completed = 0;
    const statusMap: Record<string, boolean> = {};

    for (const day of days) {
      const totalEx = day.blocks.reduce((s, b) => s + b.exercises.length, 0);
      const complete = isDayComplete(user.id, day.day, totalEx);
      statusMap[day.day] = complete;
      if (complete) completed++;
    }

    return {
      dayStatusMap: statusMap,
      completedCount: completed,
      totalDays: total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [days, user.id, isDayComplete]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-3 w-4 animate-pulse rounded bg-muted" />
                <div className="size-10 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="mb-3 h-8 w-full animate-pulse rounded bg-muted" />
          <div className="mb-4 h-2.5 w-full animate-pulse rounded-full bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4" />
            Progreso semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                          : "bg-transparent text-muted-foreground/30"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Días completados
            </span>
            <span className="text-2xl font-bold">
              {completedCount}
              <span className="text-sm font-normal text-muted-foreground">
                /{totalDays}
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso del programa</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {days.map((day) => {
              const isCompleted = dayStatusMap[day.day] ?? false;
              return (
                <div
                  key={day.day}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      isCompleted ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                  <span className="truncate">{day.day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressView;
