import type {
  Habit,
  HabitPatch,
  HabitRepository,
  NewHabit,
} from "../../src/application/ports/HabitRepository";

export class FakeHabitRepository implements HabitRepository {
  private habits: Habit[] = [];
  private nextId = 1;

  async create(habit: NewHabit): Promise<Habit> {
    const sortOrder =
      this.habits.length === 0
        ? 0
        : Math.max(...this.habits.map((h) => h.sortOrder)) + 1;
    const created: Habit = {
      id: this.nextId++,
      name: habit.name,
      imagePath: habit.imagePath,
      createdAt: habit.createdAt,
      active: true,
      currentStreak: 0,
      sortOrder,
      skipWeekends: habit.skipWeekends ?? false,
    };
    this.habits.push(created);
    return created;
  }

  async update(id: number, patch: HabitPatch): Promise<void> {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return;
    if (patch.name !== undefined) habit.name = patch.name;
    if (patch.imagePath !== undefined) habit.imagePath = patch.imagePath;
    if (patch.skipWeekends !== undefined) habit.skipWeekends = patch.skipWeekends;
  }

  async softDelete(id: number): Promise<void> {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return;
    habit.active = false;
  }

  async listActive(): Promise<Habit[]> {
    return this.habits
      .filter((h) => h.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  async updateOrder(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const habit = this.habits.find((h) => h.id === id);
      if (habit) habit.sortOrder = index;
    });
  }

  async updateStreakCache(id: number, streak: number): Promise<void> {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return;
    habit.currentStreak = streak;
  }

  // Test helpers (not part of the port contract)
  seed(habit: Habit): void {
    this.habits.push(habit);
    if (habit.id >= this.nextId) this.nextId = habit.id + 1;
  }

  all(): Habit[] {
    return this.habits;
  }
}
