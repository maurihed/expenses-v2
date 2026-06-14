import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card>
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
      </CardContent>
    </Card>
  );
}

export default BlockCard;
