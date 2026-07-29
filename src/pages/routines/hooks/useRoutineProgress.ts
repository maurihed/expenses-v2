import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayProgress, RoutineProgress, ScheduledDay, User } from "../types";
import type { AllUserProgress } from "../storage/types";
import { useWorkoutStorage } from "../storage/StorageContext";
import { computeTrainingStreak } from "../utils/calendar";

function totalExercisesInDay(day: {
  blocks: { exercises: unknown[] }[];
}): number {
  return day.blocks.reduce((sum, b) => sum + b.exercises.length, 0);
}

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
    (userId: string, dateKey: string): DayProgress => {
      return cache[userId]?.[dateKey] ?? { completed: false, exercises: {} };
    },
    [cache],
  );

  const toggleExercise = useCallback(
    async (
      userId: string,
      dateKey: string,
      exerciseKey: string,
      totalExercises: number,
    ) => {
      const currentValue =
        cache[userId]?.[dateKey]?.exercises[exerciseKey] ?? false;
      const newValue = !currentValue;

      setCache((prev) => {
        const userProg = { ...(prev[userId] ?? {}) };
        const dayProg = {
          ...(userProg[dateKey] ?? { completed: false, exercises: {} }),
        };
        dayProg.exercises = { ...dayProg.exercises, [exerciseKey]: newValue };

        const completed = Object.values(dayProg.exercises).filter(Boolean)
          .length;
        dayProg.completed = completed >= totalExercises;

        userProg[dateKey] = dayProg;
        return { ...prev, [userId]: userProg };
      });

      try {
        await repo.setExerciseCompleted(userId, dateKey, exerciseKey, newValue);

        const dayProg = cache[userId]?.[dateKey] ?? {
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

        await repo.setDayCompleted(userId, dateKey, allDone);
      } catch (err) {
        console.error("Failed to persist exercise toggle", err);
      }
    },
    [repo, cache],
  );

  const isDayComplete = useCallback(
    (userId: string, dateKey: string, totalExercises: number): boolean => {
      if (totalExercises === 0) return false;
      const dp = getDayProgress(userId, dateKey);
      if (dp.completed) return true;
      const completedCount = Object.values(dp.exercises).filter(Boolean).length;
      return completedCount >= totalExercises;
    },
    [getDayProgress],
  );

  const weekStats = useCallback(
    (workoutDays: ScheduledDay[]) => {
      let completed = 0;
      const statusMap: Record<string, boolean> = {};

      for (const day of workoutDays) {
        const total = totalExercisesInDay(day);
        const done = isDayComplete(activeUser.id, day.date, total);
        statusMap[day.date] = done;
        if (done) completed++;
      }

      const total = workoutDays.length;
      return {
        statusMap,
        completedCount: completed,
        totalDays: total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    [activeUser.id, isDayComplete],
  );

  const trainingStreak = useMemo(() => {
    return computeTrainingStreak(
      activeUser.program.week.days,
      (dateKey, total) => isDayComplete(activeUser.id, dateKey, total),
    );
  }, [activeUser, isDayComplete]);

  const completedDateKeys = useMemo(() => {
    const userProg = cache[activeUser.id] ?? {};
    return Object.entries(userProg)
      .filter(([, p]) => {
        if (p.completed) return true;
        return false;
      })
      .map(([dateKey]) => dateKey)
      .sort()
      .reverse();
  }, [cache, activeUser.id]);

  const totalHistoricalCompletions = completedDateKeys.length;

  return {
    loading,
    getDayProgress,
    toggleExercise,
    isDayComplete,
    weekStats,
    trainingStreak,
    completedDateKeys,
    totalHistoricalCompletions,
  };
}
