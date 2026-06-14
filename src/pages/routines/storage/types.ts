import type { DayProgress } from "../types";

export type AllUserProgress = Record<string, DayProgress>;

export interface IWorkoutRepository {
  init(): Promise<void>;

  getUserProgress(userId: string): Promise<AllUserProgress>;

  setExerciseCompleted(
    userId: string,
    dayName: string,
    exerciseKey: string,
    completed: boolean,
  ): Promise<void>;

  setDayCompleted(
    userId: string,
    dayName: string,
    completed: boolean,
  ): Promise<void>;

  getCompletedDays(userId: string): Promise<string[]>;
}
