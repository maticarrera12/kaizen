import { createHabitEntity } from "../../domain/habit/Habit";
import type { Clock } from "../ports/Clock";
import type { Habit, HabitRepository } from "../ports/HabitRepository";
import type { ImageStorage } from "../ports/ImageStorage";

export interface CreateHabitDeps {
  habitRepository: HabitRepository;
  imageStorage: ImageStorage;
  clock: Clock;
}

export interface CreateHabitOptions {
  skipWeekends?: boolean;
}

export async function createHabit(
  name: string,
  imageSourcePath: string,
  deps: CreateHabitDeps,
  options: CreateHabitOptions = {},
): Promise<Habit> {
  const today = deps.clock.today();

  // Validate before touching the filesystem: an invalid name must never
  // trigger an image copy.
  createHabitEntity({ name, imagePath: "", createdAt: today });

  // Image copy must succeed before the habit is persisted — on failure we
  // throw and do NOT create a habit row (locked decision: no partial
  // create, no habit referencing a non-existent image).
  const imagePath = await deps.imageStorage.copy(imageSourcePath);

  return deps.habitRepository.create({
    name,
    imagePath,
    createdAt: today,
    skipWeekends: options.skipWeekends ?? false,
  });
}
