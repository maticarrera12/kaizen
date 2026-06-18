import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CalendarDayResult } from "../../application/use-cases/loadCalendar";
import type { LocalDate } from "../../domain/streak/types";
import { WeekView } from "./WeekView";

function buildDays(dates: LocalDate[]): Map<LocalDate, CalendarDayResult> {
  const days = new Map<LocalDate, CalendarDayResult>();
  for (const date of dates) {
    days.set(date, { date, mascots: [], overflowCount: 0 });
  }
  return days;
}

const WEEK_DATES: LocalDate[] = [
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",
  "2026-06-20",
  "2026-06-21",
];

describe("WeekView", () => {
  test("renders exactly 7 day cells for a Monday-start week", () => {
    render(
      <WeekView
        weekDates={WEEK_DATES}
        days={buildDays(WEEK_DATES)}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getAllByTestId("day-cell")).toHaveLength(7);
  });

  test("renders without throwing when a day is missing from the days map", () => {
    render(
      <WeekView
        weekDates={WEEK_DATES}
        days={new Map()}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getAllByTestId("day-cell")).toHaveLength(7);
  });

  test("renders a Monday-first weekday header above the grid", () => {
    render(
      <WeekView
        weekDates={WEEK_DATES}
        days={buildDays(WEEK_DATES)}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    const header = screen.getByTestId("weekday-header");
    const labels = Array.from(header.children).map((el) => el.textContent);
    expect(labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});
