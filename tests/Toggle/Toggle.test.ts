import { fireEvent, render, screen } from "@testing-library/svelte";
import ToggleComponent from "carbon-components-svelte/Toggle/Toggle.svelte";
import { user } from "../utils/user";
import ToggleReadonly from "./Toggle.readonly.test.svelte";
import ToggleSlotOnly from "./Toggle.slotOnly.test.svelte";
import Toggle from "./Toggle.test.svelte";
import ToggleNullishAriaLabel from "./ToggleNullishAriaLabel.test.svelte";

describe("Toggle", () => {
  const getToggle = (label: string) =>
    screen.getByRole("switch", { name: new RegExp(label, "i") });

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

  it.each([
    ["Space", " "],
    ["Enter", "{Enter}"],
  ])("handles keyboard interactions (%s)", async (_, key) => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(Toggle, { onToggle, onChange });

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard(key);
    expect(toggle).toBeChecked();
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true);

    await user.keyboard(key);
    expect(toggle).not.toBeChecked();
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("toggles once while Enter is held down", async () => {
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard("{Enter>2/}");
    expect(toggle).toBeChecked();
  });

  it("ignores other key presses", async () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(Toggle, { onToggle, onChange });

    const toggle = getToggle("Default toggle");
    toggle.focus();

    await user.keyboard("a");
    expect(toggle).not.toBeChecked();
    expect(onToggle).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard("{Tab}");
    expect(toggle).not.toBeChecked();
    expect(onToggle).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("prevents default on enter key", async () => {
    render(Toggle);

    const toggle = getToggle("Default toggle");
    toggle.focus();

    expect(await fireEvent.keyDown(toggle, { key: "Enter" })).toBe(false);
  });

  it("handles disabled state interactions", async () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(Toggle, { onToggle, onChange });

    const toggle = getToggle("Disabled toggle");
    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(onToggle).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports initial toggled state", () => {
    render(Toggle);

    const defaultToggle = getToggle("Default toggle");
    expect(defaultToggle).not.toBeChecked();

    const initialToggle = getToggle("Initial toggled state");
    expect(initialToggle).toBeChecked();
  });

  it("handles rapid clicking", async () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(Toggle, { onToggle, onChange });

    const toggle = getToggle("Default toggle");

    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    const { container } = render(ToggleNullishAriaLabel, {
      props: { ariaLabel: "" },
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "");
    expect(container.querySelector("label[aria-label]")).toBeNull();
  });

  it("does not dispatch toggle event on mount", () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(Toggle, { onToggle, onChange });

    expect(onToggle).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(getToggle("Default toggle")).not.toBeChecked();
  });

  it("handles focus and blur events", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(Toggle, { onFocus, onBlur });

    const toggle = getToggle("Events toggle");
    toggle.focus();
    expect(toggle).toHaveFocus();
    expect(onFocus).toHaveBeenCalled();

    toggle.blur();
    expect(toggle).not.toHaveFocus();
    expect(onBlur).toHaveBeenCalled();
  });

  it("handles click events", async () => {
    const onClick = vi.fn();
    render(Toggle, { onClick });

    const toggle = getToggle("Events toggle");
    await user.click(toggle);

    expect(onClick).toHaveBeenCalled();
  });

  it("applies custom class", () => {
    render(Toggle);

    const toggle = getToggle("Custom class toggle");
    const formItem = toggle.closest(".bx--form-item");
    expect(formItem).toHaveClass("custom-class");
  });

  it("supports labelChildren, labelA and labelB slots", () => {
    render(Toggle);

    expect(screen.getByText("Label slot")).toBeInTheDocument();
    expect(screen.getByText("Off slot")).toBeInTheDocument();
    expect(screen.getByText("On slot")).toBeInTheDocument();
  });

  it("should bind ref to input element", () => {
    const { component } = render(Toggle);

    expect(component.ref).toBeInstanceOf(HTMLInputElement);
    assert(component.ref);
    expect(component.ref.type).toBe("checkbox");
  });

  describe("readonly", () => {
    it("should apply readonly class and aria-readonly", () => {
      const { container } = render(ToggleReadonly, { readonly: true });

      expect(container.querySelector(".bx--toggle--readonly")).toBeTruthy();
      const toggle = screen.getByRole("switch", { name: /Readonly toggle/i });
      expect(toggle).toHaveAttribute("aria-readonly", "true");
    });

    it("describes the field as read-only for screen readers that ignore aria-readonly", async () => {
      const { container, rerender } = render(ToggleReadonly, {
        id: "readonly-toggle",
        readonly: true,
      });

      const toggle = screen.getByRole("switch", { name: /Readonly toggle/i });
      expect(toggle).toHaveAttribute(
        "aria-describedby",
        "readonly-readonly-toggle",
      );

      const description = container.querySelector("#readonly-readonly-toggle");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");

      await rerender({ readonly: false });
      expect(toggle).not.toHaveAttribute("aria-describedby");
      expect(container.querySelector("#readonly-readonly-toggle")).toBeNull();
    });

    it("supports overriding the read-only assistive text", () => {
      const { container } = render(ToggleReadonly, {
        id: "readonly-toggle",
        readonly: true,
        readonlyText: "Custom read-only text",
      });

      expect(
        container.querySelector("#readonly-readonly-toggle"),
      ).toHaveTextContent("Custom read-only text");
    });

    it("should not toggle on click when readonly", async () => {
      const onToggle = vi.fn();
      render(ToggleReadonly, { readonly: true, onToggle });

      const toggle = screen.getByRole("switch", { name: /Readonly toggle/i });
      expect(toggle).not.toBeChecked();

      await user.click(toggle);
      expect(toggle).not.toBeChecked();
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("should not toggle on Space when readonly", async () => {
      const onToggle = vi.fn();
      render(ToggleReadonly, { readonly: true, onToggle });

      const toggle = screen.getByRole("switch", { name: /Readonly toggle/i });
      toggle.focus();

      await user.keyboard(" ");
      expect(toggle).not.toBeChecked();
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("should not toggle on Enter when readonly", async () => {
      const onToggle = vi.fn();
      render(ToggleReadonly, { readonly: true, onToggle });

      const toggle = screen.getByRole("switch", { name: /Readonly toggle/i });
      toggle.focus();

      await user.keyboard("{Enter}");
      expect(toggle).not.toBeChecked();
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  it("does not render label text span when labelText is empty and no labelChildren slot", () => {
    const { container } = render(ToggleNullishAriaLabel, {
      props: { ariaLabel: "Toggle" },
    });
    const label = container.querySelector("label.bx--toggle-input__label");
    expect(label).toBeInTheDocument();
    const directSpans = label?.querySelectorAll(":scope > span") ?? [];
    expect(directSpans).toHaveLength(1);
    expect(directSpans[0]).toHaveClass("bx--toggle__switch");
  });

  it("renders the labelChildren slot when labelText is empty", () => {
    render(ToggleSlotOnly);

    expect(screen.getByText("Slot only label")).toBeVisible();
  });

  it("falls back to the name Toggle without a label or aria-label", () => {
    render(ToggleComponent);

    expect(screen.getByRole("switch")).toHaveAccessibleName("Toggle");
  });

  it("renders no state text when labelA and labelB are empty", () => {
    const { container } = render(ToggleComponent, {
      props: { labelText: "Alerts", labelA: "", labelB: "" },
    });

    expect(container.querySelector(".bx--toggle__text--off")).toBeNull();
    expect(container.querySelector(".bx--toggle__text--on")).toBeNull();
  });

  // The contract in tests/form-field-contract covers the messages and their
  // wiring; these are the styling hooks it doesn't model.
  const formItem = () => screen.getByRole("switch").closest(".bx--form-item");

  it.each([
    [{ invalid: true }, "bx--toggle--invalid"],
    [{ warn: true }, "bx--toggle--warning"],
  ])("styles the field for %o", (props, className) => {
    render(ToggleComponent, { props: { labelText: "Alerts", ...props } });

    expect(formItem()).toHaveClass(className);
  });

  it.each([
    { invalid: true, warn: true },
    { warn: true, disabled: true },
    { warn: true, readonly: true },
  ])("drops the warning styling when %o", (props) => {
    render(ToggleComponent, { props: { labelText: "Alerts", ...props } });

    expect(formItem()).not.toHaveClass("bx--toggle--warning");
  });

  it("styles the helper text", () => {
    render(ToggleComponent, {
      props: { labelText: "Alerts", helperText: "Applies to new projects" },
    });

    expect(screen.getByText("Applies to new projects")).toHaveClass(
      "bx--form__helper-text",
    );
  });
});
