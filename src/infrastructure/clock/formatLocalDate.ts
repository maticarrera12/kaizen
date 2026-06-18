import type { LocalDate } from "../../domain/streak/types";

/**
 * Formats a `Date` as a LOCAL calendar date string (YYYY-MM-DD).
 *
 * MUST read local accessors (`getFullYear`/`getMonth`/`getDate`) — NEVER
 * `date.toISOString().slice(0, 10)`, which reads the UTC calendar date and
 * drifts from the user's local date near midnight in any non-UTC timezone.
 */
export function formatLocalDate(date: Date): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
