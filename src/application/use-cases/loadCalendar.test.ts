import { beforeEach, describe, expect, test } from "vitest";
import { FakeDailyRecordRepository } from "../../../tests/fakes/FakeDailyRecordRepository";
import { loadCalendar } from "./loadCalendar";

describe("loadCalendar", () => {
  let recordRepo: FakeDailyRecordRepository;

  beforeEach(() => {
    recordRepo = new FakeDailyRecordRepository();
  });

  const weekRange = (from: string, to: string) => ({
    from,
    to,
    allDatesInOrder: [
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
    ].filter((d) => d >= from && d <= to),
  });

  test("scenario 16: a single completion on day 3 appears only on that day; other days are empty", async () => {
    recordRepo.seedHabitMeta(1, "Drink water", "/managed/1.png");
    recordRepo.seed(1, "2026-06-17", true);

    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    expect(result.days.get("2026-06-17")?.mascots).toEqual([
      { id: 1, name: "Drink water", imagePath: "/managed/1.png" },
    ]);
    expect(result.days.get("2026-06-15")?.mascots).toEqual([]);
    expect(result.days.get("2026-06-16")?.mascots).toEqual([]);
  });

  test("scenario 17: a day with zero completions is present in the result with an empty mascot array", async () => {
    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    expect(result.days.has("2026-06-15")).toBe(true);
    expect(result.days.get("2026-06-15")?.mascots).toEqual([]);
    expect(result.days.get("2026-06-15")?.overflowCount).toBe(0);
  });

  test("scenario 18: a habit completed on day 1 and day 5 appears under both days independently", async () => {
    recordRepo.seedHabitMeta(1, "Read", "/managed/1.png");
    recordRepo.seed(1, "2026-06-15", true);
    recordRepo.seed(1, "2026-06-19", true);

    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    expect(result.days.get("2026-06-15")?.mascots).toHaveLength(1);
    expect(result.days.get("2026-06-19")?.mascots).toHaveLength(1);
    expect(result.days.get("2026-06-16")?.mascots).toEqual([]);
  });

  test("scenario 19: a habit completed in the past and later soft-deleted still appears via the fake", async () => {
    // FakeDailyRecordRepository.listCompletedBetween has no active filter —
    // it only reflects completed=1 rows, same as the real JOIN's intent.
    recordRepo.seedHabitMeta(5, "Old habit", "/managed/5.png");
    recordRepo.seed(5, "2026-06-17", true);

    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    expect(result.days.get("2026-06-17")?.mascots).toEqual([
      { id: 5, name: "Old habit", imagePath: "/managed/5.png" },
    ]);
  });

  test("scenario 20: 8 completions on the same day return exactly 6 mascots + overflowCount 2, deterministic by ascending habitId", async () => {
    for (let habitId = 1; habitId <= 8; habitId++) {
      recordRepo.seedHabitMeta(habitId, `Habit ${habitId}`, `/managed/${habitId}.png`);
      recordRepo.seed(habitId, "2026-06-17", true);
    }

    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    const day = result.days.get("2026-06-17");
    expect(day?.mascots).toHaveLength(6);
    expect(day?.mascots.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(day?.overflowCount).toBe(2);
  });

  test("scenario 21: exactly 6 completions on a day return all 6 mascots with overflowCount 0", async () => {
    for (let habitId = 1; habitId <= 6; habitId++) {
      recordRepo.seedHabitMeta(habitId, `Habit ${habitId}`, `/managed/${habitId}.png`);
      recordRepo.seed(habitId, "2026-06-17", true);
    }

    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    const day = result.days.get("2026-06-17");
    expect(day?.mascots).toHaveLength(6);
    expect(day?.overflowCount).toBe(0);
  });

  test("scenario 22: a 7-day (week) range assembles exactly 7 day entries", async () => {
    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      weekRange("2026-06-15", "2026-06-21"),
    );

    expect(result.days.size).toBe(7);
  });

  test("scenario 23: a month-grid range spanning adjacent months attributes out-of-month completions to their date", async () => {
    recordRepo.seedHabitMeta(1, "Habit 1", "/managed/1.png");
    recordRepo.seed(1, "2026-05-31", true); // leading day from prior month

    const allDatesInOrder = ["2026-05-31", "2026-06-01", "2026-06-02"];
    const result = await loadCalendar(
      { dailyRecordRepository: recordRepo },
      { from: "2026-05-31", to: "2026-06-02", allDatesInOrder },
    );

    expect(result.days.get("2026-05-31")?.mascots).toEqual([
      { id: 1, name: "Habit 1", imagePath: "/managed/1.png" },
    ]);
    expect(result.days.size).toBe(3);
  });
});
