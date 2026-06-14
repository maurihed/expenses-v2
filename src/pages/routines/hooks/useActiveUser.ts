import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import type { User } from "../types";
import data from "../data.json";

const ACTIVE_USER_KEY = "routine_active_user";

function loadId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

function saveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_USER_KEY, id);
  } catch {
    /* noop */
  }
}

function resolveInitialUser(users: User[], urlParam?: string): User {
  const savedId = loadId();
  if (savedId) {
    const saved = users.find((u) => u.id === savedId);
    if (saved) return saved;
  }
  if (urlParam) {
    const matched = users.find(
      (u) => u.name.toLowerCase() === urlParam.toLowerCase() || u.id === urlParam,
    );
    if (matched) return matched;
  }
  return users[0];
}

export function useActiveUser() {
  const { id: urlParam } = useParams<{ id: string }>();
  const users = useMemo(() => data as User[], []);

  const [activeUser, setActiveUserState] = useState<User>(() =>
    resolveInitialUser(users, urlParam),
  );

  const setActiveUser = useCallback((user: User) => {
    setActiveUserState(user);
    saveId(user.id);
  }, []);

  return { users, activeUser, setActiveUser };
}
