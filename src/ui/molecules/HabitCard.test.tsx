import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DraggableAttributes } from "@dnd-kit/core";
import { HabitCard } from "./HabitCard";

const baseHabit = {
  id: 1,
  name: "Drink water",
  imagePath: "/managed/1.png",
  currentStreak: 3,
  completedToday: false,
  skipWeekends: false,
};

describe("HabitCard", () => {
  test("renders the habit name, image, and current streak", () => {
    render(
      <HabitCard
        habit={baseHabit}
        imageUrl="asset://managed/1.png"
        onToggle={() => {}}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByText("Drink water")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Drink water" })).toHaveAttribute(
      "src",
      "asset://managed/1.png",
    );
  });

  test("clicking the card calls onToggle with the habit id", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitCard
        habit={baseHabit}
        imageUrl="asset://managed/1.png"
        onToggle={onToggle}
        onEdit={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Drink water" }));

    expect(onToggle).toHaveBeenCalledWith(1);
  });

  test("shows a completed visual state when completedToday is true", () => {
    render(
      <HabitCard
        habit={{ ...baseHabit, completedToday: true }}
        imageUrl="asset://managed/1.png"
        onToggle={() => {}}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Drink water" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("clicking the edit control calls onEdit with the habit id without toggling", async () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitCard
        habit={baseHabit}
        imageUrl="asset://managed/1.png"
        onToggle={onToggle}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit drink water/i }));

    expect(onEdit).toHaveBeenCalledWith(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  test("renders a drag handle when dragHandleProps are provided", () => {
    render(
      <HabitCard
        habit={baseHabit}
        imageUrl="asset://managed/1.png"
        onToggle={() => {}}
        onEdit={() => {}}
        dragHandleProps={{
          attributes: {
            role: "button",
            tabIndex: 0,
            "aria-disabled": false,
            "aria-pressed": false,
            "aria-roledescription": "sortable",
            "aria-describedby": "dnd-kit-description",
          } as DraggableAttributes,
          listeners: undefined,
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /drag drink water to reorder/i }),
    ).toBeInTheDocument();
  });
});
