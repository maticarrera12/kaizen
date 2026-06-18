import type Database from "@tauri-apps/plugin-sql";
import type {
  Habit,
  HabitPatch,
  HabitRepository,
  NewHabit,
} from "../../application/ports/HabitRepository";
import { habitRowToHabit } from "./rowMappers";
import type { HabitRow } from "./rowMappers";

/**
 * SQLite-backed `HabitRepository` against the `habits` table (migration
 * 0001). This class is a thin wrapper around `@tauri-apps/plugin-sql`'s
 * `Database`, whose `execute`/`select` methods are IPC calls into the Rust
 * backend (`invoke('plugin:sql|...')`) — there is no real SQL execution in
 * JS, so this class CANNOT be exercised by headless Vitest. Verified
 * manually under `pnpm tauri dev` only. All row-shape/mapping logic is
 * delegated to the pure, unit-tested `habitRowToHabit` helper.
 */
export class SqliteHabitRepository implements HabitRepository {
  constructor(private readonly db: Database) {}

  async create(habit: NewHabit): Promise<Habit> {
    const result = await this.db.execute(
      `INSERT INTO habits (name, image_path, created_at, active, current_streak)
       VALUES ($1, $2, $3, 1, 0)`,
      [habit.name, habit.imagePath, habit.createdAt],
    );

    const id = result.lastInsertId;
    if (id === undefined) {
      throw new Error("SqliteHabitRepository.create: missing lastInsertId");
    }

    return {
      id,
      name: habit.name,
      imagePath: habit.imagePath,
      createdAt: habit.createdAt,
      active: true,
      currentStreak: 0,
    };
  }

  async update(id: number, patch: HabitPatch): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (patch.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(patch.name);
    }
    if (patch.imagePath !== undefined) {
      sets.push(`image_path = $${paramIndex++}`);
      values.push(patch.imagePath);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db.execute(
      `UPDATE habits SET ${sets.join(", ")} WHERE id = $${paramIndex}`,
      values,
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.db.execute(`UPDATE habits SET active = 0 WHERE id = $1`, [id]);
  }

  async listActive(): Promise<Habit[]> {
    const rows = await this.db.select<HabitRow[]>(
      `SELECT id, name, image_path, created_at, active, current_streak
       FROM habits WHERE active = 1 ORDER BY id ASC`,
    );
    return rows.map(habitRowToHabit);
  }

  async updateStreakCache(id: number, streak: number): Promise<void> {
    await this.db.execute(
      `UPDATE habits SET current_streak = $1 WHERE id = $2`,
      [streak, id],
    );
  }
}
