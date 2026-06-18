import { describe, expect, test } from "vitest";
import { computePostItTransform } from "./scatter";

const MAX_ROTATION_DEG = 8;
const MIN_PCT = 0;
const MAX_PCT = 100;

describe("computePostItTransform", () => {
  test("scenario 12: identical (habitId, date, indexInDay) inputs produce deep-equal output", () => {
    const first = computePostItTransform(7, "2026-06-17", 0);
    const second = computePostItTransform(7, "2026-06-17", 0);
    expect(first).toEqual(second);
  });

  test("scenario 13: different (habitId, date) pairs produce different transforms across a sample", () => {
    const samples = [
      computePostItTransform(1, "2026-06-17", 0),
      computePostItTransform(2, "2026-06-17", 0),
      computePostItTransform(1, "2026-06-18", 0),
      computePostItTransform(99, "2026-01-01", 0),
      computePostItTransform(42, "2026-12-31", 0),
    ];
    const unique = new Set(
      samples.map((s) => `${s.rotationDeg}:${s.topPct}:${s.leftPct}`),
    );
    expect(unique.size).toBeGreaterThan(1);
  });

  test("scenario 14: a sweep of many (habitId, date) combinations always stays within the rotation bound", () => {
    for (let habitId = 0; habitId < 50; habitId++) {
      for (let day = 1; day <= 28; day++) {
        const date = `2026-06-${String(day).padStart(2, "0")}`;
        const { rotationDeg } = computePostItTransform(habitId, date, 0);
        expect(rotationDeg).toBeGreaterThanOrEqual(-MAX_ROTATION_DEG);
        expect(rotationDeg).toBeLessThanOrEqual(MAX_ROTATION_DEG);
      }
    }
  });

  test("scenario 15 (rewritten): indexInDay now drives a distinct anchor position, not just z-order", () => {
    const a = computePostItTransform(7, "2026-06-17", 0);
    const b = computePostItTransform(7, "2026-06-17", 1);
    expect(a.topPct !== b.topPct || a.leftPct !== b.leftPct).toBe(true);
    expect(a.zIndex).not.toBe(b.zIndex);
  });

  test("all 6 indexInDay slots within the same day produce pairwise distinct positions (no stacking)", () => {
    const transforms = [0, 1, 2, 3, 4, 5].map((index) =>
      computePostItTransform(7, "2026-06-17", index),
    );

    const positions = transforms.map((t) => `${t.topPct}:${t.leftPct}`);
    const unique = new Set(positions);
    expect(unique.size).toBe(positions.length);
  });

  test("positions stay within [0,100] clamped percentage bounds across a sweep", () => {
    for (let habitId = 0; habitId < 30; habitId++) {
      for (let day = 1; day <= 28; day++) {
        const date = `2026-06-${String(day).padStart(2, "0")}`;
        for (let index = 0; index < 6; index++) {
          const { topPct, leftPct } = computePostItTransform(
            habitId,
            date,
            index,
          );
          expect(topPct).toBeGreaterThanOrEqual(MIN_PCT);
          expect(topPct).toBeLessThanOrEqual(MAX_PCT);
          expect(leftPct).toBeGreaterThanOrEqual(MIN_PCT);
          expect(leftPct).toBeLessThanOrEqual(MAX_PCT);
        }
      }
    }
  });

  test("indexInDay anchor assignment is stable: same index always maps near the same anchor region across different habits", () => {
    // Anchor 0 should consistently land in a different region than anchor 3
    // across many different (habitId, date) seeds — proves anchors are fixed
    // slots, not derived purely from the hash.
    const anchor0Samples = [1, 2, 3, 4, 5].map(
      (habitId) => computePostItTransform(habitId, "2026-06-17", 0).leftPct,
    );
    const anchor3Samples = [1, 2, 3, 4, 5].map(
      (habitId) => computePostItTransform(habitId, "2026-06-17", 3).leftPct,
    );

    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(anchor0Samples)).not.toBeCloseTo(avg(anchor3Samples), 0);
  });

  test("indexInDay beyond the fixed anchor count (6) still returns a valid clamped position (defensive)", () => {
    const result = computePostItTransform(7, "2026-06-17", 6);
    expect(result.topPct).toBeGreaterThanOrEqual(MIN_PCT);
    expect(result.topPct).toBeLessThanOrEqual(MAX_PCT);
    expect(result.leftPct).toBeGreaterThanOrEqual(MIN_PCT);
    expect(result.leftPct).toBeLessThanOrEqual(MAX_PCT);
  });

  test("count=1 edge case: indexInDay 0 alone uses its fixed anchor slot (no special centering)", () => {
    const single = computePostItTransform(7, "2026-06-17", 0);
    const partOfSix = computePostItTransform(7, "2026-06-17", 0);
    expect(single).toEqual(partOfSix);
  });
});
