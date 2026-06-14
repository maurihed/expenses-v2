import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Day } from "../types";

interface DaySelectorProps {
  days: Day[];
  activeIndex: number;
  completedDays: Set<string>;
  onSelect: (index: number) => void;
}

function DaySelector({
  days,
  activeIndex,
  completedDays,
  onSelect,
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {days.map((day, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedDays.has(day.day);
        return (
          <Button
            key={day.day}
            variant={isActive ? "default" : "secondary"}
            size="sm"
            onClick={() => onSelect(index)}
            className="shrink-0 rounded-full"
          >
            {isCompleted && <Check className="size-3.5" />}
            {day.day}
          </Button>
        );
      })}
    </div>
  );
}

export default DaySelector;
