import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Toggle from "./Toggle.test.svelte";

describe("Toggle", () => {
  const getToggle = (label: string) =>
    screen.getByRole("switch", { name: new RegExp(label, "i") });

  it("renders and functions correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", true);

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
  });

  it("supports custom labels", () => {
    render(Toggle);

    const toggle = getToggle("Custom labels");
    const label = toggle.closest(".bx--form-item");
    expect(label).not.toBeNull();

    if (label) {
      expect(label).toContainElement(screen.getByText("Inactive"));
      expect(label).toContainElement(screen.getByText("Active"));
    }
  });

  it("supports small size variant", () => {
    render(Toggle);

    const toggle = getToggle("Small toggle");
    expect(toggle).toHaveClass("bx--toggle-input--small");
  });

  it("supports disabled state", () => {
    render(Toggle);

    const toggle = getToggle("Disabled toggle");
    expect(toggle).toBeDisabled();
  });

  it("supports hidden label", () => {
    render(Toggle);

    const toggle = getToggle("Hidden label toggle");
    const label = toggle.closest(".bx--form-item");
    expect(label).not.toBeNull();

    if (label) {
      const hiddenText = label.querySelector(".bx--visually-hidden");
      expect(hiddenText).toHaveClass("bx--visually-hidden");
      expect(toggle).toHaveAccessibleName("Hidden label toggle");
    }
  });

  it("handles keyboard interactions", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard(" ");
    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", true);

    await user.keyboard(" ");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
  });
});
