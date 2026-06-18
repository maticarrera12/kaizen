import type { HabitRepository } from "../ports/HabitRepository";
import type { ImageStorage } from "../ports/ImageStorage";

export interface EditHabitPatch {
  name?: string;
  imageSourcePath?: string;
  skipWeekends?: boolean;
}

export interface EditHabitDeps {
  habitRepository: HabitRepository;
  imageStorage: ImageStorage;
}

export async function editHabit(
  habitId: number,
  patch: EditHabitPatch,
  deps: EditHabitDeps,
): Promise<void> {
  if (patch.imageSourcePath === undefined) {
    if (patch.name !== undefined || patch.skipWeekends !== undefined) {
      await deps.habitRepository.update(habitId, {
        name: patch.name,
        skipWeekends: patch.skipWeekends,
      });
    }
    return;
  }

  const habits = await deps.habitRepository.listActive();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) {
    throw new Error(`Habit ${habitId} not found or inactive`);
  }
  const oldImagePath = habit.imagePath;

  // Copy the new image FIRST. Only delete the old file once the new copy
  // has succeeded — locked decision: no orphaned files, and never leave
  // the habit without a valid image if the copy fails.
  const newImagePath = await deps.imageStorage.copy(patch.imageSourcePath);

  await deps.habitRepository.update(habitId, {
    name: patch.name,
    imagePath: newImagePath,
    skipWeekends: patch.skipWeekends,
  });

  await deps.imageStorage.delete(oldImagePath);
}
