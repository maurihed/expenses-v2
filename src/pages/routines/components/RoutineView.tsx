import { useCallback, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import type { Day, User } from "../types";
import DaySelector from "./DaySelector";
import BlockCard from "./BlockCard";
import DayCompleteBanner from "./DayCompleteBanner";

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

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-16 animate-pulse rounded-xl bg-muted" />
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
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          <Flame className="size-3" />
          {f}
        </span>
      ))}
    </div>
  );
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
    [activeDay],
  );

  const dayComplete = useMemo(
    () => isDayComplete(user.id, activeDay.day, totalExercises),
    [user.id, activeDay.day, totalExercises, isDayComplete],
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
    [user.id, activeDay.day, totalExercises, toggleExercise],
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <DaySelector
        days={days}
        activeIndex={activeDayIndex}
        completedDays={completedDays}
        onSelect={setActiveDayIndex}
      />

      <FocusTags focus={activeDay.focus} />

      <div className="space-y-3">
        {activeDay.blocks.map((block, blockIndex) => (
          <BlockCard
            key={block.name}
            block={block}
            blockIndex={blockIndex}
            getExerciseKey={getExerciseKey}
            progress={getDayProgress(user.id, activeDay.day)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {dayComplete && <DayCompleteBanner sessionName={activeDay.session_name} />}
    </div>
  );
}

export default RoutineView;
