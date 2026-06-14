import { User } from "lucide-react";
import type { User as UserType } from "../types";

interface UserSelectorProps {
  users: UserType[];
  activeUser: UserType;
  onSelect: (user: UserType) => void;
}

function UserSelector({ users, activeUser, onSelect }: UserSelectorProps) {
  return (
    <div className="relative">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <select
        value={activeUser.id}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value);
          if (user) onSelect(user);
        }}
        className="w-full appearance-none rounded-lg border border-border bg-card pl-10 pr-8 py-2.5 text-sm font-medium text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="size-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export default UserSelector;
