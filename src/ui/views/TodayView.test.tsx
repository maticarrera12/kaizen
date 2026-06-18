import { describe, expect, test, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FakeHabitTrackerApp } from "../../../tests/fakes/FakeHabitTrackerApp";
import { createHabitStore } from "../../state/habitStore";
import { TodayView } from "./TodayView";

describe("TodayView", () => {
  let app: FakeHabitTrackerApp;
  let useHabitStore: ReturnType<typeof createHabitStore>;

  beforeEach(() => {
    app = new FakeHabitTrackerApp();
    useHabitStore = createHabitStore(app);
  });

  test("shows an empty state when there are no habits", async () => {
    render(<TodayView useHabitStore={useHabitStore} app={app} />);

    await waitFor(() => expect(app.loadTodayCalls).toBe(1));

    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });

  test("renders habit cards once loaded", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 3, completedToday: false, skipWeekends: false },
    ];

    render(<TodayView useHabitStore={useHabitStore} app={app} />);

    expect(await screen.findByText("Drink water")).toBeInTheDocument();
  });

  test("opening the add-habit form and submitting creates a habit", async () => {
    const user = userEvent.setup();
    render(<TodayView useHabitStore={useHabitStore} app={app} />);
    await waitFor(() => expect(app.loadTodayCalls).toBe(1));

    await user.click(screen.getByRole("button", { name: /add habit/i }));
    await user.type(screen.getByLabelText(/name/i), "Read");
    await user.click(screen.getByRole("button", { name: /choose image/i }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Read")).toBeInTheDocument();
  });

  test("clicking a habit card toggles it", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 3, completedToday: false, skipWeekends: false },
    ];
    const user = userEvent.setup();
    render(<TodayView useHabitStore={useHabitStore} app={app} />);
    await screen.findByText("Drink water");

    await user.click(screen.getByRole("button", { name: "Drink water" }));

    expect(app.toggleCalls).toEqual([1]);
  });

  test("clicking edit opens a prefilled form and saving calls editHabit", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 3, completedToday: false, skipWeekends: false },
    ];
    const user = userEvent.setup();
    render(<TodayView useHabitStore={useHabitStore} app={app} />);
    await screen.findByText("Drink water");

    await user.click(screen.getByRole("button", { name: "Edit Drink water" }));
    expect(screen.getByLabelText(/name/i)).toHaveValue("Drink water");

    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), "Drink more water");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(app.editCalls).toEqual([
      {
        habitId: 1,
        patch: {
          name: "Drink more water",
          imageSourcePath: undefined,
          skipWeekends: false,
        },
      },
    ]);
  });

  test("clicking delete inside the edit form deletes the habit", async () => {
    app.habits = [
      { id: 1, name: "Drink water", imagePath: "/managed/1.png", currentStreak: 3, completedToday: false, skipWeekends: false },
    ];
    const user = userEvent.setup();
    render(<TodayView useHabitStore={useHabitStore} app={app} />);
    await screen.findByText("Drink water");

    await user.click(screen.getByRole("button", { name: "Edit Drink water" }));
    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(app.deleteCalls).toEqual([1]);
  });
});
