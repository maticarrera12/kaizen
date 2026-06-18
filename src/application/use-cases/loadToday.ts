import { computeStreak } from "../../domain/streak/computeStreak";
import type { LocalDate } from "../../domain/streak/types";
import { scheduledDaysMissed } from "../../domain/streak/weekend";
import type { AppStateRepository } from "../ports/AppStateRepository";
import type { Clock } from "../ports/Clock";
import type { DailyRecordRepository } from "../ports/DailyRecordRepository";
import type { HabitRepository } from "../ports/HabitRepository";

const GLOBAL_RESET_THRESHOLD_DAYS = 3;

export interface LoadTodayDeps {
  habitRepository: HabitRepository;
  dailyRecordRepository: DailyRecordRepository;
  appStateRepository: AppStateRepository;
  clock: Clock;
}

export interface HabitTodayViewModel {
  id: number;
  name: string;
  imagePath: string;
  currentStreak: number;
  completedToday: boolean;
  skipWeekends: boolean;
}

export interface LoadTodayResult {
  today: LocalDate;
  habits: HabitTodayViewModel[];
}

export async function loadToday(deps: LoadTodayDeps): Promise<LoadTodayResult> {
  const today = deps.clock.today();
  const lastOpenDate = await deps.appStateRepository.getLastOpenDate();
  const habits = await deps.habitRepository.listActive();

  const daysSinceLastOpen =
    lastOpenDate === null ? 0 : daysBetween(lastOpenDate, today);

  const viewModels: HabitTodayViewModel[] = [];

  for (const habit of habits) {
    const records = await deps.dailyRecordRepository.listForHabit(habit.id);
    const completedToday = records.some(
      (record) => record.date === today && record.completed,
    );

    // KEEP the existing calendar-based check UNCHANGED for skipWeekends:false
    // habits — this guarantees byte-for-byte regression safety for the
    // pre-existing locked behavior. Only skipWeekends:true habits use the
    // schedule-aware count, computed fresh per habit.
    const globalResetTriggered = habit.skipWeekends
      ? scheduledDaysMissed(lastOpenDate, today, true) >=
        GLOBAL_RESET_THRESHOLD_DAYS
      : daysSinceLastOpen >= GLOBAL_RESET_THRESHOLD_DAYS;

    const streak = globalResetTriggered
      ? 0
      : computeStreak({
          records,
          today,
          createdAt: habit.createdAt,
          skipWeekends: habit.skipWeekends,
        });

    await deps.habitRepository.updateStreakCache(habit.id, streak);

    viewModels.push({
      id: habit.id,
      name: habit.name,
      imagePath: habit.imagePath,
      currentStreak: streak,
      completedToday,
      skipWeekends: habit.skipWeekends,
    });
  }

  await deps.appStateRepository.setLastOpenDate(today);

  return { today, habits: viewModels };
}

function daysBetween(from: LocalDate, to: LocalDate): number {
  const fromUtc = toUtcMidnight(from);
  const toUtc = toUtcMidnight(to);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toUtc - fromUtc) / msPerDay);
}

function toUtcMidnight(date: LocalDate): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
