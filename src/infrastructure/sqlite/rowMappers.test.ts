import { describe, expect, test } from "vitest";
import {
  habitRowToHabit,
  dailyRecordRowToDailyRecord,
} from "./rowMappers";
import type { HabitRow, DailyRecordRow } from "./rowMappers";

describe("habitRowToHabit", () => {
  test("maps a raw SQLite row (snake_case, integer booleans) to the domain-facing Habit shape", () => {
    const row: HabitRow = {
      id: 1,
      name: "Drink water",
      image_path: "/data/habit-images/1.png",
      created_at: "2026-06-17",
      active: 1,
      current_streak: 3,
    };

    expect(habitRowToHabit(row)).toEqual({
      id: 1,
      name: "Drink water",
      imagePath: "/data/habit-images/1.png",
      createdAt: "2026-06-17",
      active: true,
      currentStreak: 3,
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
    };

    expect(habitRowToHabit(row).active).toBe(false);
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
