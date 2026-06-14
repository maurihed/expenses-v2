import { useState } from "react";
import { StorageProvider } from "./storage/StorageContext";
import { useActiveUser } from "./hooks/useActiveUser";
import { useRoutineProgress } from "./hooks/useRoutineProgress";
import UserSelector from "./components/UserSelector";
import TabNav from "./components/TabNav";
import type { TabId } from "./components/TabNav";
import ProgramHeader from "./components/ProgramHeader";
import RoutineView from "./components/RoutineView";
import ProgressView from "./components/ProgressView";

function RoutinesPageInner() {
  const { users, activeUser, setActiveUser } = useActiveUser();
  const {
    loading,
    getDayProgress,
    toggleExercise,
    isDayComplete,
  } = useRoutineProgress(activeUser);

  const [tab, setTab] = useState<TabId>("entrenamiento");

  return (
    <div className="space-y-4">
      <UserSelector
        users={users}
        activeUser={activeUser}
        onSelect={setActiveUser}
      />

      <TabNav activeTab={tab} onTabChange={setTab} />

      <ProgramHeader user={activeUser} />

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
