# RoutinesPage Implementation Plan

## Files to create/modify

### 1. `src/pages/routines/types.ts` — TypeScript interfaces

```typescript
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
  intensity: { target_rpe: string; reps_in_reserve: string; training_to_failure: boolean };
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
```

### 2. `src/pages/routines/hooks/useRoutineProgress.ts` — Custom hook

- Static import of `data.json`
- `useState<User[]>(data)` for users list
- `useState<User>(...)` for active user (determined by: localStorage > URL param `:id` matched against name lowercased > first user)
- `useState<RoutineProgress>(...)` loaded from `localStorage` key `routine_progress`
- Functions:
  - `setActiveUser(user)` -> updates state + localStorage key `routine_active_user`
  - `toggleExercise(userId, dayName, exerciseKey)` -> flips exercise boolean, auto-completes day if all done
  - `getExerciseProgress(userId, dayName, exerciseKey)` -> boolean
  - `isDayComplete(userId, dayName)` -> boolean
  - Helper `getExerciseKey(blockIndex, exerciseIndex)` -> `${blockIndex}-${exerciseIndex}`
- Uses `useEffect` to sync localStorage on progress changes

### 3. `src/pages/routines/components/UserSelector.tsx`

- Dropdown `<select>` styled with Tailwind
- Lists all users from data
- OnChange calls `setActiveUser`
- Shows current active user name

### 4. `src/pages/routines/components/DaySelector.tsx`

- Receives `days: Day[]`, `activeDayIndex`, `onSelect`
- Horizontal scrollable flex container
- Pill buttons for each day name (e.g. "Lunes", "Martes")
- Active day: `bg-primary text-white`, inactive: `bg-muted text-muted-foreground`
- Completed days show a check icon

### 5. `src/pages/routines/components/ExerciseItem.tsx`

- Receives `exercise`, `checked`, `onToggle`
- Styled checkbox (custom `appearance-none` square with `Check` icon when checked)
- Exercise name (bold), detail chips for sets/reps/duration/equipment
- Notes shown as muted text below

### 6. `src/pages/routines/components/RoutineView.tsx`

- Receives the active day data, progress for that day, toggle function
- Renders DaySelector at top
- For each block in the day:
  - Card with block name + duration as header
  - List of ExerciseItem components
- When day is complete, shows a green badge "Día completado ✓"

### 7. `src/pages/routines/components/ProgressView.tsx`

- Receives user's week days and progress data
- Week grid: 7-column layout (L M M J V S D)
- Completed days show green filled circle, rest show empty circle
- Stats card showing "Días completados: X/5" with progress bar
- Overall program completion percentage

### 8. `src/pages/routines/RoutinesPage.tsx` — Main orchestrator

- Uses `useParams` to get `:id` from URL
- Uses `useRoutineProgress` hook
- Tab navigation state: `"entrenamiento"` | `"progreso"`
- Renders:
  - Top bar: UserSelector (left), tab buttons (right)
  - Content: RoutineView or ProgressView based on active tab
- Dark mode compatible using existing CSS variables

## Dependencies used (all existing)

- `react`, `react-router` (useParams)
- `lucide-react` (Check, Dumbbell, Calendar, Trophy, Flame, Clock, User icons)
- `@/lib/utils` (cn)
- `@/components/ui/card` (Card, CardHeader, CardContent, CardTitle)
- `@/components/ui/button` (Button)
- `@/components/ui/separator` (Separator)
- Tailwind CSS v4 classes

## Data flow

```
data.json (static import)
    ↓
useRoutineProgress hook
    ↓
RoutinesPage ──→ UserSelector
    │
    ├── Tab: "entrenamiento"
    │   └── RoutineView
    │       ├── DaySelector
    │       └── [per block] Card → ExerciseItem[]
    │
    └── Tab: "progreso"
        └── ProgressView
            ├── WeekGrid
            └── Stats
```

localStorage structure:
```
routine_active_user: "user_1" | "user_2"
routine_progress: {
  "user_1": {
    "Lunes": { completed: true, exercises: { "0-0": true, "0-1": false, ... } },
    "Martes": { completed: false, exercises: { ... } },
    ...
  },
  "user_2": { ... }
}
```
