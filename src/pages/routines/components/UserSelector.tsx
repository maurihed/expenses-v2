import { cn } from "@/lib/utils";
import type { User as UserType } from "../types";

interface UserSelectorProps {
  users: UserType[];
  activeUser: UserType;
  onSelect: (user: UserType) => void;
}

const AVATARS: Record<string, string> = {
  lupita: "L",
  mauricio: "M",
};

function UserSelector({ users, activeUser, onSelect }: UserSelectorProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-muted p-1">
      {users.map((user) => {
        const isActive = activeUser.id === user.id;
        return (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground",
              )}
            >
              {AVATARS[user.id] ?? user.name[0]}
            </span>
            {user.name}
          </button>
        );
      })}
    </div>
  );
}

export default UserSelector;
