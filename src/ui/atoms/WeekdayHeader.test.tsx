import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeekdayHeader } from "./WeekdayHeader";

describe("WeekdayHeader", () => {
  test("renders exactly 7 weekday labels", () => {
    render(<WeekdayHeader />);
    const header = screen.getByTestId("weekday-header");
    expect(header.children).toHaveLength(7);
  });

  test("renders labels in Monday-first order", () => {
    render(<WeekdayHeader />);
    const header = screen.getByTestId("weekday-header");
    const labels = Array.from(header.children).map((el) => el.textContent);
    expect(labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});
