import type { AllUserProgress, IWorkoutRepository } from "./types";

const DB_NAME = "workout_tracker";
const DB_VERSION = 1;

interface EjercicioRow {
  userId: string;
  dayName: string;
  exerciseKey: string;
}

interface DiaRow {
  userId: string;
  dayName: string;
}

export class IndexedDBWorkoutRepository implements IWorkoutRepository {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("ejercicios_completados")) {
          const store = db.createObjectStore("ejercicios_completados", {
            keyPath: ["userId", "dayName", "exerciseKey"],
          });
          store.createIndex("userDay", ["userId", "dayName"]);
        }

        if (!db.objectStoreNames.contains("dias_completados")) {
          db.createObjectStore("dias_completados", {
            keyPath: ["userId", "dayName"],
          });
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
        const index = store.index("userDay");
        const range = IDBKeyRange.bound(
          [userId, ""],
          [userId, "\uffff"],
        );
        return index.getAll(range);
      },
    );

    const dias = await this.withStore(
      "dias_completados",
      "readonly",
      (store) => {
        const range = IDBKeyRange.bound(
          [userId, ""],
          [userId, "\uffff"],
        );
        return store.getAll(range);
      },
    );

    const progress: AllUserProgress = {};

    for (const row of ejercicios as unknown as Array<
      EjercicioRow & { completed: boolean }
    >) {
      if (!progress[row.dayName]) {
        progress[row.dayName] = { completed: false, exercises: {} };
      }
      progress[row.dayName].exercises[row.exerciseKey] = true;
    }

    for (const row of dias as unknown as DiaRow[]) {
      if (!progress[row.dayName]) {
        progress[row.dayName] = { completed: false, exercises: {} };
      }
      progress[row.dayName].completed = true;
    }

    return progress;
  }

  async setExerciseCompleted(
    userId: string,
    dayName: string,
    exerciseKey: string,
    completed: boolean,
  ): Promise<void> {
    if (completed) {
      await this.withStore(
        "ejercicios_completados",
        "readwrite",
        (store) =>
          store.put({ userId, dayName, exerciseKey }) as unknown as IDBRequest<
            IDBValidKey
          >,
      );
    } else {
      await this.withStore(
        "ejercicios_completados",
        "readwrite",
        (store) =>
          store.delete([userId, dayName, exerciseKey]) as unknown as IDBRequest<
            undefined
          >,
      );
    }
  }

  async setDayCompleted(
    userId: string,
    dayName: string,
    completed: boolean,
  ): Promise<void> {
    if (completed) {
      await this.withStore(
        "dias_completados",
        "readwrite",
        (store) =>
          store.put({ userId, dayName }) as unknown as IDBRequest<
            IDBValidKey
          >,
      );
    } else {
      await this.withStore(
        "dias_completados",
        "readwrite",
        (store) =>
          store.delete([userId, dayName]) as unknown as IDBRequest<undefined>,
      );
    }
  }

  async getCompletedDays(userId: string): Promise<string[]> {
    const progress = await this.getUserProgress(userId);
    return Object.entries(progress)
      .filter(([, p]) => p.completed)
      .map(([day]) => day);
  }
}
