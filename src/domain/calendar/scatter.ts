import type { LocalDate } from "../streak/types";

export interface PostItTransform {
  rotationDeg: number; // bounded, [-8, 8]
  topPct: number; // cell-relative absolute position, clamped [MIN_PCT, MAX_PCT]
  leftPct: number; // cell-relative absolute position, clamped [MIN_PCT, MAX_PCT]
  zIndex: number; // driven by indexInDay only
}

const MAX_ROTATION_DEG = 8;

/**
 * Safe bounds so the 44px post-it (positioned by its top-left corner) stays
 * clear of the cell edges across typical day-cell widths. This is a
 * percentage-based approximation — it cannot know the exact pixel width of
 * the cell, so `DayCell`'s scatter area additionally applies
 * `overflow-hidden` clipped to the card's rounded corners as the hard
 * guarantee against spill, even if a post-it lands close to an edge on an
 * unusually narrow viewport.
 */
const MIN_PCT = 15;
const MAX_PCT = 80;

/** FNV-1a (32-bit, no crypto, pure integer ops). */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // unsigned 32-bit
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deterministic pure transform seeded by `(habitId, date)` for rotation and
 * jitter, and by `(indexInDay, totalInDay)` for grid-cell placement.
 *
 * Distribution scales to the day's count instead of a fixed 6-anchor table:
 * the cell is divided into a `cols x rows` grid sized to `totalInDay`
 * (`cols = ceil(sqrt(totalInDay))`, `rows = ceil(totalInDay / cols)`), each
 * index maps to its own grid cell by `(col, row)`, and a hash-seeded jitter
 * is added within that cell so the result looks organic rather than a neat
 * grid. This guarantees pairwise-distinct base cells for every index in the
 * same day (no stacking) and spreads mascots across the WHOLE cell instead
 * of clustering near a handful of fixed points.
 */
export function computePostItTransform(
  habitId: number,
  date: LocalDate,
  indexInDay: number,
  totalInDay: number,
): PostItTransform {
  const hash = fnv1a(`${habitId}:${date}`);

  const rotationDeg =
    ((hash & 0xff) / 255) * 2 * MAX_ROTATION_DEG - MAX_ROTATION_DEG;

  const count = Math.max(1, totalInDay);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));

  const safeIndex = ((indexInDay % count) + count) % count;
  const col = safeIndex % cols;
  const row = Math.floor(safeIndex / cols);

  const cellWidthPct = 100 / cols;
  const cellHeightPct = 100 / rows;

  const cellCenterLeft = col * cellWidthPct + cellWidthPct / 2;
  const cellCenterTop = row * cellHeightPct + cellHeightPct / 2;

  // Jitter within the cell, seeded by hash + index so it's deterministic
  // and varies per slot (not just per day). Bounded to a fraction of the
  // cell size so items stay inside their own cell — "organic", not random.
  const jitterSeed = fnv1a(`${habitId}:${date}:${indexInDay}`);
  const jitterRangeTop = cellHeightPct * 0.3;
  const jitterRangeLeft = cellWidthPct * 0.3;

  const jitterTop =
    (((jitterSeed >>> 8) & 0xff) / 255) * 2 * jitterRangeTop - jitterRangeTop;
  const jitterLeft =
    (((jitterSeed >>> 16) & 0xff) / 255) * 2 * jitterRangeLeft -
    jitterRangeLeft;

  const topPct = clamp(cellCenterTop + jitterTop, MIN_PCT, MAX_PCT);
  const leftPct = clamp(cellCenterLeft + jitterLeft, MIN_PCT, MAX_PCT);

  return {
    rotationDeg,
    topPct,
    leftPct,
    zIndex: indexInDay,
  };
}
