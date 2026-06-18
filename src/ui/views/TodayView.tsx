import { useEffect, useState } from "react";
import type { HabitTrackerApp } from "../../infrastructure/composition/createHabitTrackerApp";
import type { HabitStore, createHabitStore } from "../../state/habitStore";
import { Toast } from "../atoms/Toast";
import { HabitGrid } from "../organisms/HabitGrid";
import { HabitForm } from "../organisms/HabitForm";
import type { HabitFormValues } from "../organisms/HabitForm";

export interface TodayViewProps {
  useHabitStore: ReturnType<typeof createHabitStore>;
  app: HabitTrackerApp;
}

export function TodayView({ useHabitStore, app }: TodayViewProps) {
  const habits = useHabitStore((state: HabitStore) => state.habits);
  const error = useHabitStore((state: HabitStore) => state.error);
  const init = useHabitStore((state: HabitStore) => state.init);
  const toggle = useHabitStore((state: HabitStore) => state.toggle);
  const createHabit = useHabitStore((state: HabitStore) => state.createHabit);
  const editHabit = useHabitStore((state: HabitStore) => state.editHabit);
  const deleteHabit = useHabitStore((state: HabitStore) => state.deleteHabit);
  const reorderHabits = useHabitStore((state: HabitStore) => state.reorderHabits);
  const clearError = useHabitStore((state: HabitStore) => state.clearError);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const editingHabit = habits.find((habit) => habit.id === editingHabitId);

  const handleCreate = async (values: HabitFormValues) => {
    await createHabit(values.name, values.imageSourcePath, {
      skipWeekends: values.skipWeekends,
    });
    setIsCreateOpen(false);
  };

  const handleEditSubmit = async (values: HabitFormValues) => {
    if (editingHabitId === null) return;
    await editHabit(editingHabitId, {
      name: values.name,
      imageSourcePath: values.imageSourcePath || undefined,
      skipWeekends: values.skipWeekends,
    });
    setEditingHabitId(null);
  };

  const handleDelete = async () => {
    if (editingHabitId === null) return;
    await deleteHabit(editingHabitId);
    setEditingHabitId(null);
  };

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Today
        </h1>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          + Add habit
        </button>
      </header>

      <section className="mx-auto mt-10 max-w-5xl">
        {habits.length === 0 ? (
          <p className="text-center text-slate-500">
            No habits yet — add your first one to get started.
          </p>
        ) : (
          <HabitGrid
            habits={habits}
            toImageUrl={(path) => app.toRenderableImageUrl(path)}
            onToggle={toggle}
            onEdit={setEditingHabitId}
            onReorder={(nextHabits) =>
              reorderHabits(nextHabits.map((habit) => habit.id))
            }
          />
        )}
      </section>

      {isCreateOpen && (
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          onPickImage={app.pickImage}
          toImageUrl={(path) => app.toRenderableImageUrl(path)}
        />
      )}

      {editingHabit && (
        <HabitForm
          initialName={editingHabit.name}
          initialImageUrl={app.toRenderableImageUrl(editingHabit.imagePath)}
          initialSkipWeekends={editingHabit.skipWeekends}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingHabitId(null)}
          onDelete={handleDelete}
          onPickImage={app.pickImage}
          toImageUrl={(path) => app.toRenderableImageUrl(path)}
        />
      )}

      <Toast message={error} onDismiss={clearError} />
    </main>
  );
}
