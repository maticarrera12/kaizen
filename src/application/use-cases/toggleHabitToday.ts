import { computeStreak } from "../../domain/streak/computeStreak";
import type { Clock } from "../ports/Clock";
import type { DailyRecordRepository } from "../ports/DailyRecordRepository";
import type { HabitRepository } from "../ports/HabitRepository";

export interface ToggleHabitTodayDeps {
  habitRepository: HabitRepository;
  dailyRecordRepository: DailyRecordRepository;
  clock: Clock;
}

export interface ToggleHabitTodayResult {
  completedToday: boolean;
  currentStreak: number;
}

export async function toggleHabitToday(
  habitId: number,
  deps: ToggleHabitTodayDeps,
): Promise<ToggleHabitTodayResult> {
  const today = deps.clock.today();
  const habits = await deps.habitRepository.listActive();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) {
    throw new Error(`Habit ${habitId} not found or inactive`);
  }

  const existingRecords = await deps.dailyRecordRepository.listForHabit(
    habitId,
  );
  const wasCompletedToday = existingRecords.some(
    (record) => record.date === today && record.completed,
  );
  const nextCompleted = !wasCompletedToday;

  await deps.dailyRecordRepository.upsertToggle(habitId, today, nextCompleted);

  const updatedRecords = await deps.dailyRecordRepository.listForHabit(
    habitId,
  );
  const streak = computeStreak({
    records: updatedRecords,
    today,
    createdAt: habit.createdAt,
    skipWeekends: habit.skipWeekends,
  });

  await deps.habitRepository.updateStreakCache(habitId, streak);

  return { completedToday: nextCompleted, currentStreak: streak };
}
