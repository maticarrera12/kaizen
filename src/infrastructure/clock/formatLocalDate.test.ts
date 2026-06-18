import { describe, expect, test } from "vitest";
import { formatLocalDate } from "./formatLocalDate";

describe("formatLocalDate", () => {
  test("formats a mid-day date as YYYY-MM-DD using local components", () => {
    const date = new Date(2026, 5, 17, 12, 0, 0); // June 17 2026, local noon
    expect(formatLocalDate(date)).toBe("2026-06-17");
  });

  test("zero-pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5, 9, 30, 0); // Jan 5 2026, local
    expect(formatLocalDate(date)).toBe("2026-01-05");
  });

  test("uses local calendar date, not the UTC calendar date, near midnight in a negative UTC offset", () => {
    // This instant is 2026-06-18 23:30 UTC. In a host timezone with a
    // negative UTC offset of 3 hours or more behind UTC (e.g. UTC-3, used
    // in CI/dev for this project), the local wall-clock time is still
    // 2026-06-18 20:30 — same local day. To prove the REAL divergence
    // case (local day behind UTC day), use an instant at 00:30 UTC: in
    // UTC-3 that is 21:30 on the PREVIOUS local day.
    //
    // 2026-06-18T00:30:00Z -> UTC date is 2026-06-18, but in UTC-3 the
    // local wall-clock date is still 2026-06-17 (21:30 local).
    const instant = new Date("2026-06-18T00:30:00Z");

    const utcDateString = instant.toISOString().slice(0, 10);
    const localResult = formatLocalDate(instant);

    // The banned pattern (UTC slice) reports "2026-06-18" here.
    expect(utcDateString).toBe("2026-06-18");

    // formatLocalDate MUST read local Date components instead, which in a
    // negative-UTC-offset host (this project's dev/CI timezone, UTC-3)
    // yields the previous local calendar day — proving it does NOT fall
    // back to the UTC slice.
    expect(localResult).toBe(
      `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, "0")}-${String(instant.getDate()).padStart(2, "0")}`,
    );
    expect(localResult).not.toBe(utcDateString);
  });

  test("zero-pads month and day independently", () => {
    const date = new Date(2099, 10, 3); // Nov 3 2099
    expect(formatLocalDate(date)).toBe("2099-11-03");
  });
});
