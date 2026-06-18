import type { LocalDate } from "../../domain/streak/types";
import { computePostItTransform } from "../../domain/calendar/scatter";

export interface MascotPostItProps {
  imageUrl: string;
  name: string;
  habitId: number;
  date: LocalDate;
  indexInDay: number;
}

/**
 * Read-only by construction — no `onToggle`/`onEdit` prop exists, so there
 * is structurally no way to mutate completion state from a calendar cell
 * (R5.5). Computes its own scatter transform from the pure domain helper;
 * the use case/view-model never carries presentation concerns (style
 * values), matching the hexagonal boundary kept elsewhere in the app.
 */
export function MascotPostIt({
  imageUrl,
  name,
  habitId,
  date,
  indexInDay,
}: MascotPostItProps) {
  const { rotationDeg, offsetXPercent, offsetYPercent, zIndex } =
    computePostItTransform(habitId, date, indexInDay);

  return (
    <div
      className="absolute h-8 w-8"
      style={{
        transform: `rotate(${rotationDeg}deg) translate(${offsetXPercent}%, ${offsetYPercent}%)`,
        zIndex,
      }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="h-full w-full rounded-full object-cover shadow-sm ring-2 ring-surface"
      />
    </div>
  );
}
