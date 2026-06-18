import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitForm } from "./HabitForm";

describe("HabitForm", () => {
  test("rejects submission with an empty name and does not call onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        onSubmit={onSubmit}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  test("picking an image shows a preview and enables submission with name+image", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        onSubmit={onSubmit}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Drink water");
    await user.click(screen.getByRole("button", { name: /choose image/i }));

    expect(await screen.findByRole("img", { name: /preview/i })).toHaveAttribute(
      "src",
      "asset:///source/img.png",
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Drink water",
      imageSourcePath: "/source/img.png",
      skipWeekends: false,
    });
  });

  test("calls onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        onSubmit={() => {}}
        onCancel={onCancel}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  test("shows an error toast and does not submit when the image picker throws", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        onSubmit={onSubmit}
        onCancel={() => {}}
        onPickImage={async () => {
          throw new Error("copy failed");
        }}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Drink water");
    await user.click(screen.getByRole("button", { name: /choose image/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/copy failed/i);

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("prefills name and image when editing an existing habit", () => {
    render(
      <HabitForm
        initialName="Drink water"
        initialImageUrl="asset://managed/1.png"
        onSubmit={() => {}}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue("Drink water");
    expect(screen.getByRole("img", { name: /preview/i })).toHaveAttribute(
      "src",
      "asset://managed/1.png",
    );
  });

  test("does not show a delete button when creating a new habit", () => {
    render(
      <HabitForm
        onSubmit={() => {}}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  test("shows a delete button when editing and calls onDelete when clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        initialName="Drink water"
        initialImageUrl="asset://managed/1.png"
        onSubmit={() => {}}
        onCancel={() => {}}
        onDelete={onDelete}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalled();
  });

  test("D1: CREATE mode renders a skip-weekends toggle, defaulting OFF/unchecked", () => {
    render(
      <HabitForm
        onSubmit={() => {}}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    expect(screen.getByRole("switch", { name: /skip weekends/i })).not.toBeChecked();
  });

  test("D2: EDIT mode with initialSkipWeekends:true renders the toggle as ON/checked", () => {
    render(
      <HabitForm
        initialName="Gym"
        initialImageUrl="asset://managed/1.png"
        initialSkipWeekends={true}
        onSubmit={() => {}}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    expect(screen.getByRole("switch", { name: /skip weekends/i })).toBeChecked();
  });

  test("D3: toggling skip-weekends ON and submitting includes skipWeekends:true in the onSubmit payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <HabitForm
        onSubmit={onSubmit}
        onCancel={() => {}}
        onPickImage={async () => "/source/img.png"}
        toImageUrl={(p) => `asset://${p}`}
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Gym");
    await user.click(screen.getByRole("button", { name: /choose image/i }));
    await user.click(screen.getByRole("switch", { name: /skip weekends/i }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Gym",
      imageSourcePath: "/source/img.png",
      skipWeekends: true,
    });
  });
});
