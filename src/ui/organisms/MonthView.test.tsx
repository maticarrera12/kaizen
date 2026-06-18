import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CalendarDayResult } from "../../application/use-cases/loadCalendar";
import { monthGrid } from "../../domain/calendar/grid";
import type { LocalDate } from "../../domain/streak/types";
import { MonthView } from "./MonthView";

function buildDays(dates: LocalDate[]): Map<LocalDate, CalendarDayResult> {
  const days = new Map<LocalDate, CalendarDayResult>();
  for (const date of dates) {
    days.set(date, { date, mascots: [], overflowCount: 0 });
  }
  return days;
}

describe("MonthView", () => {
  test("renders a 35 or 42 cell grid for the month containing the anchor", () => {
    const grid = monthGrid("2026-06-01");
    const days = buildDays(grid.map((cell) => cell.date));

    render(
      <MonthView grid={grid} days={days} toImageUrl={(path) => `asset://${path}`} />,
    );

    const cellCount = screen.getAllByTestId("day-cell").length;
    expect([35, 42]).toContain(cellCount);
    expect(cellCount).toBe(grid.length);
  });

  test("dims leading/trailing out-of-month cells", () => {
    const grid = monthGrid("2026-06-01");
    const days = buildDays(grid.map((cell) => cell.date));

    render(
      <MonthView grid={grid} days={days} toImageUrl={(path) => `asset://${path}`} />,
    );

    const cells = screen.getAllByTestId("day-cell");
    const leadingCount = grid.filter((cell) => !cell.inMonth).length;
    const dimmedCount = cells.filter((cell) =>
      cell.className.includes("opacity-40"),
    ).length;

    expect(dimmedCount).toBe(leadingCount);
  });

  test("renders without throwing when a grid day is missing from the days map", () => {
    const grid = monthGrid("2026-06-01");

    render(
      <MonthView grid={grid} days={new Map()} toImageUrl={(path) => `asset://${path}`} />,
    );

    expect(screen.getAllByTestId("day-cell")).toHaveLength(grid.length);
  });

  test("renders a Monday-first weekday header above the grid", () => {
    const grid = monthGrid("2026-06-01");
    const days = buildDays(grid.map((cell) => cell.date));

    render(
      <MonthView grid={grid} days={days} toImageUrl={(path) => `asset://${path}`} />,
    );

    const header = screen.getByTestId("weekday-header");
    const labels = Array.from(header.children).map((el) => el.textContent);
    expect(labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});
