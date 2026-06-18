import type { LocalDate } from "../../domain/streak/types";

export interface Habit {
  id: number;
  name: string;
  imagePath: string;
  createdAt: LocalDate;
  active: boolean;
  currentStreak: number;
  sortOrder: number;
  skipWeekends: boolean;
}

export interface NewHabit {
  name: string;
  imagePath: string;
  createdAt: LocalDate;
  skipWeekends?: boolean;
}

export interface HabitPatch {
  name?: string;
  imagePath?: string;
  skipWeekends?: boolean;
}

export interface HabitRepository {
  create(habit: NewHabit): Promise<Habit>;
  update(id: number, patch: HabitPatch): Promise<void>;
  softDelete(id: number): Promise<void>;
  listActive(): Promise<Habit[]>;
  updateStreakCache(id: number, streak: number): Promise<void>;
  updateOrder(orderedIds: number[]): Promise<void>;
}
