import { beforeEach, describe, expect, test } from "vitest";
import { FakeHabitRepository } from "../../../tests/fakes/FakeHabitRepository";
import { reorderHabits } from "./reorderHabits";

describe("reorderHabits", () => {
  let habitRepo: FakeHabitRepository;

  beforeEach(() => {
    habitRepo = new FakeHabitRepository();
    habitRepo.seed({
      id: 1,
      name: "A",
      imagePath: "/a.png",
      createdAt: "2026-06-17",
      active: true,
      currentStreak: 0,
      sortOrder: 0,
      skipWeekends: false,
    });
    habitRepo.seed({
      id: 2,
      name: "B",
      imagePath: "/b.png",
      createdAt: "2026-06-17",
      active: true,
      currentStreak: 0,
      sortOrder: 1,
      skipWeekends: false,
    });
    habitRepo.seed({
      id: 3,
      name: "C",
      imagePath: "/c.png",
      createdAt: "2026-06-17",
      active: true,
      currentStreak: 0,
      sortOrder: 2,
      skipWeekends: false,
    });
  });

  test("persists a new order for active habits", async () => {
    await reorderHabits([3, 1, 2], { habitRepository: habitRepo });

    const ordered = await habitRepo.listActive();
    expect(ordered.map((habit) => habit.id)).toEqual([3, 1, 2]);
  });

  test("rejects lists that omit an active habit", async () => {
    await expect(
      reorderHabits([1, 2], { habitRepository: habitRepo }),
    ).rejects.toThrow(/every active habit/i);
  });

  test("rejects lists with unknown or duplicate ids", async () => {
    await expect(
      reorderHabits([1, 2, 99], { habitRepository: habitRepo }),
    ).rejects.toThrow(/not active/i);

    await expect(
      reorderHabits([1, 1, 2], { habitRepository: habitRepo }),
    ).rejects.toThrow(/duplicate/i);
  });
});
