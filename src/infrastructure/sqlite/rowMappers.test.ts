import { describe, expect, test } from "vitest";
import {
  habitRowToHabit,
  dailyRecordRowToDailyRecord,
  completedRecordRowToCompletedRecordWithHabit,
} from "./rowMappers";
import type { HabitRow, DailyRecordRow, CompletedRecordRow } from "./rowMappers";

describe("habitRowToHabit", () => {
  test("maps a raw SQLite row (snake_case, integer booleans) to the domain-facing Habit shape", () => {
    const row: HabitRow = {
      id: 1,
      name: "Drink water",
      image_path: "/data/habit-images/1.png",
      created_at: "2026-06-17",
      active: 1,
      current_streak: 3,
      sort_order: 0,
      skip_weekends: 0,
    };

    expect(habitRowToHabit(row)).toEqual({
      id: 1,
      name: "Drink water",
      imagePath: "/data/habit-images/1.png",
      createdAt: "2026-06-17",
      active: true,
      currentStreak: 3,
      sortOrder: 0,
      skipWeekends: false,
    });
  });

  test("maps active=0 to active: false", () => {
    const row: HabitRow = {
      id: 2,
      name: "Read",
      image_path: "/data/habit-images/2.png",
      created_at: "2026-06-01",
      active: 0,
      current_streak: 0,
      sort_order: 1,
      skip_weekends: 0,
    };

    expect(habitRowToHabit(row).active).toBe(false);
  });

  test("maps skip_weekends=1 to skipWeekends: true (C7)", () => {
    const row: HabitRow = {
      id: 3,
      name: "Gym",
      image_path: "/data/habit-images/3.png",
      created_at: "2026-06-01",
      active: 1,
      current_streak: 0,
      sort_order: 2,
      skip_weekends: 1,
    };

    expect(habitRowToHabit(row).skipWeekends).toBe(true);
  });

  test("maps skip_weekends=0 to skipWeekends: false (C7)", () => {
    const row: HabitRow = {
      id: 4,
      name: "Read",
      image_path: "/data/habit-images/4.png",
      created_at: "2026-06-01",
      active: 1,
      current_streak: 0,
      sort_order: 3,
      skip_weekends: 0,
    };

    expect(habitRowToHabit(row).skipWeekends).toBe(false);
  });
});

describe("dailyRecordRowToDailyRecord", () => {
  test("maps a raw daily_records row to the domain-facing DailyRecord shape", () => {
    const row: DailyRecordRow = {
      id: 10,
      habit_id: 1,
      date: "2026-06-17",
      completed: 1,
    };

    expect(dailyRecordRowToDailyRecord(row)).toEqual({
      date: "2026-06-17",
      completed: true,
    });
  });
});

describe("completedRecordRowToCompletedRecordWithHabit", () => {
  test("maps a raw JOIN row (snake_case) to the domain-facing CompletedRecordWithHabit shape", () => {
    const row: CompletedRecordRow = {
      habit_id: 1,
      name: "Drink water",
      image_path: "/data/habit-images/1.png",
      date: "2026-06-17",
    };

    expect(completedRecordRowToCompletedRecordWithHabit(row)).toEqual({
      habitId: 1,
      name: "Drink water",
      imagePath: "/data/habit-images/1.png",
      date: "2026-06-17",
    });
  });
});
