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

  it("handles keyboard interactions (Space)", async () => {
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

  it("handles keyboard interactions (Enter)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard("{Enter}");
    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", true);

    await user.keyboard("{Enter}");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
  });

  it("ignores other key presses", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard("a");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).not.toHaveBeenCalled();

    await user.keyboard("Tab");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("supports custom name attribute", () => {
    render(Toggle);

    const toggle = getToggle("Custom name toggle");
    expect(toggle).toHaveAttribute("name", "custom-name-toggle");
  });

  it("prevents default on space and enter keys", async () => {
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    const spaceEvent = new KeyboardEvent("keyup", { key: " " });
    const enterEvent = new KeyboardEvent("keyup", { key: "Enter" });

    const spacePreventDefault = vi.spyOn(spaceEvent, "preventDefault");
    const enterPreventDefault = vi.spyOn(enterEvent, "preventDefault");

    toggle.dispatchEvent(spaceEvent);
    toggle.dispatchEvent(enterEvent);

    expect(spacePreventDefault).toHaveBeenCalled();
    expect(enterPreventDefault).toHaveBeenCalled();
  });

  it("handles disabled state interactions", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Disabled toggle");
    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(consoleLog).not.toHaveBeenCalled();

    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("supports initial toggled state", () => {
    render(Toggle);

    const defaultToggle = getToggle("Default toggle");
    expect(defaultToggle).not.toBeChecked();

    const initialToggle = getToggle("Initial toggled state");
    expect(initialToggle).toBeChecked();
  });

  it("handles rapid clicking", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");

    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledTimes(3);
  });

  it("visually hides label when hideLabel is true", () => {
    render(Toggle);

    const label = screen.getByText("Hidden label toggle");
    expect(label).toHaveClass("bx--visually-hidden");
  });

  it("handles aria-label fallback correctly", () => {
    render(Toggle);

    // Test toggle without labelText but with aria-label.
    const toggle = getToggle("Hidden label toggle");
    expect(toggle).toHaveAccessibleName("Hidden label toggle");

    // Test toggle without labelText and without aria-label (should fallback to "Toggle").
    const defaultToggle = getToggle("Default toggle");
    expect(defaultToggle).toHaveAccessibleName("Default toggle");
  });
});
