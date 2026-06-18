import type { DailyRecordRepository } from "../../src/application/ports/DailyRecordRepository";
import type {
  CompletedRecordWithHabit,
  DailyRecord,
  LocalDate,
} from "../../src/domain/streak/types";

interface StoredRecord extends DailyRecord {
  habitId: number;
}

interface HabitMeta {
  name: string;
  imagePath: string;
}

export class FakeDailyRecordRepository implements DailyRecordRepository {
  private records: StoredRecord[] = [];
  private habitMeta = new Map<number, HabitMeta>();

  async upsertToggle(
    habitId: number,
    date: LocalDate,
    completed: boolean,
  ): Promise<void> {
    const index = this.records.findIndex(
      (r) => r.habitId === habitId && r.date === date,
    );

    if (!completed) {
      // Sparse storage: uncompleting removes the row entirely.
      if (index !== -1) this.records.splice(index, 1);
      return;
    }

    if (index !== -1) {
      this.records[index].completed = true;
      return;
    }

    this.records.push({ habitId, date, completed: true });
  }

  async listForHabit(habitId: number): Promise<DailyRecord[]> {
    return this.records
      .filter((r) => r.habitId === habitId)
      .map(({ date, completed }) => ({ date, completed }));
  }

  async listCompletedBetween(
    from: LocalDate,
    to: LocalDate,
  ): Promise<CompletedRecordWithHabit[]> {
    return this.records
      .filter((r) => r.completed && r.date >= from && r.date <= to)
      .map((r) => {
        const meta = this.habitMeta.get(r.habitId) ?? {
          name: `Habit ${r.habitId}`,
          imagePath: `/fake/${r.habitId}.png`,
        };
        return {
          habitId: r.habitId,
          name: meta.name,
          imagePath: meta.imagePath,
          date: r.date,
        };
      });
  }

  // Test helper
  seed(habitId: number, date: LocalDate, completed: boolean): void {
    this.records.push({ habitId, date, completed });
  }

  // Test helper — mirrors the real JOIN's habit metadata (name/imagePath).
  seedHabitMeta(habitId: number, name: string, imagePath: string): void {
    this.habitMeta.set(habitId, { name, imagePath });
  }
}
