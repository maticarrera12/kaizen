import { describe, expect, test } from "vitest";
import { computeStreak } from "./computeStreak";
import type { DailyRecord } from "./types";

describe("computeStreak", () => {
  test("marking today increments a streak that was 3 as of yesterday", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true },
      { date: "2026-06-15", completed: true },
      { date: "2026-06-16", completed: true },
      { date: "2026-06-17", completed: true }, // today, just marked
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(4);
  });

  test("unmarked today is neutral (pending), not a miss: it does not consume the grace slot", () => {
    // today is unmarked, yesterday is a REAL miss (the single grace day),
    // and the day before is completed. Per the resolved behavior decision,
    // an unmarked "today" must be skipped entirely from miss-accounting —
    // it is pending until the day ends, not yet a miss. So the grace slot
    // is consumed by yesterday's real miss, not by today.
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true },
      // 2026-06-15 (yesterday) missing — the one real grace miss
      // 2026-06-16 (today) unmarked — neutral, must NOT consume grace
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-16", // app opens today, today itself not yet marked
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(1);
  });

  test("BUG REGRESSION: marked D-2, missed D-1, unmarked today — streak holds at 1, today does not consume grace", () => {
    // This is the exact bug scenario from the adversarial review: before the
    // fix, an unmarked "today" was walked as a normal miss and consumed the
    // single grace slot, so by the time the walk reached the REAL miss at
    // D-1 there was no grace left and the streak wrongly reset to 0.
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true }, // D-2
      // 2026-06-15 (D-1) missing — the one real miss, covered by grace
      // 2026-06-16 (today, D) unmarked — neutral, skipped entirely
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-16",
      createdAt: "2026-06-14",
      skipWeekends: false,
    });

    expect(streak).toBe(1);
  });

  test("marked D-1 and D-2, today unmarked — streak counts the two marked days, today is neutral", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true }, // D-2
      { date: "2026-06-16", completed: true }, // D-1
      // 2026-06-17 (today) unmarked — neutral
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("today marked, D-1 marked, D-2 marked — streak counts all three including today", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true }, // D-2
      { date: "2026-06-16", completed: true }, // D-1
      { date: "2026-06-17", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(3);
  });

  test("today unmarked, D-1 unmarked, D-2 marked — only D-1 is a real miss, grace holds at 1", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true }, // D-2
      // 2026-06-16 (D-1) missing — the one real miss
      // 2026-06-17 (today) unmarked — neutral
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(1);
  });

  test("today unmarked, D-1 and D-2 both unmarked — two real consecutive misses break the streak to 0", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true }, // D-3
      // 2026-06-15 (D-2) missing — first real miss
      // 2026-06-16 (D-1) missing — second real miss, breaks
      // 2026-06-17 (today) unmarked — neutral, irrelevant to the break
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(0);
  });

  test("two consecutive missed days reset the streak to 0", () => {
    // 3-day streak as of four days ago. D-1 and D-2 are both REAL misses
    // (two consecutive misses -> break). Today itself is also unmarked, but
    // per the today-is-pending rule it is neutral and never reached anyway:
    // the walk already breaks at D-2, one step before it would get to today.
    const records: DailyRecord[] = [
      { date: "2026-06-11", completed: true },
      { date: "2026-06-12", completed: true },
      { date: "2026-06-13", completed: true },
      // 2026-06-14 (D-2) missing — first real miss
      // 2026-06-15 (D-1) missing — second real miss, breaks the streak
      // 2026-06-16 (today) unmarked — neutral, never reached
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-16",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(0);
  });

  test("createdAt guard: a completed record dated before createdAt must be ignored, not added to the streak", () => {
    // habit created 2026-06-15, marked complete both days since, today
    // unmarked (neutral). A completed record exists at 2026-06-14, one day
    // BEFORE createdAt. Without the createdAt guard, the walk would step
    // past createdAt, find 06-14 completed, and credit it too: streak would
    // wrongly become 3. With the guard, the walk halts at createdAt and
    // 06-14 is never read: streak stays 2.
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true }, // before createdAt — must be ignored
      { date: "2026-06-15", completed: true }, // createdAt
      { date: "2026-06-16", completed: true },
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-15",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("creation-day grace: today unmarked is neutral, leaving the streak unaffected by a non-existent pre-creation history", () => {
    // RELABELED: this test's real purpose is the today-is-pending rule, not
    // the createdAt guard. Habit created 2026-06-15, 06-15 and 06-16 both
    // completed, today (06-17) unmarked — neutral, no grace consumed, no
    // miss recorded. Streak is simply the count of completed days.
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true },
      { date: "2026-06-16", completed: true },
      // 2026-06-17 (today) not yet marked — neutral, not a miss
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-15",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("RELABELED (not a guard test — termination sanity check): a habit created today with no records and today still unmarked yields 0, in a single neutral step", () => {
    // habit created today, no records at all, today itself unmarked
    // (neutral, per the today-is-pending rule). This does NOT exercise the
    // createdAt guard in a load-bearing way: with createdAt === today there
    // is only one cursor position to ever visit, so this test cannot
    // distinguish "guard present" from "guard deleted" — it only confirms
    // the walk terminates and returns 0 instead of looping or throwing.
    const streak = computeStreak({
      records: [],
      today: "2026-06-17",
      createdAt: "2026-06-17",
      skipWeekends: false,
    });

    expect(streak).toBe(0);
  });

  test("createdAt guard: a completed record before createdAt is ignored even when a real grace miss exists within the habit's lifetime", () => {
    // habit created 2026-06-16. Created day completed, then a real miss on
    // 06-17 (grace), then completed today 06-18. A completed record also
    // exists at 2026-06-15, one day BEFORE createdAt. Without the guard, the
    // walk would step past createdAt after the grace miss, find 06-15
    // completed, and wrongly extend the streak to 3. With the guard, the
    // walk halts at createdAt: streak stays 2.
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true }, // before createdAt — must be ignored
      { date: "2026-06-16", completed: true }, // creation day
      // 2026-06-17 missing — real grace day, habit existed and was skipped
      { date: "2026-06-18", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-18",
      createdAt: "2026-06-16",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("createdAt guard: a miss on the creation day itself consumes grace, and a completed record before createdAt is still ignored", () => {
    // habit created 2026-06-17 (yesterday relative to today). Creation day
    // itself was NOT completed (real miss, consumes the single grace slot),
    // then today (06-18) IS completed: streak=1. A completed record also
    // exists at 2026-06-16, one day BEFORE createdAt. Without the guard,
    // after consuming grace on 06-17 the walk would step to 06-16, find it
    // completed, and wrongly extend the streak to 2. With the guard, the
    // walk halts at createdAt: streak stays 1.
    const records: DailyRecord[] = [
      { date: "2026-06-16", completed: true }, // before createdAt — must be ignored
      { date: "2026-06-18", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-18",
      createdAt: "2026-06-17",
      skipWeekends: false,
    });

    expect(streak).toBe(1);
  });

  test("createdAt guard: the day the habit was created is the floor; a completed record one day before it must not extend the count", () => {
    // habit created 2026-06-15 and completed that very day. 06-16 and today
    // (06-17) also completed: an unbroken 3-day streak. A completed record
    // also exists at 2026-06-14, one day BEFORE createdAt. Without the
    // guard, the walk would step past createdAt, find 06-14 completed, and
    // wrongly extend the streak to 4. With the guard, the walk halts at
    // createdAt: streak stays exactly 3.
    const records: DailyRecord[] = [
      { date: "2026-06-14", completed: true }, // before createdAt — must be ignored
      { date: "2026-06-15", completed: true }, // createdAt
      { date: "2026-06-16", completed: true },
      { date: "2026-06-17", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-15",
      skipWeekends: false,
    });

    expect(streak).toBe(3);
  });

  test("createdAt is a hard floor: a miss that would only exist before createdAt must not be charged as a grace day", () => {
    // habit created 2026-06-17, NOT completed on its creation day (real
    // miss — habit existed but wasn't marked), then completed today
    // 2026-06-18. This is exactly ONE miss within the habit's lifetime
    // (createdAt itself), so the grace day covers it and streak must be 1.
    // A buggy implementation that keeps walking past createdAt would find
    // 2026-06-16 also missing (pre-creation, no record) and treat it as a
    // SECOND consecutive miss — which would still report streak=1 here
    // since streak only grows before a break, so this case alone cannot
    // distinguish the bug. The real assertion is in the next test, which
    // adds a completed day BEFORE createdAt that must be fully ignored.
    const records: DailyRecord[] = [
      { date: "2026-06-16", completed: true }, // before createdAt — must be ignored entirely
      { date: "2026-06-18", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-18",
      createdAt: "2026-06-17",
      skipWeekends: false,
    });

    // If pre-creation records were honored, the walk would see: today(✓),
    // 06-17(miss, grace), 06-16(✓ — WRONG, this day is before createdAt)
    // and incorrectly continue accumulating streak=2. The correct result
    // stops crediting at createdAt: streak must be 1.
    expect(streak).toBe(1);
  });

  test("a habit created today with no records shows streak 0", () => {
    const streak = computeStreak({
      records: [],
      today: "2026-06-17",
      createdAt: "2026-06-17",
      skipWeekends: false,
    });

    expect(streak).toBe(0);
  });

  test("sparse records: absence of a row is a miss, only completed=true rows are ever passed in", () => {
    // The records array only ever contains completed=1 rows by contract
    // (sparse storage upstream never writes completed=0 rows). A day with
    // no corresponding entry in `records` must be treated as a miss.
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true },
      // 2026-06-16 absent entirely — no row at all, this is the miss
      { date: "2026-06-17", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(2); // grace day covers the one absent row
  });

  test("re-opening the app the same day after marking today does not change the streak on recompute", () => {
    // Today's mark persists; recomputing on a same-day reopen must be
    // idempotent and yield the same streak as the first computation.
    const records: DailyRecord[] = [
      { date: "2026-06-15", completed: true },
      { date: "2026-06-16", completed: true },
      { date: "2026-06-17", completed: true }, // marked earlier today
    ];

    const input = {
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    };

    const firstComputation = computeStreak(input);
    const recomputeOnReopen = computeStreak(input);

    expect(firstComputation).toBe(3);
    expect(recomputeOnReopen).toBe(3);
  });

  test("empty records over a long-lived habit: all days missed yields streak 0 after the two-miss break", () => {
    // habit created long ago, no completed records at all, today also
    // unmarked (neutral). D-1 and D-2 are both real misses -> break before
    // ever reaching createdAt.
    const streak = computeStreak({
      records: [],
      today: "2026-06-17",
      createdAt: "2026-05-01",
      skipWeekends: false,
    });

    expect(streak).toBe(0);
  });

  test("records given out of chronological order produce the same result as in-order records", () => {
    const inOrder: DailyRecord[] = [
      { date: "2026-06-15", completed: true },
      { date: "2026-06-16", completed: true },
      { date: "2026-06-17", completed: true }, // today
    ];
    const outOfOrder: DailyRecord[] = [
      { date: "2026-06-17", completed: true }, // today, listed first
      { date: "2026-06-15", completed: true }, // earliest, listed second
      { date: "2026-06-16", completed: true }, // middle, listed last
    ];

    const input = (records: DailyRecord[]) => ({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    const streakInOrder = computeStreak(input(inOrder));
    const streakOutOfOrder = computeStreak(input(outOfOrder));

    expect(streakOutOfOrder).toBe(streakInOrder);
    expect(streakOutOfOrder).toBe(3);
  });

  test("duplicate-date records for the same completed day do not double-count the streak", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-16", completed: true },
      { date: "2026-06-16", completed: true }, // duplicate row, same date
      { date: "2026-06-17", completed: true }, // today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("future-dated records beyond today are ignored entirely", () => {
    // A record dated AFTER today (e.g. clock skew, bad data, or a
    // pre-scheduled mark) must never be read — the walk starts at `today`
    // and goes backward, so a future date is simply never visited, and must
    // not influence the result either way.
    const records: DailyRecord[] = [
      { date: "2026-06-18", completed: true }, // future — must be ignored
      { date: "2026-06-17", completed: true }, // today
      { date: "2026-06-16", completed: true },
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    expect(streak).toBe(2);
  });

  test("a single completed record exactly at createdAt with no other history yields streak 1 if today is also that day, otherwise just the one credited day", () => {
    // habit created and completed on the very same day, which is also
    // today: one cursor position, one completed day, streak = 1.
    const streak = computeStreak({
      records: [{ date: "2026-06-17", completed: true }],
      today: "2026-06-17",
      createdAt: "2026-06-17",
      skipWeekends: false,
    });

    expect(streak).toBe(1);
  });

  // Architectural boundary (per design): the GLOBAL "app closed 3+ days ->
  // reset all habits unconditionally" short-circuit is an ORCHESTRATION
  // concern, not a per-habit algorithm concern. It belongs in the
  // `loadToday` use case (application layer, Phase 3), which must check
  // `days_since_last_open >= 3` and skip calling `computeStreak` entirely
  // for that case. `computeStreak` itself has NO concept of
  // "days since last open" — its signature only accepts `records`, `today`,
  // and `createdAt`. This test documents and locks that boundary: even a
  // habit sitting on its single grace day, when walked by computeStreak in
  // isolation with no knowledge of how long the app was closed, is correctly
  // HELD (not hard-reset) — proving the global override cannot and does not
  // happen inside this pure function.
  test("computeStreak has no knowledge of days-since-last-open and never hard-resets a grace day on its own; the global short-circuit lives in loadToday (Phase 3), not here", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-13", completed: true },
      { date: "2026-06-14", completed: true },
      // 2026-06-15 missing — single grace day
      { date: "2026-06-16", completed: true },
      { date: "2026-06-17", completed: true }, // today, marked
    ];

    // Even if, hypothetically, the app had been closed for many days before
    // "today", computeStreak receives no such signal — its StreakInput has
    // no days-since-last-open field — so it can only ever apply the
    // per-habit grace-day rule, never the global hard reset.
    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: false,
    });

    // Held by grace (06-15 miss consumes the single grace slot, then the
    // walk keeps crediting completed days until it hits a second
    // consecutive miss further back), NOT hard-reset to 0. A hard reset to
    // 0 here would only be correct if the global short-circuit had fired —
    // which is impossible inside this function since it has no access to
    // last_open_date.
    expect(streak).toBe(4);
  });
});

describe("computeStreak with skipWeekends: true", () => {
  test("A1: marked Friday, weekend unmarked, today Monday unmarked — streak preserved at 1", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-12", completed: true }, // Friday
      // 2026-06-13 (Sat), 2026-06-14 (Sun) unmarked — weekend-skip, neutral
      // 2026-06-15 (Mon, today) unmarked — today-pending, neutral
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-15", // Monday
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(1);
  });

  test("A2: Mon-Fri marked across a weekend boundary, next Monday marked (today) — streak is 6", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-08", completed: true }, // Mon
      { date: "2026-06-09", completed: true }, // Tue
      { date: "2026-06-10", completed: true }, // Wed
      { date: "2026-06-11", completed: true }, // Thu
      { date: "2026-06-12", completed: true }, // Fri
      // 2026-06-13 (Sat), 2026-06-14 (Sun) unmarked — weekend-skip, neutral
      { date: "2026-06-15", completed: true }, // Mon, today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-15",
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(6);
  });

  test("A3: Friday marked, weekend skipped, Monday unmarked (grace), Tuesday marked (today) — streak is 2", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-12", completed: true }, // Fri
      // 2026-06-13 (Sat), 2026-06-14 (Sun) unmarked — weekend-skip, neutral
      // 2026-06-15 (Mon) unmarked — real weekday miss, consumes grace
      { date: "2026-06-16", completed: true }, // Tue, today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-16",
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(2);
  });

  test("A3b: two consecutive missed WEEKDAYS break the streak even with a weekend in between", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-12", completed: true }, // Fri
      // 2026-06-13 (Sat), 2026-06-14 (Sun) unmarked — weekend-skip, neutral
      // 2026-06-15 (Mon) unmarked — real miss #1, consumes grace
      // 2026-06-16 (Tue) unmarked — real miss #2, breaks the streak
      // 2026-06-17 (Wed, today) unmarked — today-pending, neutral
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-17",
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(0);
  });

  test("A4: marking a Saturday counts (+1) — marked beats weekend-skip", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-13", completed: true }, // Sat, today
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-13",
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(1);
  });

  test("A5: today is a weekend day (Sunday) and unmarked — neutral via today-pending, not double-processed; prior Friday's mark is the only contribution", () => {
    const records: DailyRecord[] = [
      { date: "2026-06-12", completed: true }, // Fri
      // 2026-06-13 (Sat) unmarked — weekend-skip, neutral
      // 2026-06-14 (Sun, today) unmarked — today-pending, neutral (not also weekend-skip)
    ];

    const streak = computeStreak({
      records,
      today: "2026-06-14", // Sunday
      createdAt: "2026-06-01",
      skipWeekends: true,
    });

    expect(streak).toBe(1);
  });
});
