import { beforeEach, describe, expect, test } from "vitest";
import { FakeHabitTrackerApp } from "../../tests/fakes/FakeHabitTrackerApp";
import { createHabitStore } from "./habitStore";

describe("habitStore", () => {
  let app: FakeHabitTrackerApp;
  let useHabitStore: ReturnType<typeof createHabitStore>;

  beforeEach(() => {
    app = new FakeHabitTrackerApp();
    useHabitStore = createHabitStore(app);
  });

  test("initial state is empty, not loading, no error", () => {
    const state = useHabitStore.getState();
    expect(state.habits).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("init() loads today's habits from the app", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];

    await useHabitStore.getState().init();

    const state = useHabitStore.getState();
    expect(state.habits).toHaveLength(1);
    expect(state.habits[0].name).toBe("Drink water");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("init() sets isLoading true while in flight", () => {
    const promise = useHabitStore.getState().init();
    expect(useHabitStore.getState().isLoading).toBe(true);
    return promise;
  });

  test("init() sets an error message when loadToday fails", async () => {
    app.failNextLoad = true;

    await useHabitStore.getState().init();

    const state = useHabitStore.getState();
    expect(state.error).not.toBeNull();
    expect(state.isLoading).toBe(false);
  });

  test("toggle() optimistically flips completedToday before the app call resolves", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();

    const togglePromise = useHabitStore.getState().toggle(1);

    // Optimistic update should be visible synchronously before the await resolves.
    expect(useHabitStore.getState().habits[0].completedToday).toBe(true);

    await togglePromise;

    expect(useHabitStore.getState().habits[0].completedToday).toBe(true);
    expect(useHabitStore.getState().habits[0].currentStreak).toBe(3);
  });

  test("toggle() reconciles back to server truth on success (streak from result, not local guess)", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();

    await useHabitStore.getState().toggle(1);

    const habit = useHabitStore.getState().habits[0];
    expect(habit.currentStreak).toBe(3);
    expect(habit.completedToday).toBe(true);
  });

  test("toggle() rolls back the optimistic update and sets an error when the app call fails", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();
    app.failNextToggle = true;

    await useHabitStore.getState().toggle(1);

    const state = useHabitStore.getState();
    expect(state.habits[0].completedToday).toBe(false);
    expect(state.habits[0].currentStreak).toBe(2);
    expect(state.error).not.toBeNull();
  });

  test("createHabit() calls the app then reloads the habit list", async () => {
    await useHabitStore.getState().createHabit("Read", "/src/img.png");

    expect(app.createCalls).toEqual([{ name: "Read", imageSourcePath: "/src/img.png" }]);
    expect(useHabitStore.getState().habits).toHaveLength(1);
    expect(useHabitStore.getState().habits[0].name).toBe("Read");
  });

  test("createHabit() sets an error and does not crash when the app call fails", async () => {
    app.failNextCreate = true;

    await useHabitStore.getState().createHabit("Read", "/src/img.png");

    expect(useHabitStore.getState().error).not.toBeNull();
    expect(useHabitStore.getState().habits).toHaveLength(0);
  });

  test("editHabit() calls the app then reloads the habit list", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();

    await useHabitStore.getState().editHabit(1, { name: "Drink more water" });

    expect(app.editCalls).toEqual([{ habitId: 1, patch: { name: "Drink more water" } }]);
    expect(useHabitStore.getState().habits[0].name).toBe("Drink more water");
  });

  test("deleteHabit() calls the app then reloads the habit list", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 2, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();

    await useHabitStore.getState().deleteHabit(1);

    expect(app.deleteCalls).toEqual([1]);
    expect(useHabitStore.getState().habits).toHaveLength(0);
  });

  test("reorderHabits() updates order optimistically and persists via the app", async () => {
    app.habits = [
      { id: 1, name: "A", imagePath: "/managed/1.png", currentStreak: 0, completedToday: false, skipWeekends: false },
      { id: 2, name: "B", imagePath: "/managed/2.png", currentStreak: 0, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();

    await useHabitStore.getState().reorderHabits([2, 1]);

    expect(useHabitStore.getState().habits.map((habit) => habit.id)).toEqual([2, 1]);
    expect(app.reorderCalls).toEqual([[2, 1]]);
  });

  test("reorderHabits() rolls back and sets an error when persistence fails", async () => {
    app.habits = [
      { id: 1, name: "A", imagePath: "/managed/1.png", currentStreak: 0, completedToday: false, skipWeekends: false },
      { id: 2, name: "B", imagePath: "/managed/2.png", currentStreak: 0, completedToday: false, skipWeekends: false },
    ];
    await useHabitStore.getState().init();
    app.failNextReorder = true;

    await useHabitStore.getState().reorderHabits([2, 1]);

    expect(useHabitStore.getState().habits.map((habit) => habit.id)).toEqual([1, 2]);
    expect(useHabitStore.getState().error).not.toBeNull();
  });

  test("clearError() resets the error to null", async () => {
    app.failNextLoad = true;
    await useHabitStore.getState().init();
    expect(useHabitStore.getState().error).not.toBeNull();

    useHabitStore.getState().clearError();

    expect(useHabitStore.getState().error).toBeNull();
  });
});
