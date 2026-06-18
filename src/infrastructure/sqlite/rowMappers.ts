import type { Habit } from "../../application/ports/HabitRepository";
import type { DailyRecord, LocalDate } from "../../domain/streak/types";

/** Raw shape returned by `db.select<HabitRow[]>(...)` against the `habits` table. */
export interface HabitRow {
  id: number;
  name: string;
  image_path: string;
  created_at: LocalDate;
  active: number; // SQLite has no boolean type; 0/1
  current_streak: number;
}

/** Raw shape returned by `db.select<DailyRecordRow[]>(...)` against `daily_records`. */
export interface DailyRecordRow {
  id: number;
  habit_id: number;
  date: LocalDate;
  completed: number; // 0/1
}

export function habitRowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    imagePath: row.image_path,
    createdAt: row.created_at,
    active: row.active === 1,
    currentStreak: row.current_streak,
  };
}

export function dailyRecordRowToDailyRecord(row: DailyRecordRow): DailyRecord {
  return {
    date: row.date,
    completed: row.completed === 1,
  };
}
