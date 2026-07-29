import type { Day, ScheduledDay, WeekSchedule } from "../types";

const SPANISH_DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function spanishDayName(date: Date): string {
  return SPANISH_DAY_NAMES[date.getDay()];
}

/** Monday of the week containing `date` (local time). */
export function getMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

export function formatDayNumber(date: Date): string {
  return String(date.getDate());
}

export function formatWeekLabel(weekStart: Date, weekEnd: Date): string {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const start = `${weekStart.getDate()} ${MONTH_SHORT[weekStart.getMonth()]}`;
  const end = sameMonth
    ? `${weekEnd.getDate()} ${MONTH_SHORT[weekEnd.getMonth()]}`
    : `${weekEnd.getDate()} ${MONTH_SHORT[weekEnd.getMonth()]}`;
  return `${start} – ${end}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDateKey(a) === formatDateKey(b);
}

/**
 * Maps program template days (Lunes, Martes, …) onto the Mon–Sun calendar
 * week starting at `weekStartMonday`.
 */
export function buildWeekSchedule(
  templateDays: Day[],
  weekStartMonday: Date,
  today: Date = startOfDay(new Date()),
): WeekSchedule {
  const weekStart = getMonday(weekStartMonday);
  const weekEnd = addDays(weekStart, 6);
  const todayKey = formatDateKey(today);
  const byName = new Map(templateDays.map((d) => [d.day, d]));

  const calendarDays: ScheduledDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dateKey = formatDateKey(date);
    const name = spanishDayName(date);
    const template = byName.get(name);
    calendarDays.push({
      date: dateKey,
      dayName: name,
      dayNumber: formatDayNumber(date),
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      isFuture: dateKey > todayKey,
      hasWorkout: !!template,
      session_name: template?.session_name ?? "Descanso",
      focus: template?.focus ?? [],
      blocks: template?.blocks ?? [],
      // keep Day.day as Spanish name for display
      day: name,
    });
  }

  return {
    weekStart: formatDateKey(weekStart),
    weekEnd: formatDateKey(weekEnd),
    label: formatWeekLabel(weekStart, weekEnd),
    isCurrentWeek: formatDateKey(getMonday(today)) === formatDateKey(weekStart),
    days: calendarDays,
    workoutDays: calendarDays.filter((d) => d.hasWorkout),
  };
}

export function defaultActiveWorkoutIndex(schedule: WeekSchedule): number {
  const workouts = schedule.workoutDays;
  if (workouts.length === 0) return 0;

  const todayIdx = workouts.findIndex((d) => d.isToday);
  if (todayIdx >= 0) return todayIdx;

  // Prefer the nearest past workout in the week, else first future
  const past = [...workouts].reverse().find((d) => d.isPast);
  if (past) return workouts.findIndex((d) => d.date === past.date);

  return 0;
}

/** Consecutive scheduled workouts completed looking backward from today. */
export function computeTrainingStreak(
  templateDays: Day[],
  isComplete: (dateKey: string, totalExercises: number) => boolean,
  today: Date = startOfDay(new Date()),
  lookbackDays = 120,
): number {
  const templateNames = new Set(templateDays.map((d) => d.day));
  const exerciseCountByName = new Map(
    templateDays.map((d) => [
      d.day,
      d.blocks.reduce((s, b) => s + b.exercises.length, 0),
    ]),
  );

  let streak = 0;
  // Start from today; skip today if no workout or incomplete and not done yet
  for (let i = 0; i < lookbackDays; i++) {
    const date = addDays(today, -i);
    const name = spanishDayName(date);
    if (!templateNames.has(name)) continue; // rest day — doesn't break streak

    const total = exerciseCountByName.get(name) ?? 0;
    const key = formatDateKey(date);
    if (total > 0 && isComplete(key, total)) {
      streak++;
    } else if (i === 0 && date.getDay() !== undefined) {
      // Today incomplete: don't break yet, keep looking at past
      continue;
    } else {
      break;
    }
  }
  return streak;
}
