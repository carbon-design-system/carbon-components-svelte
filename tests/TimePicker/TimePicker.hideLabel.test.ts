import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import TimePickerHideLabel from "./TimePicker.hideLabel.test.svelte";

const LABELS = ["Starts at", "AM or PM", "Time zone"];

describe("TimePicker hideLabel", () => {
  // Fluid selects show their own labels inside the field, so hiding only
  // the picker's left two of three labels on screen.
  it("hides the selects' labels with the picker's when fluid", () => {
    render(TimePickerHideLabel, { fluid: true, hideLabel: true });

    for (const text of LABELS)
      expect(screen.getByText(text).closest("label")).toHaveClass(
        "bx--visually-hidden",
      );
    // Still named for assistive technology.
    expect(
      screen.getByRole("combobox", { name: "Time zone" }),
    ).toBeInTheDocument();
  });

  it("shows all three labels when fluid without hideLabel", () => {
    render(TimePickerHideLabel, { fluid: true });

    for (const text of LABELS)
      expect(screen.getByText(text).closest("label")).not.toHaveClass(
        "bx--visually-hidden",
      );
  });

  it("follows hideLabel as it changes", async () => {
    const { rerender } = render(TimePickerHideLabel, { fluid: true });
    await rerender({ fluid: true, hideLabel: true });
    await tick();

    expect(screen.getByText("AM or PM").closest("label")).toHaveClass(
      "bx--visually-hidden",
    );
  });
});
