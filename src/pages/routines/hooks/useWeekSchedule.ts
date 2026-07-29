import { useCallback, useMemo, useState } from "react";
import type { Day, WeekSchedule } from "../types";
import {
  addDays,
  buildWeekSchedule,
  defaultActiveWorkoutIndex,
  formatDateKey,
  getMonday,
  startOfDay,
} from "../utils/calendar";

/**
 * @param weekOffset 0 = current week, -1 previous, etc.
 * When `controlledOffset` is omitted, offset is internal state.
 */
export function useWeekSchedule(
  templateDays: Day[],
  options?: { maxOffset?: number; initialOffset?: number },
) {
  const maxOffset = options?.maxOffset ?? 0;
  const today = useMemo(() => startOfDay(new Date()), []);
  const currentMonday = useMemo(() => getMonday(today), [today]);

  const [weekOffset, setWeekOffset] = useState(options?.initialOffset ?? 0);

  const weekStart = useMemo(
    () => addDays(currentMonday, weekOffset * 7),
    [currentMonday, weekOffset],
  );

  const schedule: WeekSchedule = useMemo(
    () => buildWeekSchedule(templateDays, weekStart, today),
    [templateDays, weekStart, today],
  );

  const goToPreviousWeek = useCallback(() => {
    setWeekOffset((o) => o - 1);
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekOffset((o) => Math.min(maxOffset, o + 1));
  }, [maxOffset]);

  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  const canGoNext = weekOffset < maxOffset;

  const initialWorkoutIndex = useMemo(
    () => defaultActiveWorkoutIndex(schedule),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule.weekStart],
  );

  return {
    schedule,
    weekOffset,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    canGoNext,
    initialWorkoutIndex,
    todayKey: formatDateKey(today),
  };
}

/** Always the current calendar week (no navigation). */
export function useCurrentWeekSchedule(templateDays: Day[]) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = useMemo(() => getMonday(today), [today]);

  const schedule: WeekSchedule = useMemo(
    () => buildWeekSchedule(templateDays, weekStart, today),
    [templateDays, weekStart, today],
  );

  const initialWorkoutIndex = useMemo(
    () => defaultActiveWorkoutIndex(schedule),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule.weekStart],
  );

  return { schedule, initialWorkoutIndex, todayKey: formatDateKey(today) };
}
