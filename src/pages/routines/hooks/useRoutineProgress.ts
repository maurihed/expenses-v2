import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import type { DayProgress, RoutineProgress, User } from "../types";
import type { AllUserProgress } from "../storage/types";
import { useWorkoutStorage } from "../storage/StorageContext";
import data from "../data.json";

const ACTIVE_USER_KEY = "routine_active_user";

function loadActiveUserId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

function saveActiveUserId(id: string) {
  try {
    localStorage.setItem(ACTIVE_USER_KEY, id);
  } catch {
    /* localStorage unavailable */
  }
}

function findUserByParam(users: User[], param: string): User | undefined {
  return users.find(
    (u) => u.name.toLowerCase() === param.toLowerCase() || u.id === param,
  );
}

export function useRoutineProgress() {
  const { id: urlParam } = useParams<{ id: string }>();
  const { repo, ready } = useWorkoutStorage();
  const users = data as User[];

  const [activeUser, setActiveUserState] = useState<User>(() => {
    const savedId = loadActiveUserId();
    if (savedId) {
      const saved = users.find((u) => u.id === savedId);
      if (saved) return saved;
    }
    if (urlParam) {
      const matched = findUserByParam(users, urlParam);
      if (matched) return matched;
    }
    return users[0];
  });

  const [dbLoading, setDbLoading] = useState(true);
  const [cache, setCache] = useState<RoutineProgress>({});

  const activeUserIdRef = useRef(activeUser.id);
  activeUserIdRef.current = activeUser.id;

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      setDbLoading(true);
      try {
        const progress: AllUserProgress = await repo.getUserProgress(
          activeUser.id,
        );
        setCache((prev) => ({ ...prev, [activeUser.id]: progress }));
      } catch (err) {
        console.error("Failed to load user progress", err);
      } finally {
        setDbLoading(false);
      }
    };

    load();
  }, [repo, ready, activeUser.id]);

  const loading = !ready || dbLoading;

  const setActiveUser = useCallback((user: User) => {
    setActiveUserState(user);
    saveActiveUserId(user.id);
  }, []);

  const getDayProgress = useCallback(
    (userId: string, dayName: string): DayProgress => {
      return (
        cache[userId]?.[dayName] ?? { completed: false, exercises: {} }
      );
    },
    [cache],
  );

  const toggleExercise = useCallback(
    async (
      userId: string,
      dayName: string,
      exerciseKey: string,
      totalExercises: number,
    ) => {
      const currentValue =
        cache[userId]?.[dayName]?.exercises[exerciseKey] ?? false;
      const newValue = !currentValue;

      setCache((prev) => {
        const userProg = { ...(prev[userId] ?? {}) };
        const dayProg = {
          ...(userProg[dayName] ?? { completed: false, exercises: {} }),
        };
        dayProg.exercises = { ...dayProg.exercises, [exerciseKey]: newValue };

        const completed = Object.values(dayProg.exercises).filter(Boolean)
          .length;
        dayProg.completed = completed >= totalExercises;

        userProg[dayName] = dayProg;
        return { ...prev, [userId]: userProg };
      });

      try {
        await repo.setExerciseCompleted(userId, dayName, exerciseKey, newValue);

        const dayProg = cache[userId]?.[dayName] ?? {
          completed: false,
          exercises: {},
        };
        const afterExercises = {
          ...dayProg.exercises,
          [exerciseKey]: newValue,
        };
        const completedCount = Object.values(afterExercises).filter(Boolean)
          .length;
        const allDone = completedCount >= totalExercises;

        await repo.setDayCompleted(userId, dayName, allDone);
      } catch (err) {
        console.error("Failed to persist exercise toggle", err);
      }
    },
    [repo, cache],
  );

  const isDayComplete = useCallback(
    (userId: string, dayName: string, totalExercises: number): boolean => {
      if (totalExercises === 0) return false;
      const dp = getDayProgress(userId, dayName);
      if (dp.completed) return true;
      const completedCount = Object.values(dp.exercises).filter(Boolean).length;
      return completedCount >= totalExercises;
    },
    [getDayProgress],
  );

  const completedDayCount = useMemo(() => {
    const activeDays = activeUser.program.week.days;
    return activeDays.filter((d) => {
      const totalExercises = d.blocks.reduce(
        (sum, b) => sum + b.exercises.length,
        0,
      );
      return isDayComplete(activeUser.id, d.day, totalExercises);
    }).length;
  }, [activeUser, isDayComplete]);

  const totalDayCount = activeUser.program.week.days.length;

  return {
    loading,
    users,
    activeUser,
    setActiveUser,
    getDayProgress,
    toggleExercise,
    isDayComplete,
    completedDayCount,
    totalDayCount,
  };
}
