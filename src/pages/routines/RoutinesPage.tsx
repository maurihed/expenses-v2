import { useMemo, useState } from "react";
import { StorageProvider } from "./storage/StorageContext";
import { useActiveUser } from "./hooks/useActiveUser";
import { useRoutineProgress } from "./hooks/useRoutineProgress";
import { useCurrentWeekSchedule } from "./hooks/useWeekSchedule";
import UserSelector from "./components/UserSelector";
import TabNav from "./components/TabNav";
import type { TabId } from "./components/TabNav";
import ProgramHeader from "./components/ProgramHeader";
import RoutineView from "./components/RoutineView";
import ProgressView from "./components/ProgressView";

function RoutinesPageInner() {
  const { users, activeUser, setActiveUser } = useActiveUser();
  const templateDays = activeUser.program.week.days;

  const { schedule, initialWorkoutIndex } =
    useCurrentWeekSchedule(templateDays);

  const {
    loading,
    getDayProgress,
    toggleExercise,
    isDayComplete,
    weekStats,
    trainingStreak,
    completedDateKeys,
    totalHistoricalCompletions,
  } = useRoutineProgress(activeUser);

  const { completedCount, totalDays } = useMemo(
    () => weekStats(schedule.workoutDays),
    [weekStats, schedule.workoutDays],
  );

  const [tab, setTab] = useState<TabId>("entrenamiento");

  return (
    <div className="space-y-3 pb-4">
      <header className="space-y-3">
        <UserSelector
          users={users}
          activeUser={activeUser}
          onSelect={setActiveUser}
        />

        <TabNav activeTab={tab} onTabChange={setTab} />

        <ProgramHeader
          programName={activeUser.program.details.name}
          weekFocus={activeUser.program.week.focus}
          durationMinutes={activeUser.program.details.duration_minutes}
          schedule={schedule}
          completedCount={completedCount}
          totalDays={totalDays}
        />
      </header>

      {tab === "entrenamiento" ? (
        <RoutineView
          user={activeUser}
          schedule={schedule}
          initialWorkoutIndex={initialWorkoutIndex}
          loading={loading}
          getDayProgress={getDayProgress}
          toggleExercise={toggleExercise}
          isDayComplete={isDayComplete}
        />
      ) : (
        <ProgressView
          templateDays={templateDays}
          loading={loading}
          weekStats={weekStats}
          trainingStreak={trainingStreak}
          totalHistoricalCompletions={totalHistoricalCompletions}
          completedDateKeys={completedDateKeys}
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
