import type Database from "@tauri-apps/plugin-sql";
import type { DailyRecordRepository } from "../../application/ports/DailyRecordRepository";
import type {
  CompletedRecordWithHabit,
  DailyRecord,
  LocalDate,
} from "../../domain/streak/types";
import {
  completedRecordRowToCompletedRecordWithHabit,
  dailyRecordRowToDailyRecord,
} from "./rowMappers";
import type { CompletedRecordRow, DailyRecordRow } from "./rowMappers";

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

  /**
   * Joins completed records to their owning habit's CURRENT name/image_path
   * for calendar history views. Intentionally has NO `active` filter on
   * `habits` — soft-deleted habits (`active=0`) MUST still appear in past
   * days' history (R4.2). Do NOT "fix" this by adding `AND h.active = 1`;
   * that would silently erase history for any deleted habit.
   *
   * IPC-bound — not testable under headless Vitest (see class doc comment).
   * Verified manually under `pnpm tauri dev` only.
   */
  async listCompletedBetween(
    from: LocalDate,
    to: LocalDate,
  ): Promise<CompletedRecordWithHabit[]> {
    const rows = await this.db.select<CompletedRecordRow[]>(
      `SELECT dr.habit_id AS habit_id, h.name AS name, h.image_path AS image_path, dr.date AS date
       FROM daily_records dr
       JOIN habits h ON h.id = dr.habit_id
       WHERE dr.completed = 1 AND dr.date BETWEEN $1 AND $2`,
      [from, to],
    );
    return rows.map(completedRecordRowToCompletedRecordWithHabit);
  }
}
