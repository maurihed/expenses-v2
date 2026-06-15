import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import type { User } from "../types";
import WeekGrid from "./WeekGrid";
import StatsSummary from "./StatsSummary";

interface ProgressViewProps {
  user: User;
  loading?: boolean;
  isDayComplete: (userId: string, dayName: string, totalExercises: number) => boolean;
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

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarCheck className="size-5 text-primary" />
          <h3 className="text-sm font-bold">Progreso semanal</h3>
        </div>
        <WeekGrid days={days} dayStatusMap={dayStatusMap} />
      </div>

      <StatsSummary
        days={days}
        dayStatusMap={dayStatusMap}
        completedCount={completedCount}
        totalDays={totalDays}
        percentage={percentage}
      />
    </div>
  );
}

export default ProgressView;
