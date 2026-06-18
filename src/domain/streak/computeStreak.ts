import type { LocalDate, StreakInput } from "./types";
import { isWeekendUtc } from "./weekend";

/**
 * Pure per-habit streak walk. Zero Tauri/React/SQLite imports.
 *
 * Walks backward day-by-day from `today` down to `createdAt` (inclusive),
 * counting consecutive completed days. Exactly ONE consecutive missed day
 * is held as a "grace day" without resetting the streak; a second
 * consecutive miss stops the walk.
 *
 * `today` is special-cased as PENDING: if it is unmarked, it does not count
 * toward the streak, does not count as a miss, and does not consume the
 * grace slot — the day simply has not ended yet. If `today` IS marked, it
 * is treated exactly like any other completed day. This rule applies ONLY
 * to the cursor at `input.today` itself; every day strictly before today
 * follows the normal marked/missed accounting.
 *
 * NOTE: the global "app closed 3+ days -> reset all habits" short-circuit
 * is NOT implemented here. That is an orchestration concern that belongs
 * in the `loadToday` use case (application layer), which must check
 * `days_since_last_open >= 3` and skip calling this function entirely when
 * it fires. This function has no knowledge of "days since last open" by
 * design — see computeStreak.test.ts for the locked boundary test.
 */
export function computeStreak(input: StreakInput): number {
  const completedDates = toCompletedDateSet(input.records);

  let streak = 0;
  let consecutiveMisses = 0;
  let graceUsed = false;
  let cursor = input.today;

  while (cursor >= input.createdAt) {
    if (completedDates.has(cursor)) {
      streak += 1;
      consecutiveMisses = 0;
    } else if (cursor === input.today) {
      // Today is pending, not a miss, until the day ends: skip it entirely
      // without touching consecutiveMisses or graceUsed.
    } else if (input.skipWeekends && isWeekendUtc(cursor)) {
      // Unmarked weekend day on a weekend-skip habit: neutral, like
      // today-pending — no increment, no miss, no grace consumed. Marked
      // weekend days are handled by the first branch above and always
      // count; this branch only ever applies to UNMARKED weekend days.
    } else {
      consecutiveMisses += 1;
      const secondConsecutiveMiss = consecutiveMisses >= 2;
      if (secondConsecutiveMiss || graceUsed) {
        break;
      }
      graceUsed = true;
    }
    cursor = previousDate(cursor);
  }

  return streak;
}

function toCompletedDateSet(records: StreakInput["records"]): Set<LocalDate> {
  return new Set(
    records.filter((record) => record.completed).map((record) => record.date),
  );
}

function previousDate(date: LocalDate): LocalDate {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
}
