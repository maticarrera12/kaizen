import type {
  CompletedRecordWithHabit,
  DailyRecord,
  LocalDate,
} from "../../domain/streak/types";

export interface DailyRecordRepository {
  upsertToggle(
    habitId: number,
    date: LocalDate,
    completed: boolean,
  ): Promise<void>;
  listForHabit(habitId: number): Promise<DailyRecord[]>;
  listCompletedBetween(
    from: LocalDate,
    to: LocalDate,
  ): Promise<CompletedRecordWithHabit[]>;
}
