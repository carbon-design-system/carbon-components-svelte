import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToggleReadonly from "./Toggle.readonly.test.svelte";
import Toggle from "./Toggle.test.svelte";
import ToggleValidation from "./Toggle.validation.test.svelte";
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

  it("visually hides label when hideLabel is true", () => {
    render(Toggle);

    const label = screen.getByText("Hidden label toggle");
    expect(label).toHaveClass("bx--visually-hidden");
    expect(getToggle("Hidden label toggle")).toHaveAccessibleName(
      "Hidden label toggle",
    );
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

  describe("warning", () => {
    it("renders the warning message and describes the switch with it", () => {
      render(ToggleValidation, { warn: true, warnText: "Heads up" });

      const toggle = screen.getByRole("switch");
      expect(toggle.closest(".bx--form-item")).toHaveClass(
        "bx--toggle--warning",
      );
      expect(toggle).not.toHaveAttribute("aria-invalid");

      const message = screen.getByText("Heads up");
      expect(message).toHaveClass("bx--form-requirement");
      expect(toggle).toHaveAttribute("aria-describedby", message.id);
    });

    it.each([
      { disabled: true, readonly: false },
      { disabled: false, readonly: true },
    ])("suppresses the warning when %o", (state) => {
      render(ToggleValidation, { warn: true, warnText: "Heads up", ...state });

      expect(
        screen.getByRole("switch").closest(".bx--form-item"),
      ).not.toHaveClass("bx--toggle--warning");
      expect(screen.queryByText("Heads up")).not.toBeInTheDocument();
    });
  });

  describe("invalid", () => {
    it("renders the error message and marks the switch invalid", () => {
      render(ToggleValidation, {
        invalid: true,
        invalidText: "Accept the terms to continue",
      });

      const toggle = screen.getByRole("switch");
      expect(toggle.closest(".bx--form-item")).toHaveClass(
        "bx--toggle--invalid",
      );
      expect(toggle).toHaveAttribute("aria-invalid", "true");

      const message = screen.getByText("Accept the terms to continue");
      expect(message).toHaveClass("bx--form-requirement");
      expect(toggle).toHaveAttribute("aria-describedby", message.id);
    });

    it("takes precedence over a warning", () => {
      render(ToggleValidation, {
        invalid: true,
        invalidText: "Required",
        warn: true,
        warnText: "Heads up",
      });

      expect(screen.getByText("Required")).toBeInTheDocument();
      expect(screen.queryByText("Heads up")).not.toBeInTheDocument();
      expect(
        screen.getByRole("switch").closest(".bx--form-item"),
      ).not.toHaveClass("bx--toggle--warning");
    });

    it.each([
      { disabled: true, readonly: false },
      { disabled: false, readonly: true },
    ])("suppresses the invalid state when %o", (state) => {
      render(ToggleValidation, {
        invalid: true,
        invalidText: "Required",
        ...state,
      });

      expect(screen.getByRole("switch")).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByText("Required")).not.toBeInTheDocument();
    });
  });

  describe("helper text", () => {
    it("shows helper text under the switch and describes it", () => {
      render(ToggleValidation, { helperText: "Applies to new projects" });

      const helper = screen.getByText("Applies to new projects");
      expect(helper).toHaveClass("bx--form__helper-text");
      expect(screen.getByRole("switch")).toHaveAttribute(
        "aria-describedby",
        helper.id,
      );
    });

    it("gives way to a message", () => {
      render(ToggleValidation, {
        helperText: "Applies to new projects",
        warn: true,
        warnText: "Heads up",
      });

      expect(
        screen.queryByText("Applies to new projects"),
      ).not.toBeInTheDocument();
    });
  });
});
