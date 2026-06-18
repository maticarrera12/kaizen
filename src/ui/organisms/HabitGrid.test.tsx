import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HabitGrid } from "./HabitGrid";

const habits = [
  { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 3, completedToday: false, skipWeekends: false },
  { id: 2, name: "Read", imagePath: "/managed/2.png", currentStreak: 0, completedToday: true, skipWeekends: false },
];

describe("HabitGrid", () => {
  test("renders one card per habit", () => {
    render(
      <HabitGrid
        habits={habits}
        toImageUrl={(path) => `asset://${path}`}
        onToggle={() => {}}
        onEdit={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.getByText("Drink water")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  test("forwards onToggle with the clicked habit's id", async () => {
    const onToggle = vi.fn();
    render(
      <HabitGrid
        habits={habits}
        toImageUrl={(path) => `asset://${path}`}
        onToggle={onToggle}
        onEdit={() => {}}
        onReorder={() => {}}
      />,
    );

    screen.getByRole("button", { name: "Read" }).click();

    expect(onToggle).toHaveBeenCalledWith(2);
  });

  test("forwards onEdit with the clicked habit's id", async () => {
    const onEdit = vi.fn();
    render(
      <HabitGrid
        habits={habits}
        toImageUrl={(path) => `asset://${path}`}
        onToggle={() => {}}
        onEdit={onEdit}
        onReorder={() => {}}
      />,
    );

    screen.getByRole("button", { name: "Edit Read" }).click();

    expect(onEdit).toHaveBeenCalledWith(2);
  });
});
