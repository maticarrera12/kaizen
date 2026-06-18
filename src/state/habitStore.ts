import { create } from "zustand";
import type { HabitTrackerApp } from "../infrastructure/composition/createHabitTrackerApp";
import type { EditHabitPatch } from "../application/use-cases/editHabit";
import type { HabitTodayViewModel } from "../application/use-cases/loadToday";

export interface HabitStore {
  habits: HabitTodayViewModel[];
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  toggle: (habitId: number) => Promise<void>;
  createHabit: (
    name: string,
    imageSourcePath: string,
    options?: { skipWeekends?: boolean },
  ) => Promise<void>;
  editHabit: (habitId: number, patch: EditHabitPatch) => Promise<void>;
  deleteHabit: (habitId: number) => Promise<void>;
  reorderHabits: (orderedHabitIds: number[]) => Promise<void>;
  clearError: () => void;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong";
}

/**
 * Factory so the store can be wired against the real composition root in
 * App.tsx or against a fake in tests — the store itself never imports
 * Tauri/SQLite, only the use-case-shaped HabitTrackerApp interface.
 */
export function createHabitStore(app: HabitTrackerApp) {
  return create<HabitStore>((set, get) => ({
    habits: [],
    isLoading: false,
    error: null,

    init: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await app.loadToday();
        set({ habits: result.habits, isLoading: false });
      } catch (error) {
        set({ error: toErrorMessage(error), isLoading: false });
      }
    },

    toggle: async (habitId: number) => {
      const previousHabits = get().habits;
      const optimisticHabits = previousHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completedToday: !habit.completedToday,
              currentStreak: !habit.completedToday
                ? habit.currentStreak + 1
                : Math.max(0, habit.currentStreak - 1),
            }
          : habit,
      );
      set({ habits: optimisticHabits, error: null });

      try {
        const result = await app.toggleHabitToday(habitId);
        set({
          habits: get().habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  completedToday: result.completedToday,
                  currentStreak: result.currentStreak,
                }
              : habit,
          ),
        });
      } catch (error) {
        set({ habits: previousHabits, error: toErrorMessage(error) });
      }
    },

    createHabit: async (
      name: string,
      imageSourcePath: string,
      options?: { skipWeekends?: boolean },
    ) => {
      try {
        await app.createHabit(name, imageSourcePath, options);
        const result = await app.loadToday();
        set({ habits: result.habits });
      } catch (error) {
        set({ error: toErrorMessage(error) });
      }
    },

    editHabit: async (habitId: number, patch: EditHabitPatch) => {
      try {
        await app.editHabit(habitId, patch);
        const result = await app.loadToday();
        set({ habits: result.habits });
      } catch (error) {
        set({ error: toErrorMessage(error) });
      }
    },

    deleteHabit: async (habitId: number) => {
      try {
        await app.deleteHabit(habitId);
        const result = await app.loadToday();
        set({ habits: result.habits });
      } catch (error) {
        set({ error: toErrorMessage(error) });
      }
    },

    reorderHabits: async (orderedHabitIds: number[]) => {
      const previousHabits = get().habits;
      const habitsById = new Map(previousHabits.map((habit) => [habit.id, habit]));
      const reordered = orderedHabitIds.map((id) => {
        const habit = habitsById.get(id);
        if (!habit) {
          throw new Error(`Unknown habit id ${id}`);
        }
        return habit;
      });

      set({ habits: reordered, error: null });

      try {
        await app.reorderHabits(orderedHabitIds);
      } catch (error) {
        set({ habits: previousHabits, error: toErrorMessage(error) });
      }
    },

    clearError: () => set({ error: null }),
  }));
}
