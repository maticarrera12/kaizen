import type { Clock } from "../../application/ports/Clock";
import type { LocalDate } from "../../domain/streak/types";
import { formatLocalDate } from "./formatLocalDate";

/**
 * Real `Clock` implementation. Delegates all formatting to the pure,
 * TDD'd `formatLocalDate` — this class itself has nothing to unit test
 * beyond "calls `new Date()` and formats it", which is exercised by the
 * pure function's tests. Kept deliberately thin.
 */
export class SystemClock implements Clock {
  today(): LocalDate {
    return formatLocalDate(new Date());
  }
}
