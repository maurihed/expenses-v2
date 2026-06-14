export interface Exercise {
  name: string;
  sets?: number;
  reps?: string | number;
  duration_seconds?: number | string;
  duration_minutes?: number;
  equipment?: string;
  side?: string;
  notes?: string;
  order?: number;
  rpe?: number;
  intensity?: string;
}

export interface Block {
  name: string;
  duration_minutes?: number;
  rounds?: number;
  exercises: Exercise[];
}

export interface Day {
  day: string;
  session_name: string;
  focus: string[];
  blocks: Block[];
}

export interface Week {
  number: number;
  focus: string;
  days: Day[];
}

export interface ProgramDetails {
  name: string;
  phase: string;
  postpartum_week?: number;
  duration_minutes: number;
  frequency: number;
  training_style: string[];
  intensity: {
    target_rpe: string;
    reps_in_reserve: string;
    training_to_failure: boolean;
  };
  goals?: string[];
  medical_considerations?: string[];
  forbidden_exercises?: string[];
  athlete?: Record<string, unknown>;
  training_philosophy?: Record<string, unknown>;
  limitations?: string[];
  progression_model?: Record<string, unknown>;
  equipment?: string[];
  main_objectives?: string[];
}

export interface Program {
  details: ProgramDetails;
  week: Week;
}

export interface User {
  id: string;
  name: string;
  program: Program;
}

export interface DayProgress {
  completed: boolean;
  exercises: Record<string, boolean>;
}

export type RoutineProgress = Record<string, Record<string, DayProgress>>;
