import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { IWorkoutRepository } from "./types";
import { IndexedDBWorkoutRepository } from "./IndexedDBRepository";

interface StorageContextValue {
  repo: IWorkoutRepository;
  ready: boolean;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  const repo = useMemo(() => new IndexedDBWorkoutRepository(), []);

  useEffect(() => {
    repo
      .init()
      .then(() => setReady(true))
      .catch((err) => console.error("IndexedDB init error", err));
  }, [repo]);

  return (
    <StorageContext.Provider value={{ repo, ready }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useWorkoutStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useWorkoutStorage must be used within a StorageProvider");
  }
  return ctx;
}
