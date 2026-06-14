import { useCallback, useMemo, useState } from "react";
import { Check, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Day, User } from "../types";
import DaySelector from "./DaySelector";
import ExerciseItem from "./ExerciseItem";

interface RoutineViewProps {
  user: User;
  loading?: boolean;
  getDayProgress: (userId: string, dayName: string) => {
    completed: boolean;
    exercises: Record<string, boolean>;
  };
  toggleExercise: (
    userId: string,
    dayName: string,
    exerciseKey: string,
    totalExercises: number,
  ) => void;
  isDayComplete: (userId: string, dayName: string, totalExercises: number) => boolean;
}

function totalExercisesInDay(day: Day): number {
  return day.blocks.reduce((sum, b) => sum + b.exercises.length, 0);
}

function getExerciseKey(blockIndex: number, exerciseIndex: number): string {
  return `${blockIndex}-${exerciseIndex}`;
}

function RoutineView({
  user,
  loading,
  getDayProgress,
  toggleExercise,
  isDayComplete,
}: RoutineViewProps) {
  const days = user.program.week.days;
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = days[activeDayIndex];

  const totalExercises = useMemo(
    () => totalExercisesInDay(activeDay),
    [activeDay]
  );

  const dayComplete = useMemo(
    () => isDayComplete(user.id, activeDay.day, totalExercises),
    [user.id, activeDay.day, totalExercises, isDayComplete]
  );

  const completedDays = useMemo(() => {
    const set = new Set<string>();
    for (const day of days) {
      const total = totalExercisesInDay(day);
      if (isDayComplete(user.id, day.day, total)) {
        set.add(day.day);
      }
    }
    return set;
  }, [days, user.id, isDayComplete]);

  const handleToggle = useCallback(
    (exerciseKey: string) => {
      toggleExercise(user.id, activeDay.day, exerciseKey, totalExercises);
    },
    [user.id, activeDay.day, totalExercises, toggleExercise]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-20 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="h-16 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DaySelector
        days={days}
        activeIndex={activeDayIndex}
        completedDays={completedDays}
        onSelect={setActiveDayIndex}
      />

      {activeDay.focus.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeDay.focus.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              <Flame className="size-3" />
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {activeDay.blocks.map((block, blockIndex) => (
          <Card key={block.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {block.name}
                {block.duration_minutes && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {block.duration_minutes} min
                  </span>
                )}
                {block.rounds && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {block.rounds} rondas
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {block.exercises.map((exercise, exerciseIndex) => {
                const exerciseKey = getExerciseKey(blockIndex, exerciseIndex);
                const progress = getDayProgress(user.id, activeDay.day);
                const checked = progress.exercises[exerciseKey] ?? false;
                return (
                  <ExerciseItem
                    key={`${exercise.name}-${exerciseIndex}`}
                    exercise={exercise}
                    checked={checked}
                    onToggle={() => handleToggle(exerciseKey)}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {dayComplete && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-800",
            "dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          )}
        >
          <Trophy className="size-6 shrink-0" />
          <div>
            <p className="font-semibold">Día completado</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {activeDay.session_name}
            </p>
          </div>
          <Check className="ml-auto size-5 shrink-0" />
        </div>
      )}
    </div>
  );
}

export default RoutineView;
