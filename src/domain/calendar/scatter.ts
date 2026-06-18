import type { LocalDate } from "../streak/types";

export interface PostItTransform {
  rotationDeg: number; // bounded, [-8, 8]
  topPct: number; // cell-relative absolute position, clamped [6, 94]
  leftPct: number; // cell-relative absolute position, clamped [6, 94]
  zIndex: number; // driven by indexInDay only
}

const MAX_ROTATION_DEG = 8;

/** Safe bounds so the 32px post-it never overflows the cell edges. */
const MIN_PCT = 6;
const MAX_PCT = 94;

/**
 * Fixed set of 6 irregularly-spread anchor positions covering the day cell
 * (NOT a neat 2x3 grid). Each `indexInDay` maps to a distinct anchor, so
 * positions never collide by construction regardless of hash. Geometry is
 * fixed at the max cap (not scaled to the active count) so an already
 * rendered post-it keeps its slot when siblings are added/removed (R2.2).
 */
const ANCHORS: ReadonlyArray<{ top: number; left: number }> = [
  { top: 18, left: 22 },
  { top: 30, left: 70 },
  { top: 55, left: 12 },
  { top: 68, left: 50 },
  { top: 40, left: 88 },
  { top: 80, left: 78 },
];

/** Local jitter radius (in pct points) applied around each anchor. */
const JITTER_RADIUS_PCT = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** FNV-1a (32-bit, no crypto, pure integer ops). */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Deterministic pure transform seeded by `(habitId, date)` for rotation and
 * jitter, and by `indexInDay` for anchor slot selection. `indexInDay` now
 * drives POSITION (not just zIndex): each index maps to a distinct fixed
 * anchor spread irregularly across the cell, so siblings never stack.
 * Adding/removing other mascots on the same day never reshuffles an
 * already-rendered post-it's anchor (stable across re-renders, R2.2).
 */
export function computePostItTransform(
  habitId: number,
  date: LocalDate,
  indexInDay: number,
): PostItTransform {
  const hash = fnv1a(`${habitId}:${date}`);

  const rotationDeg =
    ((hash & 0xff) / 255) * 2 * MAX_ROTATION_DEG - MAX_ROTATION_DEG;
  const jitterTop =
    (((hash >>> 8) & 0xff) / 255) * 2 * JITTER_RADIUS_PCT - JITTER_RADIUS_PCT;
  const jitterLeft =
    (((hash >>> 16) & 0xff) / 255) * 2 * JITTER_RADIUS_PCT -
    JITTER_RADIUS_PCT;

  const anchor = ANCHORS[indexInDay % ANCHORS.length];

  const topPct = clamp(anchor.top + jitterTop, MIN_PCT, MAX_PCT);
  const leftPct = clamp(anchor.left + jitterLeft, MIN_PCT, MAX_PCT);

  return {
    rotationDeg,
    topPct,
    leftPct,
    zIndex: indexInDay,
  };
}
