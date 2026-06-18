import type { CompletedRecordWithHabit, LocalDate } from "../../domain/streak/types";
import type { DailyRecordRepository } from "../ports/DailyRecordRepository";

const CROWDING_CAP = 6;

export interface LoadCalendarDeps {
  dailyRecordRepository: DailyRecordRepository;
}

export interface CalendarMascot {
  id: number; // habitId
  name: string;
  imagePath: string;
}

export interface CalendarDayResult {
  date: LocalDate;
  mascots: CalendarMascot[]; // capped at CROWDING_CAP
  overflowCount: number; // 0 when total <= CROWDING_CAP
}

export interface LoadCalendarResult {
  days: Map<LocalDate, CalendarDayResult>;
}

export interface LoadCalendarRange {
  from: LocalDate;
  to: LocalDate;
  allDatesInOrder: LocalDate[];
}

/**
 * Range-agnostic: callers pass either a 7-day week range or a full
 * month-grid range (which may span into adjacent months) — same code path
 * (R3.6). `allDatesInOrder` must include every date the caller wants
 * represented (including zero-completion days, R3.2) since this function
 * only knows about dates with completions unless told otherwise.
 */
export async function loadCalendar(
  deps: LoadCalendarDeps,
  range: LoadCalendarRange,
): Promise<LoadCalendarResult> {
  const records = await deps.dailyRecordRepository.listCompletedBetween(
    range.from,
    range.to,
  );

  const byDate = new Map<LocalDate, CompletedRecordWithHabit[]>();
  for (const record of records) {
    const bucket = byDate.get(record.date) ?? [];
    bucket.push(record);
    byDate.set(record.date, bucket);
  }

  const days = new Map<LocalDate, CalendarDayResult>();
  for (const date of range.allDatesInOrder) {
    // "First 6" tiebreak: ascending habitId — deterministic, requires no
    // extra dependency (sort_order lookup would need HabitRepository too).
    const bucket = (byDate.get(date) ?? [])
      .slice()
      .sort((a, b) => a.habitId - b.habitId);

    days.set(date, {
      date,
      mascots: bucket.slice(0, CROWDING_CAP).map((r) => ({
        id: r.habitId,
        name: r.name,
        imagePath: r.imagePath,
      })),
      overflowCount: Math.max(0, bucket.length - CROWDING_CAP),
    });
  }

  return { days };
}
