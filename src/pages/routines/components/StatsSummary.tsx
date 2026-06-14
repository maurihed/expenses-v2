import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                    : "border-border text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    isCompleted ? "bg-emerald-500" : "bg-muted-foreground/30",
                  )}
                />
                <span className="truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsSummary;
