import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CalendarMascot } from "../../application/use-cases/loadCalendar";
import { DayCell } from "./DayCell";

function mascot(id: number): CalendarMascot {
  return { id, name: `Habit ${id}`, imagePath: `/managed/${id}.png` };
}

describe("DayCell", () => {
  test("renders the day number and no mascots when empty", () => {
    render(
      <DayCell
        date="2026-06-17"
        dayNumber={17}
        inMonth={true}
        mascots={[]}
        overflowCount={0}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("renders exactly 4 MascotPostIt elements and no overflow indicator for 4 completions", () => {
    render(
      <DayCell
        date="2026-06-17"
        dayNumber={17}
        inMonth={true}
        mascots={[mascot(1), mascot(2), mascot(3), mascot(4)]}
        overflowCount={0}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  test("renders up to 6 MascotPostIt elements plus a +k overflow badge", () => {
    render(
      <DayCell
        date="2026-06-17"
        dayNumber={17}
        inMonth={true}
        mascots={[
          mascot(1),
          mascot(2),
          mascot(3),
          mascot(4),
          mascot(5),
          mascot(6),
        ]}
        overflowCount={3}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(6);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  test("dims the cell when inMonth is false", () => {
    render(
      <DayCell
        date="2026-05-31"
        dayNumber={31}
        inMonth={false}
        mascots={[]}
        overflowCount={0}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.getByTestId("day-cell")).toHaveClass("opacity-40");
  });

  test("renders no edit/toggle controls (read-only)", () => {
    render(
      <DayCell
        date="2026-06-17"
        dayNumber={17}
        inMonth={true}
        mascots={[mascot(1)]}
        overflowCount={0}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("the mascot scatter area is positioned relatively with a stable non-zero min-height so cell-relative percentages resolve correctly", () => {
    render(
      <DayCell
        date="2026-06-17"
        dayNumber={17}
        inMonth={true}
        mascots={[mascot(1)]}
        overflowCount={0}
        toImageUrl={(path) => `asset://${path}`}
      />,
    );

    const scatterArea = screen.getByTestId("mascot-scatter-area");
    expect(scatterArea).toHaveClass("relative");
    expect(scatterArea.className).toMatch(/min-h-/);
  });
});
