import { useState } from "react";
import { motion } from "framer-motion";
import { Toast } from "../atoms/Toast";

export interface HabitFormValues {
  name: string;
  imageSourcePath: string;
  skipWeekends: boolean;
}

export interface HabitFormProps {
  initialName?: string;
  initialImageUrl?: string;
  initialSkipWeekends?: boolean;
  onSubmit: (values: HabitFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onPickImage: () => Promise<string | null>;
  toImageUrl: (sourcePath: string) => string;
}

export function HabitForm({
  initialName = "",
  initialImageUrl,
  initialSkipWeekends = false,
  onSubmit,
  onCancel,
  onDelete,
  onPickImage,
  toImageUrl,
}: HabitFormProps) {
  const [name, setName] = useState(initialName);
  const [imageSourcePath, setImageSourcePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    initialImageUrl,
  );
  const [skipWeekends, setSkipWeekends] = useState(initialSkipWeekends);
  const [nameError, setNameError] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const picked = await onPickImage();
      if (picked === null) return;
      setImageSourcePath(picked);
      setPreviewUrl(toImageUrl(picked));
      setPickError(null);
    } catch (error) {
      setPickError(
        error instanceof Error ? error.message : "Could not load image",
      );
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);

    // Locked decision: on image-copy/pick failure, do NOT save. Submission
    // requires a successfully picked image (create) or relies on the
    // existing image when editing without replacement (imageSourcePath
    // stays null and the use case treats that as "no image change").
    if (pickError) {
      return;
    }
    if (!initialImageUrl && imageSourcePath === null) {
      setPickError("Please choose an image");
      return;
    }

    onSubmit({
      name: trimmedName,
      imageSourcePath: imageSourcePath ?? "",
      skipWeekends,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl"
      >
        <h2 className="font-display text-lg font-semibold text-slate-900">
          {initialName ? "Edit habit" : "New habit"}
        </h2>

        <label
          htmlFor="habit-name"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {nameError && (
          <p className="mt-1 text-sm text-red-600">{nameError}</p>
        )}

        <div className="mt-4 flex items-center gap-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={handlePickImage}
            className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            Choose image
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">
            Skip weekends
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              role="switch"
              aria-checked={skipWeekends}
              aria-label="Skip weekends"
              checked={skipWeekends}
              onChange={(event) => setSkipWeekends(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2" />
            <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <div className="flex flex-1 justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Save
            </button>
          </div>
        </div>
      </motion.form>

      <Toast message={pickError} onDismiss={() => setPickError(null)} />
    </motion.div>
  );
}
