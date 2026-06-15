import { CalendarCheck, Dumbbell } from "lucide-react";
import type { User } from "../types";

interface ProgramHeaderProps {
  user: User;
  completedCount: number;
  totalDays: number;
}

function ProgramHeader({ user, completedCount, totalDays }: ProgramHeaderProps) {
  const percentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 dark:from-primary/15 dark:to-primary/5">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-primary">
            Semana {user.program.week.number}
          </p>
          <h2 className="text-lg font-bold leading-tight">
            {user.program.details.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user.program.week.focus}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Dumbbell className="size-3" />
            {user.program.details.duration_minutes} min
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarCheck className="size-4 text-primary" />
          <span className="font-medium text-foreground">{completedCount}</span>
          <span>/ {totalDays} días</span>
        </div>
        <span className="text-sm font-semibold text-primary">{percentage}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgramHeader;
