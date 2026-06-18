import { beforeEach, describe, expect, test } from "vitest";
import { FakeClock } from "../../../tests/fakes/FakeClock";
import { FakeHabitRepository } from "../../../tests/fakes/FakeHabitRepository";
import { FakeImageStorage } from "../../../tests/fakes/FakeImageStorage";
import { createHabit } from "./createHabit";

describe("createHabit", () => {
  let habitRepo: FakeHabitRepository;
  let imageStorage: FakeImageStorage;
  let clock: FakeClock;

  beforeEach(() => {
    habitRepo = new FakeHabitRepository();
    imageStorage = new FakeImageStorage();
    clock = new FakeClock("2026-06-17");
  });

  test("successful creation copies the image and persists the habit with created_at=today", async () => {
    const habit = await createHabit("Drink water", "/source/photo.png", {
      habitRepository: habitRepo,
      imageStorage,
      clock,
    });

    expect(imageStorage.copiedFrom).toEqual(["/source/photo.png"]);
    expect(habit.name).toBe("Drink water");
    expect(habit.createdAt).toBe("2026-06-17");
    expect(habit.active).toBe(true);
    expect(habit.currentStreak).toBe(0);
    expect(habitRepo.all()).toHaveLength(1);
  });

  test("C1: skipWeekends:true is persisted as true", async () => {
    const habit = await createHabit(
      "Gym",
      "/source/photo.png",
      { habitRepository: habitRepo, imageStorage, clock },
      { skipWeekends: true },
    );

    expect(habit.skipWeekends).toBe(true);
    expect(habitRepo.all()[0].skipWeekends).toBe(true);
  });

  test("C2: skipWeekends:false is persisted as false", async () => {
    const habit = await createHabit(
      "Read",
      "/source/photo.png",
      { habitRepository: habitRepo, imageStorage, clock },
      { skipWeekends: false },
    );

    expect(habit.skipWeekends).toBe(false);
    expect(habitRepo.all()[0].skipWeekends).toBe(false);
  });

  test("C3: omitting skipWeekends defaults to false", async () => {
    const habit = await createHabit("Read", "/source/photo.png", {
      habitRepository: habitRepo,
      imageStorage,
      clock,
    });

    expect(habit.skipWeekends).toBe(false);
  });

  test("empty name is rejected and no habit is persisted", async () => {
    await expect(
      createHabit("   ", "/source/photo.png", {
        habitRepository: habitRepo,
        imageStorage,
        clock,
      }),
    ).rejects.toThrow();

    expect(habitRepo.all()).toHaveLength(0);
    expect(imageStorage.copiedFrom).toHaveLength(0);
  });

  test("image-copy failure prevents the habit from being persisted and surfaces the error", async () => {
    imageStorage.failNextCopy();

    await expect(
      createHabit("Drink water", "/source/bad.png", {
        habitRepository: habitRepo,
        imageStorage,
        clock,
      }),
    ).rejects.toThrow();

    expect(habitRepo.all()).toHaveLength(0);
  });
});
