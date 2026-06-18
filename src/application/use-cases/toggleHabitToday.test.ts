import { beforeEach, describe, expect, test } from "vitest";
import { FakeClock } from "../../../tests/fakes/FakeClock";
import { FakeDailyRecordRepository } from "../../../tests/fakes/FakeDailyRecordRepository";
import { FakeHabitRepository } from "../../../tests/fakes/FakeHabitRepository";
import { toggleHabitToday } from "./toggleHabitToday";

describe("toggleHabitToday", () => {
  let habitRepo: FakeHabitRepository;
  let recordRepo: FakeDailyRecordRepository;
  let clock: FakeClock;

  beforeEach(() => {
    habitRepo = new FakeHabitRepository();
    recordRepo = new FakeDailyRecordRepository();
    clock = new FakeClock("2026-06-17");

    habitRepo.seed({
      id: 1,
      name: "Drink water",
      imagePath: "/managed/1.png",
      createdAt: "2026-06-01",
      active: true,
      currentStreak: 0,
      sortOrder: 0,
      skipWeekends: false,
    });
  });

  test("toggling an unmarked habit to complete creates exactly one record for today and increments the streak", async () => {
    recordRepo.seed(1, "2026-06-16", true); // yesterday already completed

    const result = await toggleHabitToday(1, {
      habitRepository: habitRepo,
      dailyRecordRepository: recordRepo,
      clock,
    });

    expect(result.completedToday).toBe(true);
    expect(result.currentStreak).toBe(2);

    const records = await recordRepo.listForHabit(1);
    expect(records).toHaveLength(2);
    expect(habitRepo.all()[0].currentStreak).toBe(2);
  });

  test("toggling a completed habit back off removes today's record and recomputes the streak", async () => {
    recordRepo.seed(1, "2026-06-16", true);
    recordRepo.seed(1, "2026-06-17", true); // today, already marked

    const result = await toggleHabitToday(1, {
      habitRepository: habitRepo,
      dailyRecordRepository: recordRepo,
      clock,
    });

    expect(result.completedToday).toBe(false);
    const records = await recordRepo.listForHabit(1);
    expect(records.find((r) => r.date === "2026-06-17")).toBeUndefined();
  });

  test("idempotency: toggling twice returns to the original state with exactly one record per habit per day", async () => {
    const first = await toggleHabitToday(1, {
      habitRepository: habitRepo,
      dailyRecordRepository: recordRepo,
      clock,
    });
    expect(first.completedToday).toBe(true);

    const second = await toggleHabitToday(1, {
      habitRepository: habitRepo,
      dailyRecordRepository: recordRepo,
      clock,
    });
    expect(second.completedToday).toBe(false);

    const records = await recordRepo.listForHabit(1);
    expect(records).toHaveLength(0); // back to original unmarked state, no leftover row

    const third = await toggleHabitToday(1, {
      habitRepository: habitRepo,
      dailyRecordRepository: recordRepo,
      clock,
    });
    expect(third.completedToday).toBe(true);

    const recordsAfterThird = await recordRepo.listForHabit(1);
    expect(recordsAfterThird).toHaveLength(1); // one record per habit per day, never duplicated
  });
});
