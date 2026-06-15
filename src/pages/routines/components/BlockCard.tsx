import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block } from "../types";
import ExerciseItem from "./ExerciseItem";

interface BlockCardProps {
  block: Block;
  blockIndex: number;
  getExerciseKey: (blockIndex: number, exerciseIndex: number) => string;
  progress: { completed: boolean; exercises: Record<string, boolean> };
  onToggle: (exerciseKey: string) => void;
}

function BlockCard({
  block,
  blockIndex,
  getExerciseKey,
  progress,
  onToggle,
}: BlockCardProps) {
  const total = block.exercises.length;
  const completed = block.exercises.filter((_, i) => {
    const key = getExerciseKey(blockIndex, i);
    return progress.exercises[key] ?? false;
  }).length;
  const blockComplete = completed === total && total > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 transition-all duration-200",
        blockComplete
          ? "border-primary/20 bg-card"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3.5",
          blockComplete && "bg-primary/[0.04]",
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight">{block.name}</h3>
          {block.duration_minutes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
              <Clock className="size-3" aria-hidden="true" />
              {block.duration_minutes} min
            </span>
          )}
          {block.rounds && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
              {block.rounds} rondas
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              completed === total
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {completed}/{total}
          </span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completed === total
                  ? "bg-emerald-500"
                  : "bg-primary",
              )}
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-4 pb-4">
        {block.exercises.map((exercise, exerciseIndex) => {
          const exerciseKey = getExerciseKey(blockIndex, exerciseIndex);
          const checked = progress.exercises[exerciseKey] ?? false;
          return (
            <ExerciseItem
              key={`${exercise.name}-${exerciseIndex}`}
              exercise={exercise}
              checked={checked}
              onToggle={() => onToggle(exerciseKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default BlockCard;
