import Database from "@tauri-apps/plugin-sql";
import { createHabit } from "../../application/use-cases/createHabit";
import { deleteHabit } from "../../application/use-cases/deleteHabit";
import { editHabit } from "../../application/use-cases/editHabit";
import type { EditHabitPatch } from "../../application/use-cases/editHabit";
import { loadToday } from "../../application/use-cases/loadToday";
import type { LoadTodayResult } from "../../application/use-cases/loadToday";
import { toggleHabitToday } from "../../application/use-cases/toggleHabitToday";
import type { ToggleHabitTodayResult } from "../../application/use-cases/toggleHabitToday";
import type { Habit } from "../../application/ports/HabitRepository";
import { SystemClock } from "../clock/SystemClock";
import { SqliteAppStateRepository } from "../sqlite/SqliteAppStateRepository";
import { SqliteDailyRecordRepository } from "../sqlite/SqliteDailyRecordRepository";
import { SqliteHabitRepository } from "../sqlite/SqliteHabitRepository";
import { TauriImageStorage, pickImage, toRenderableImageUrl } from "../fs/TauriImageStorage";

const DB_PATH = "sqlite:habits.db";

/**
 * `HabitTrackerApp` exposes only use-case-shaped methods to the UI layer
 * (Phase 4). The UI never imports Tauri/SQLite directly — it calls these
 * methods, which internally hold the real adapters wired against the
 * application ports. This is the composition root: the one place where
 * infrastructure and application are connected.
 */
export interface HabitTrackerApp {
  loadToday(): Promise<LoadTodayResult>;
  toggleHabitToday(habitId: number): Promise<ToggleHabitTodayResult>;
  createHabit(name: string, imageSourcePath: string): Promise<Habit>;
  editHabit(habitId: number, patch: EditHabitPatch): Promise<void>;
  deleteHabit(habitId: number): Promise<void>;
  pickImage(): Promise<string | null>;
  toRenderableImageUrl(storedImagePath: string): string;
}

/**
 * Constructs the real adapters (SQLite repos, Tauri image storage, system
 * clock) and wires them into the use cases. Call once at app startup
 * (after `Database.load` resolves) and pass the returned object down to
 * the UI/state layer.
 */
export async function createHabitTrackerApp(): Promise<HabitTrackerApp> {
  const db = await Database.load(DB_PATH);

  const habitRepository = new SqliteHabitRepository(db);
  const dailyRecordRepository = new SqliteDailyRecordRepository(db);
  const appStateRepository = new SqliteAppStateRepository(db);
  const imageStorage = new TauriImageStorage();
  const clock = new SystemClock();

  return {
    loadToday: () =>
      loadToday({
        habitRepository,
        dailyRecordRepository,
        appStateRepository,
        clock,
      }),

    toggleHabitToday: (habitId: number) =>
      toggleHabitToday(habitId, {
        habitRepository,
        dailyRecordRepository,
        clock,
      }),

    createHabit: (name: string, imageSourcePath: string) =>
      createHabit(name, imageSourcePath, {
        habitRepository,
        imageStorage,
        clock,
      }),

    editHabit: (habitId: number, patch: EditHabitPatch) =>
      editHabit(habitId, patch, { habitRepository, imageStorage }),

    deleteHabit: (habitId: number) => deleteHabit(habitId, { habitRepository }),

    pickImage,

    toRenderableImageUrl,
  };
}
