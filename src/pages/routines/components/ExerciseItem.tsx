import { Check, Clock, Dumbbell, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "../types";

interface ExerciseItemProps {
  exercise: Exercise;
  checked: boolean;
  onToggle: () => void;
}

function formatReps(
  reps: string | number | undefined,
  sets: number | undefined
): string | null {
  if (!sets && !reps) return null;
  const parts: string[] = [];
  if (sets) parts.push(`${sets} series`);
  if (reps) parts.push(`${reps} reps`);
  return parts.join(" x ");
}

function formatDuration(
  seconds: string | number | undefined,
  minutes: number | undefined
): string | null {
  if (minutes) return `${minutes} min`;
  if (seconds) return `${seconds} s`;
  return null;
}

function ExerciseItem({ exercise, checked, onToggle }: ExerciseItemProps) {
  const repInfo = formatReps(exercise.reps, exercise.sets);
  const durationInfo = formatDuration(
    exercise.duration_seconds,
    exercise.duration_minutes
  );

  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      )}
    >
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background"
          )}
        >
          {checked && <Check className="size-3.5" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            checked && "text-muted-foreground line-through"
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

        <div className="mt-1.5 flex flex-wrap gap-2">
          {repInfo && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Dumbbell className="size-3" />
              {repInfo}
            </span>
          )}
          {durationInfo && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {durationInfo}
            </span>
          )}
          {exercise.equipment && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Timer className="size-3" />
              {exercise.equipment}
            </span>
          )}
        </div>

        {exercise.notes && (
          <p className="mt-1 text-xs text-muted-foreground/70 italic leading-relaxed">
            {exercise.notes}
          </p>
        )}
      </div>
    </label>
  );
}

export default ExerciseItem;
