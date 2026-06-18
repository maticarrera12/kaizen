import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewSwitcher } from "./ViewSwitcher";

describe("ViewSwitcher", () => {
  test("renders Today, Week, and Month options", () => {
    render(<ViewSwitcher active="today" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Month" })).toBeInTheDocument();
  });

  test("marks the active option with aria-pressed=true and others false", () => {
    render(<ViewSwitcher active="week" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("clicking an option calls onChange with that option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ViewSwitcher active="today" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Month" }));

    expect(onChange).toHaveBeenCalledWith("month");
  });
});
