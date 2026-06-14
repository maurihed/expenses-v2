import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayProgress, RoutineProgress, User } from "../types";
import type { AllUserProgress } from "../storage/types";
import { useWorkoutStorage } from "../storage/StorageContext";

export function useRoutineProgress(activeUser: User) {
  const { repo, ready } = useWorkoutStorage();
  const [dbLoading, setDbLoading] = useState(true);
  const [cache, setCache] = useState<RoutineProgress>({});

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    const load = async () => {
      setDbLoading(true);
      try {
        const progress: AllUserProgress = await repo.getUserProgress(
          activeUser.id,
        );
        if (!cancelled) {
          setCache((prev) => ({ ...prev, [activeUser.id]: progress }));
        }
      } catch (err) {
        console.error("Failed to load user progress", err);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [repo, ready, activeUser.id]);

  const loading = !ready || dbLoading;

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
    getDayProgress,
    toggleExercise,
    isDayComplete,
    completedDayCount,
    totalDayCount,
  };
}
