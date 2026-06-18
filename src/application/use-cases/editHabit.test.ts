import { beforeEach, describe, expect, test } from "vitest";
import { FakeHabitRepository } from "../../../tests/fakes/FakeHabitRepository";
import { FakeImageStorage } from "../../../tests/fakes/FakeImageStorage";
import { editHabit } from "./editHabit";

describe("editHabit", () => {
  let habitRepo: FakeHabitRepository;
  let imageStorage: FakeImageStorage;

  beforeEach(() => {
    habitRepo = new FakeHabitRepository();
    imageStorage = new FakeImageStorage();

    habitRepo.seed({
      id: 1,
      name: "Drink water",
      imagePath: "/managed/old.png",
      createdAt: "2026-06-01",
      active: true,
      currentStreak: 5,
      sortOrder: 0,
      skipWeekends: false,
    });
  });

  test("renaming preserves streak and created_at, no image operations occur", async () => {
    await editHabit(1, { name: "Drink more water" }, {
      habitRepository: habitRepo,
      imageStorage,
    });

    const habit = habitRepo.all()[0];
    expect(habit.name).toBe("Drink more water");
    expect(habit.currentStreak).toBe(5);
    expect(habit.createdAt).toBe("2026-06-01");
    expect(imageStorage.copiedFrom).toHaveLength(0);
    expect(imageStorage.deletedPaths).toHaveLength(0);
  });

  test("replacing the image copies the new file then deletes the old one — no orphans", async () => {
    await editHabit(1, { imageSourcePath: "/source/new.png" }, {
      habitRepository: habitRepo,
      imageStorage,
    });

    expect(imageStorage.copiedFrom).toEqual(["/source/new.png"]);
    expect(imageStorage.deletedPaths).toEqual(["/managed/old.png"]);

    const habit = habitRepo.all()[0];
    expect(habit.imagePath).not.toBe("/managed/old.png");
  });

  test("when the image copy fails, the old image is NOT deleted and the habit keeps its original image path", async () => {
    imageStorage.failNextCopy();

    await expect(
      editHabit(1, { imageSourcePath: "/source/bad.png" }, {
        habitRepository: habitRepo,
        imageStorage,
      }),
    ).rejects.toThrow();

    expect(imageStorage.deletedPaths).toHaveLength(0);
    expect(habitRepo.all()[0].imagePath).toBe("/managed/old.png");
  });

  test("C4: toggles skipWeekends ON", async () => {
    await editHabit(1, { skipWeekends: true }, {
      habitRepository: habitRepo,
      imageStorage,
    });

    expect(habitRepo.all()[0].skipWeekends).toBe(true);
  });

  test("C5: toggles skipWeekends OFF", async () => {
    habitRepo.all()[0].skipWeekends = true;

    await editHabit(1, { skipWeekends: false }, {
      habitRepository: habitRepo,
      imageStorage,
    });

    expect(habitRepo.all()[0].skipWeekends).toBe(false);
  });

  test("C6: skipWeekends undefined leaves the value unchanged, only name is patched", async () => {
    habitRepo.all()[0].skipWeekends = true;

    await editHabit(1, { name: "Drink more water" }, {
      habitRepository: habitRepo,
      imageStorage,
    });

    const habit = habitRepo.all()[0];
    expect(habit.name).toBe("Drink more water");
    expect(habit.skipWeekends).toBe(true);
  });
});
