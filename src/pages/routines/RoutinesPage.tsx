import { useState } from "react";
import { CalendarDays, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageProvider } from "./storage/StorageContext";
import { useRoutineProgress } from "./hooks/useRoutineProgress";
import UserSelector from "./components/UserSelector";
import RoutineView from "./components/RoutineView";
import ProgressView from "./components/ProgressView";

type Tab = "entrenamiento" | "progreso";

function RoutinesPageInner() {
  const {
    loading,
    users,
    activeUser,
    setActiveUser,
    getDayProgress,
    toggleExercise,
    isDayComplete,
  } = useRoutineProgress();

  const [tab, setTab] = useState<Tab>("entrenamiento");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <UserSelector
            users={users}
            activeUser={activeUser}
            onSelect={setActiveUser}
          />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab("entrenamiento")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "entrenamiento"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Dumbbell className="size-4" />
          Entrenamiento
        </button>
        <button
          onClick={() => setTab("progreso")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "progreso"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="size-4" />
          Progreso
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {activeUser.program.details.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {activeUser.program.week.focus}
        </p>
      </div>

      {tab === "entrenamiento" ? (
        <RoutineView
          user={activeUser}
          loading={loading}
          getDayProgress={getDayProgress}
          toggleExercise={toggleExercise}
          isDayComplete={isDayComplete}
        />
      ) : (
        <ProgressView
          user={activeUser}
          loading={loading}
          isDayComplete={isDayComplete}
        />
      )}
    </div>
  );
}

function RoutinesPage() {
  return (
    <StorageProvider>
      <RoutinesPageInner />
    </StorageProvider>
  );
}

export default RoutinesPage;
