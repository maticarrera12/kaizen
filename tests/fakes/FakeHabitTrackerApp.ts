import type { HabitTrackerApp } from "../../src/infrastructure/composition/createHabitTrackerApp";
import type { EditHabitPatch } from "../../src/application/use-cases/editHabit";
import type {
  CalendarDayResult,
  LoadCalendarRange,
  LoadCalendarResult,
} from "../../src/application/use-cases/loadCalendar";
import type { LoadTodayResult, HabitTodayViewModel } from "../../src/application/use-cases/loadToday";
import type { ToggleHabitTodayResult } from "../../src/application/use-cases/toggleHabitToday";
import type { Habit } from "../../src/application/ports/HabitRepository";
import type { LocalDate } from "../../src/domain/streak/types";

/**
 * In-memory fake of the composition root's public surface, used to TDD the
 * Zustand store without touching Tauri/SQLite. Mirrors HabitTrackerApp
 * exactly so the store never knows it's talking to a fake.
 */
export class FakeHabitTrackerApp implements HabitTrackerApp {
  habits: HabitTodayViewModel[] = [];
  today = "2026-06-17";

  loadTodayCalls = 0;
  loadCalendarCalls: Array<{ from: LocalDate; to: LocalDate }> = [];
  calendarDays: Map<LocalDate, CalendarDayResult> = new Map();
  toggleCalls: number[] = [];
  createCalls: Array<{
    name: string;
    imageSourcePath: string;
    skipWeekends?: boolean;
  }> = [];
  editCalls: Array<{ habitId: number; patch: EditHabitPatch }> = [];
  deleteCalls: number[] = [];
  reorderCalls: number[][] = [];

  failNextLoad = false;
  failNextToggle = false;
  failNextCreate = false;
  failNextReorder = false;

  private nextId = 100;

  async loadToday(): Promise<LoadTodayResult> {
    this.loadTodayCalls++;
    if (this.failNextLoad) {
      this.failNextLoad = false;
      throw new Error("loadToday failed");
    }
    return { today: this.today, habits: this.habits };
  }

  async loadCalendar(range: LoadCalendarRange): Promise<LoadCalendarResult> {
    this.loadCalendarCalls.push({ from: range.from, to: range.to });
    const days = new Map<LocalDate, CalendarDayResult>();
    for (const date of range.allDatesInOrder) {
      days.set(
        date,
        this.calendarDays.get(date) ?? { date, mascots: [], overflowCount: 0 },
      );
    }
    return { days };
  }

  async toggleHabitToday(habitId: number): Promise<ToggleHabitTodayResult> {
    this.toggleCalls.push(habitId);
    if (this.failNextToggle) {
      this.failNextToggle = false;
      throw new Error("toggle failed");
    }
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) throw new Error("habit not found");
    habit.completedToday = !habit.completedToday;
    habit.currentStreak = habit.completedToday
      ? habit.currentStreak + 1
      : Math.max(0, habit.currentStreak - 1);
    return {
      completedToday: habit.completedToday,
      currentStreak: habit.currentStreak,
    };
  }

  async createHabit(
    name: string,
    imageSourcePath: string,
    options?: { skipWeekends?: boolean },
  ): Promise<Habit> {
    this.createCalls.push({
      name,
      imageSourcePath,
      skipWeekends: options?.skipWeekends,
    });
    if (this.failNextCreate) {
      this.failNextCreate = false;
      throw new Error("create failed");
    }
    const id = this.nextId++;
    this.habits.push({
      id,
      name,
      imagePath: `/managed/${id}.png`,
      currentStreak: 0,
      completedToday: false,
      skipWeekends: options?.skipWeekends ?? false,
    });
    return {
      id,
      name,
      imagePath: `/managed/${id}.png`,
      createdAt: this.today,
      active: true,
      currentStreak: 0,
      sortOrder: this.habits.length - 1,
      skipWeekends: options?.skipWeekends ?? false,
    };
  }

  async editHabit(habitId: number, patch: EditHabitPatch): Promise<void> {
    this.editCalls.push({ habitId, patch });
    const habit = this.habits.find((h) => h.id === habitId);
    if (habit && patch.name !== undefined) habit.name = patch.name;
  }

  async deleteHabit(habitId: number): Promise<void> {
    this.deleteCalls.push(habitId);
    this.habits = this.habits.filter((h) => h.id !== habitId);
  }

  async reorderHabits(orderedHabitIds: number[]): Promise<void> {
    this.reorderCalls.push(orderedHabitIds);
    if (this.failNextReorder) {
      this.failNextReorder = false;
      throw new Error("reorder failed");
    }

    const habitsById = new Map(this.habits.map((habit) => [habit.id, habit]));
    this.habits = orderedHabitIds.map((id) => {
      const habit = habitsById.get(id);
      if (!habit) throw new Error(`habit ${id} not found`);
      return habit;
    });
  }

  async pickImage(): Promise<string | null> {
    return "/fake/source.png";
  }

  toRenderableImageUrl(storedImagePath: string): string {
    return `asset://${storedImagePath}`;
  }
}
