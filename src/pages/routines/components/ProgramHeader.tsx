import type { User } from "../types";

interface ProgramHeaderProps {
  user: User;
}

function ProgramHeader({ user }: ProgramHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">
        {user.program.details.name}
      </h2>
      <p className="text-sm text-muted-foreground">
        {user.program.week.focus}
      </p>
    </div>
  );
}

export default ProgramHeader;
