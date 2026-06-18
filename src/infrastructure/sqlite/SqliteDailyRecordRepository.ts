import type Database from "@tauri-apps/plugin-sql";
import type { DailyRecordRepository } from "../../application/ports/DailyRecordRepository";
import type { DailyRecord, LocalDate } from "../../domain/streak/types";
import { dailyRecordRowToDailyRecord } from "./rowMappers";
import type { DailyRecordRow } from "./rowMappers";

/**
 * SQLite-backed `DailyRecordRepository` against the sparse `daily_records`
 * table (migration 0001: `UNIQUE(habit_id, date)`). Only completed=1 rows
 * ever exist — "uncomplete" deletes the row rather than writing a
 * completed=0 row (matches the design's sparse-storage decision and the
 * `FakeDailyRecordRepository` semantics already covered by use-case tests).
 *
 * IPC-bound (see `SqliteHabitRepository` doc comment) — not testable under
 * headless Vitest. Verified manually under `pnpm tauri dev` only.
 */
export class SqliteDailyRecordRepository implements DailyRecordRepository {
  constructor(private readonly db: Database) {}

  async upsertToggle(
    habitId: number,
    date: LocalDate,
    completed: boolean,
  ): Promise<void> {
    if (!completed) {
      await this.db.execute(
        `DELETE FROM daily_records WHERE habit_id = $1 AND date = $2`,
        [habitId, date],
      );
      return;
    }

    // UNIQUE(habit_id, date) backs this upsert: insert, or if a row
    // already exists for this (habit_id, date) pair, it's already
    // completed=1 (sparse storage never persists completed=0 rows), so
    // the conflict is a no-op.
    await this.db.execute(
      `INSERT INTO daily_records (habit_id, date, completed)
       VALUES ($1, $2, 1)
       ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1`,
      [habitId, date],
    );
  }

  async listForHabit(habitId: number): Promise<DailyRecord[]> {
    const rows = await this.db.select<DailyRecordRow[]>(
      `SELECT id, habit_id, date, completed FROM daily_records WHERE habit_id = $1`,
      [habitId],
    );
    return rows.map(dailyRecordRowToDailyRecord);
  }
}
