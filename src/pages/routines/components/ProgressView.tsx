import { useMemo } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { Day, ScheduledDay } from "../types";
import { useWeekSchedule } from "../hooks/useWeekSchedule";
import WeekGrid from "./WeekGrid";
import StatsSummary from "./StatsSummary";
import { cn } from "@/lib/utils";

interface ProgressViewProps {
  templateDays: Day[];
  loading?: boolean;
  weekStats: (workoutDays: ScheduledDay[]) => {
    statusMap: Record<string, boolean>;
    completedCount: number;
    totalDays: number;
    percentage: number;
  };
  trainingStreak: number;
  totalHistoricalCompletions: number;
  completedDateKeys: string[];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="mb-5 h-5 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-7 gap-2.5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-3 w-4 animate-pulse rounded bg-muted" />
              <div className="size-11 animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="mb-4 h-5 w-28 animate-pulse rounded-lg bg-muted" />
        <div className="mb-3 h-8 w-full animate-pulse rounded-lg bg-muted" />
        <div className="mb-4 h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressView({
  templateDays,
  loading,
  weekStats,
  trainingStreak,
  totalHistoricalCompletions,
  completedDateKeys,
}: ProgressViewProps) {
  const {
    schedule,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    canGoNext,
  } = useWeekSchedule(templateDays);

  const { statusMap, completedCount, totalDays, percentage } = useMemo(
    () => weekStats(schedule.workoutDays),
    [weekStats, schedule.workoutDays],
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarCheck className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight">
                {schedule.isCurrentWeek ? "Semana actual" : "Historial"}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {schedule.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={goToPreviousWeek}
              className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:text-foreground"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            {!schedule.isCurrentWeek && (
              <button
                type="button"
                onClick={goToCurrentWeek}
                className="rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary"
              >
                Hoy
              </button>
            )}
            <button
              type="button"
              onClick={goToNextWeek}
              disabled={!canGoNext}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl bg-muted transition",
                canGoNext
                  ? "text-muted-foreground hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/30",
              )}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <WeekGrid days={schedule.days} dayStatusMap={statusMap} />
      </div>

      <StatsSummary
        workoutDays={schedule.workoutDays}
        dayStatusMap={statusMap}
        completedCount={completedCount}
        totalDays={totalDays}
        percentage={percentage}
        trainingStreak={trainingStreak}
        totalHistoricalCompletions={totalHistoricalCompletions}
        completedDateKeys={completedDateKeys}
      />
    </div>
  );
}

export default ProgressView;
