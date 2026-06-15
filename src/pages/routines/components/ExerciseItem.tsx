import { Check, ChevronRight, Clock, Dumbbell, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "../types";

interface ExerciseItemProps {
  exercise: Exercise;
  checked: boolean;
  onToggle: () => void;
}

function formatReps(
  reps: string | number | undefined,
  sets: number | undefined,
): string | null {
  if (!sets && !reps) return null;
  const parts: string[] = [];
  if (sets) parts.push(`${sets} series`);
  if (reps) parts.push(`${reps} reps`);
  return parts.join(" x ");
}

function formatDuration(
  seconds: string | number | undefined,
  minutes: number | undefined,
): string | null {
  if (minutes) return `${minutes} min`;
  if (seconds) return `${seconds} s`;
  return null;
}

function ExerciseItem({ exercise, checked, onToggle }: ExerciseItemProps) {
  const repInfo = formatReps(exercise.reps, exercise.sets);
  const durationInfo = formatDuration(
    exercise.duration_seconds,
    exercise.duration_minutes,
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[0.98]",
        checked
          ? "border-primary/25 bg-primary/[0.06]"
          : "border-border bg-card hover:border-primary/20 hover:bg-primary/[0.03]",
      )}
    >
      <div className="relative mt-0.5">
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200",
            checked
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-muted-foreground/30 bg-background group-hover:border-muted-foreground/50",
          )}
        >
          {checked ? (
            <Check className="size-4" />
          ) : (
            <span className="size-2 rounded-sm bg-muted-foreground/20" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              checked && "text-muted-foreground line-through decoration-2",
            )}
          >
            {exercise.name}
            {exercise.side && (
              <span className="text-muted-foreground font-normal">
                {" "}
                ({exercise.side})
              </span>
            )}
          </p>
          <ChevronRight
            className={cn(
              "mt-0.5 size-4 shrink-0 transition-all duration-200",
              checked
                ? "text-primary/40"
                : "text-muted-foreground/30 group-hover:text-muted-foreground/50",
            )}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {repInfo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Dumbbell className="size-3" aria-hidden="true" />
              {repInfo}
            </span>
          )}
          {durationInfo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {durationInfo}
            </span>
          )}
          {exercise.equipment && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Timer className="size-3" aria-hidden="true" />
              {exercise.equipment}
            </span>
          )}
          {exercise.rpe && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              RPE {exercise.rpe}
            </span>
          )}
        </div>

        {exercise.notes && (
          <p className="mt-1.5 text-xs text-muted-foreground/60 leading-relaxed">
            {exercise.notes}
          </p>
        )}
      </div>
    </button>
  );
}

export default ExerciseItem;
