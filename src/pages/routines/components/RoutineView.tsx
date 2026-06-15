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
          <div key={i} className="h-14 w-[72px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="mb-4 h-5 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-[72px] animate-pulse rounded-2xl bg-muted" />
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

function DayMeta({ day }: { day: Day }) {
  const totalEx = totalExercisesInDay(day);
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-2 pt-0">
        <DaySelector
          days={days}
          activeIndex={activeDayIndex}
          completedDays={completedDays}
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
