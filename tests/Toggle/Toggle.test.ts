import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Toggle from "./Toggle.test.svelte";
import ToggleNullishAriaLabel from "./ToggleNullishAriaLabel.test.svelte";
import ToggleSkeletonSlot from "./ToggleSkeleton.slot.test.svelte";
import ToggleSkeletonNullishAriaLabel from "./ToggleSkeletonNullishAriaLabel.test.svelte";

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
    expect(consoleLog).toHaveBeenCalledWith("change:", true);

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
    expect(consoleLog).toHaveBeenCalledWith("change:", false);
  });

  it("supports custom labels", () => {
    render(Toggle);

    const toggle = getToggle("Custom labels");
    const label = toggle.closest(".bx--form-item");
    expect(label).toContainElement(screen.getByText("Inactive"));
    expect(label).toContainElement(screen.getByText("Active"));
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
    assert(label);

    const hiddenText = label.querySelector(".bx--visually-hidden");
    expect(hiddenText).toHaveClass("bx--visually-hidden");
    expect(toggle).toHaveAccessibleName("Hidden label toggle");
  });

  it("handles keyboard interactions (Space)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard(" ");
    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", true);
    expect(consoleLog).toHaveBeenCalledWith("change:", true);

    await user.keyboard(" ");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
    expect(consoleLog).toHaveBeenCalledWith("change:", false);
  });

  it("handles keyboard interactions (Enter)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard("{Enter}");
    expect(toggle).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", true);
    expect(consoleLog).toHaveBeenCalledWith("change:", true);

    await user.keyboard("{Enter}");
    expect(toggle).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("toggled:", false);
    expect(consoleLog).toHaveBeenCalledWith("change:", false);
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

  it("prevents default on enter key", () => {
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });

    const enterPreventDefault = vi.spyOn(enterEvent, "preventDefault");

    toggle.dispatchEvent(enterEvent);

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
    expect(consoleLog).toHaveBeenCalledTimes(6); // 3 toggle events + 3 change events
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

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    const { container } = render(ToggleNullishAriaLabel, {
      props: { ariaLabel: "" },
    });
    const label = container.querySelector("label[aria-label]");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("aria-label", "");
  });

  it("does not dispatch toggle event on mount", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getToggle("Default toggle")).not.toBeChecked();
  });

  it("does not dispatch toggle event on mount for initial toggled state", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getToggle("Initial toggled state")).toBeChecked();
  });

  it("supports custom id", () => {
    render(Toggle);

    const toggle = getToggle("Custom id toggle");
    expect(toggle).toHaveAttribute("id", "custom-id");
  });

  it("handles focus and blur events", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Events toggle");
    toggle.focus();
    expect(toggle).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("focus");

    toggle.blur();
    expect(toggle).not.toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("blur");
  });

  it("handles click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Toggle);

    const toggle = getToggle("Events toggle");
    await user.click(toggle);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("applies custom class", () => {
    render(Toggle);

    const toggle = getToggle("Custom class toggle");
    const formItem = toggle.closest(".bx--form-item");
    expect(formItem).toHaveClass("custom-class");
  });

  it("supports label text slot", () => {
    render(Toggle);

    expect(screen.getByText("Label slot")).toBeInTheDocument();
  });

  it("supports labelA slot", () => {
    render(Toggle);

    expect(screen.getByText("Off slot")).toBeInTheDocument();
  });

  it("supports labelB slot", () => {
    render(Toggle);

    expect(screen.getByText("On slot")).toBeInTheDocument();
  });

  it("should bind ref to input element", () => {
    const { component } = render(Toggle);

    expect(component.ref).toBeInstanceOf(HTMLInputElement);
    assert(component.ref);
    expect(component.ref.type).toBe("checkbox");
  });

  it("supports custom label slot for ToggleSkeleton", () => {
    render(ToggleSkeletonSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("ToggleSkeleton uses empty aria-label when passed (nullish coalescing)", () => {
    render(ToggleSkeletonNullishAriaLabel, { props: { ariaLabel: "" } });
    const label = document.querySelector("label[aria-label]");
    expect(label).toHaveAttribute("aria-label", "");
  });
});
