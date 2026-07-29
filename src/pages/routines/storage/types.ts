import type { DayProgress } from "../types";

/** Progress for one user, keyed by YYYY-MM-DD */
export type AllUserProgress = Record<string, DayProgress>;

export interface IWorkoutRepository {
  init(): Promise<void>;

  getUserProgress(userId: string): Promise<AllUserProgress>;

  setExerciseCompleted(
    userId: string,
    dateKey: string,
    exerciseKey: string,
    completed: boolean,
  ): Promise<void>;

  setDayCompleted(
    userId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<void>;

  getCompletedDays(userId: string): Promise<string[]>;
}
