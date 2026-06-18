import type Database from "@tauri-apps/plugin-sql";
import type { AppStateRepository } from "../../application/ports/AppStateRepository";
import type { LocalDate } from "../../domain/streak/types";

interface AppStateRow {
  id: number;
  last_open_date: LocalDate;
}

/**
 * SQLite-backed `AppStateRepository` against the singleton `app_state` row
 * (migration 0001: `id INTEGER PRIMARY KEY CHECK (id = 1)`).
 *
 * IPC-bound (see `SqliteHabitRepository` doc comment) — not testable under
 * headless Vitest. Verified manually under `pnpm tauri dev` only.
 */
export class SqliteAppStateRepository implements AppStateRepository {
  constructor(private readonly db: Database) {}

  async getLastOpenDate(): Promise<LocalDate | null> {
    const rows = await this.db.select<AppStateRow[]>(
      `SELECT id, last_open_date FROM app_state WHERE id = 1`,
    );
    return rows[0]?.last_open_date ?? null;
  }

  async setLastOpenDate(date: LocalDate): Promise<void> {
    await this.db.execute(
      `INSERT INTO app_state (id, last_open_date)
       VALUES (1, $1)
       ON CONFLICT(id) DO UPDATE SET last_open_date = $1`,
      [date],
    );
  }
}
