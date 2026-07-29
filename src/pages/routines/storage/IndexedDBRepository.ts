import type { AllUserProgress, IWorkoutRepository } from "./types";

const DB_NAME = "workout_tracker";
/** v2: progress keyed by calendar date (YYYY-MM-DD) instead of weekday name */
const DB_VERSION = 2;

interface EjercicioRow {
  userId: string;
  dateKey: string;
  exerciseKey: string;
}

interface DiaRow {
  userId: string;
  dateKey: string;
}

export class IndexedDBWorkoutRepository implements IWorkoutRepository {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

        // Fresh install or upgrade from v1 (weekday keys) → recreate stores
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains("ejercicios_completados")) {
            db.deleteObjectStore("ejercicios_completados");
          }
          if (db.objectStoreNames.contains("dias_completados")) {
            db.deleteObjectStore("dias_completados");
          }

          const exerciseStore = db.createObjectStore("ejercicios_completados", {
            keyPath: ["userId", "dateKey", "exerciseKey"],
          });
          exerciseStore.createIndex("userDate", ["userId", "dateKey"]);
          exerciseStore.createIndex("byUser", "userId");

          const dayStore = db.createObjectStore("dias_completados", {
            keyPath: ["userId", "dateKey"],
          });
          dayStore.createIndex("byUser", "userId");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserProgress(userId: string): Promise<AllUserProgress> {
    await this.init();

    const ejercicios = await this.withStore(
      "ejercicios_completados",
      "readonly",
      (store) => {
        const index = store.index("byUser");
        return index.getAll(IDBKeyRange.only(userId));
      },
    );

    const dias = await this.withStore(
      "dias_completados",
      "readonly",
      (store) => {
        const index = store.index("byUser");
        return index.getAll(IDBKeyRange.only(userId));
      },
    );

    const progress: AllUserProgress = {};

    for (const row of ejercicios as unknown as EjercicioRow[]) {
      if (!progress[row.dateKey]) {
        progress[row.dateKey] = { completed: false, exercises: {} };
      }
      progress[row.dateKey].exercises[row.exerciseKey] = true;
    }

    for (const row of dias as unknown as DiaRow[]) {
      if (!progress[row.dateKey]) {
        progress[row.dateKey] = { completed: false, exercises: {} };
      }
      progress[row.dateKey].completed = true;
    }

    return progress;
  }

  async setExerciseCompleted(
    userId: string,
    dateKey: string,
    exerciseKey: string,
    completed: boolean,
  ): Promise<void> {
    if (completed) {
      await this.withStore(
        "ejercicios_completados",
        "readwrite",
        (store) =>
          store.put({ userId, dateKey, exerciseKey }) as unknown as IDBRequest<
            IDBValidKey
          >,
      );
    } else {
      await this.withStore(
        "ejercicios_completados",
        "readwrite",
        (store) =>
          store.delete([userId, dateKey, exerciseKey]) as unknown as IDBRequest<
            undefined
          >,
      );
    }
  }

  async setDayCompleted(
    userId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<void> {
    if (completed) {
      await this.withStore(
        "dias_completados",
        "readwrite",
        (store) =>
          store.put({ userId, dateKey }) as unknown as IDBRequest<IDBValidKey>,
      );
    } else {
      await this.withStore(
        "dias_completados",
        "readwrite",
        (store) =>
          store.delete([userId, dateKey]) as unknown as IDBRequest<undefined>,
      );
    }
  }

  async getCompletedDays(userId: string): Promise<string[]> {
    const progress = await this.getUserProgress(userId);
    return Object.entries(progress)
      .filter(([, p]) => p.completed)
      .map(([dateKey]) => dateKey)
      .sort();
  }
}
