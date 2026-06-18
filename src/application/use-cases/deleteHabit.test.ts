import { beforeEach, describe, expect, test } from "vitest";
import { FakeDailyRecordRepository } from "../../../tests/fakes/FakeDailyRecordRepository";
import { FakeHabitRepository } from "../../../tests/fakes/FakeHabitRepository";
import { deleteHabit } from "./deleteHabit";

describe("deleteHabit", () => {
  let habitRepo: FakeHabitRepository;
  let recordRepo: FakeDailyRecordRepository;

  beforeEach(() => {
    habitRepo = new FakeHabitRepository();
    recordRepo = new FakeDailyRecordRepository();

    habitRepo.seed({
      id: 1,
      name: "Drink water",
      imagePath: "/managed/1.png",
      createdAt: "2026-06-01",
      active: true,
      currentStreak: 5,
      sortOrder: 0,
      skipWeekends: false,
    });
    recordRepo.seed(1, "2026-06-16", true);
  });

  test("soft delete flips active to false and excludes the habit from listActive", async () => {
    await deleteHabit(1, { habitRepository: habitRepo });

    expect(habitRepo.all()[0].active).toBe(false);
    const active = await habitRepo.listActive();
    expect(active).toHaveLength(0);
  });

  test("daily_records history is retained after a soft delete", async () => {
    await deleteHabit(1, { habitRepository: habitRepo });

    const records = await recordRepo.listForHabit(1);
    expect(records).toHaveLength(1);
  });
});
