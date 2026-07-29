import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import type { ScheduledDay, User, WeekSchedule } from "../types";
import DaySelector from "./DaySelector";
import BlockCard from "./BlockCard";
import DayCompleteBanner from "./DayCompleteBanner";

interface RoutineViewProps {
  user: User;
  schedule: WeekSchedule;
  initialWorkoutIndex: number;
  loading?: boolean;
  getDayProgress: (
    userId: string,
    dateKey: string,
  ) => {
    completed: boolean;
    exercises: Record<string, boolean>;
  };
  toggleExercise: (
    userId: string,
    dateKey: string,
    exerciseKey: string,
    totalExercises: number,
  ) => void;
  isDayComplete: (
    userId: string,
    dateKey: string,
    totalExercises: number,
  ) => boolean;
}

function totalExercisesInDay(day: ScheduledDay): number {
  return day.blocks.reduce((sum, b) => sum + b.exercises.length, 0);
}

function getExerciseKey(blockIndex: number, exerciseIndex: number): string {
  return `${blockIndex}-${exerciseIndex}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 w-[72px] animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border-2 border-border bg-card p-4"
        >
          <div className="mb-4 h-5 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <div
                key={j}
                className="h-[72px] animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusTags({ focus }: { focus: string[] }) {
  if (focus.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {focus.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
        >
          <Flame className="size-3" aria-hidden="true" />
          {f}
        </span>
      ))}
    </div>
  );
}

function DayMeta({ day }: { day: ScheduledDay }) {
  const totalEx = totalExercisesInDay(day);
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>
        {day.dayName} {day.dayNumber}
        {day.isToday ? " · Hoy" : ""}
      </span>
      <span className="text-muted-foreground/30">·</span>
      <span>
        {day.blocks.length} {day.blocks.length === 1 ? "bloque" : "bloques"}
      </span>
      <span className="text-muted-foreground/30">·</span>
      <span>{totalEx} ejercicios</span>
    </div>
  );
}

function RoutineView({
  user,
  schedule,
  initialWorkoutIndex,
  loading,
  getDayProgress,
  toggleExercise,
  isDayComplete,
}: RoutineViewProps) {
  const workoutDays = schedule.workoutDays;
  const [activeDayIndex, setActiveDayIndex] = useState(initialWorkoutIndex);

  useEffect(() => {
    setActiveDayIndex(initialWorkoutIndex);
  }, [schedule.weekStart, initialWorkoutIndex]);

  const activeDay = workoutDays[activeDayIndex] ?? workoutDays[0];

  const totalExercises = useMemo(
    () => (activeDay ? totalExercisesInDay(activeDay) : 0),
    [activeDay],
  );

  const dayComplete = useMemo(() => {
    if (!activeDay) return false;
    return isDayComplete(user.id, activeDay.date, totalExercises);
  }, [user.id, activeDay, totalExercises, isDayComplete]);

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    for (const day of workoutDays) {
      const total = totalExercisesInDay(day);
      if (isDayComplete(user.id, day.date, total)) {
        set.add(day.date);
      }
    }
    return set;
  }, [workoutDays, user.id, isDayComplete]);

  const handleToggle = useCallback(
    (exerciseKey: string) => {
      if (!activeDay) return;
      toggleExercise(user.id, activeDay.date, exerciseKey, totalExercises);
    },
    [user.id, activeDay, totalExercises, toggleExercise],
  );

  if (loading) return <LoadingSkeleton />;

  if (!activeDay || workoutDays.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No hay entrenamientos programados esta semana.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-2 pt-0">
        <DaySelector
          days={workoutDays}
          activeIndex={activeDayIndex}
          completedDates={completedDates}
          onSelect={setActiveDayIndex}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">{activeDay.session_name}</h2>
          <DayMeta day={activeDay} />
        </div>
        <FocusTags focus={activeDay.focus} />
      </div>

      <div className="space-y-3">
        {activeDay.blocks.map((block, blockIndex) => (
          <BlockCard
            key={`${activeDay.date}-${block.name}`}
            block={block}
            blockIndex={blockIndex}
            getExerciseKey={getExerciseKey}
            progress={getDayProgress(user.id, activeDay.date)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {dayComplete && (
        <DayCompleteBanner sessionName={activeDay.session_name} />
      )}
    </div>
  );
}

export default RoutineView;
