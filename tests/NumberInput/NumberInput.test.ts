import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import {
  STEPPER_REPEAT_DELAY_MS,
  STEPPER_REPEAT_INTERVAL_MS,
} from "../../src/constants/timing.js";
import { clickToFocus } from "../utils/click-to-focus";
import { getBoundText } from "../utils/get-bound-text";
import { user } from "../utils/user";
import NumberInput from "./NumberInput.test.svelte";
import NumberInputCustom from "./NumberInputCustom.test.svelte";

describe("NumberInput", () => {
  it("should render with default props", () => {
    render(NumberInput);

    expect(screen.getByLabelText("Clusters")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("keeps the selected value through the click's mouseup in text mode", async () => {
    render(NumberInput, {
      props: { selectTextOnFocus: true, value: 4.2, allowDecimal: true },
    });

    const mouseup = await clickToFocus(screen.getByRole("textbox"));
    expect(mouseup.defaultPrevented).toBe(true);
  });

  it("should handle step value", () => {
    render(NumberInput, { props: { step: 0.1 } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute("step", "0.1");
  });

  it("should handle min and max values", () => {
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "4");
    expect(input).toHaveAttribute("max", "20");
  });

  it("should handle different sizes", () => {
    const sizes = ["xs", "sm", "xl"] as const;
    for (const size of sizes) {
      const { unmount } = render(NumberInput, {
        props: { size },
      });

      const input = screen.getByLabelText("Clusters");
      expect(input.closest(".bx--number")).toHaveClass(`bx--number--${size}`);
      unmount();
    }
  });

  it("should handle disabled state", () => {
    render(NumberInput, {
      props: { disabled: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
    expect(screen.getByText("Clusters")).toHaveClass("bx--label--disabled");
  });

  it("should handle helper text", () => {
    render(NumberInput, {
      props: { helperText: "Helper text" },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text",
    );
  });

  it("should handle invalid state", () => {
    render(NumberInput, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid input")).toBeInTheDocument();

    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("should handle warning state", () => {
    render(NumberInput, {
      props: { warn: true, warnText: "Warning message" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input.closest(".bx--number__input-wrapper")).toHaveClass(
      "bx--number__input-wrapper--warning",
    );
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  describe("fluid variant", () => {
    it.each([
      { props: {}, neutral: true },
      { props: { invalid: true, invalidText: "Invalid" }, neutral: false },
      { props: { warn: true, warnText: "Warning" }, neutral: false },
    ])(
      "sets the neutral class on .bx--number only when neither invalid nor warn is showing (%o)",
      ({ props, neutral }) => {
        render(NumberInput, { fluid: true, ...props });

        const numberEl = document.querySelector(".bx--number");
        if (neutral) {
          expect(numberEl).toHaveClass("bx--number--neutral");
        } else {
          expect(numberEl).not.toHaveClass("bx--number--neutral");
        }
      },
    );

    it("renders the fluid variant with hidden steppers", () => {
      render(NumberInput, { fluid: true, hideSteppers: true });

      const input = screen.getByLabelText("Clusters");
      expect(input.closest(".bx--number")).toHaveClass(
        "bx--number--nosteppers",
      );
      expect(input.closest(".bx--form-item")).toHaveClass(
        "bx--number-input--fluid",
      );
    });

    it("toggles the fluid focus modifier on input focus and blur", async () => {
      render(NumberInput, { fluid: true, invalid: true, invalidText: "Error" });

      const input = screen.getByLabelText("Clusters");
      const formItem = input.closest(".bx--form-item");

      expect(formItem).not.toHaveClass("bx--number-input--fluid--focus");

      await user.click(input);
      expect(formItem).toHaveClass("bx--number-input--fluid--focus");

      await user.tab();
      expect(formItem).not.toHaveClass("bx--number-input--fluid--focus");
    });
  });

  it("should handle custom id", () => {
    render(NumberInput, { props: { id: "custom-id" } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("Clusters")).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(NumberInput, { props: { name: "custom-name" } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "name",
      "custom-name",
    );
  });

  it("should handle readonly state", () => {
    render(NumberInput, { props: { readonly: true, value: 5 } });

    // NVDA announces a read-only number input as editable.
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("aria-readonly", "true");
    expect(input).toHaveValue("5");
  });

  it("keeps the same input when readonly toggles", async () => {
    const { rerender } = render(NumberInput, { props: { value: 5 } });
    const input = screen.getByRole("spinbutton");

    await rerender({ readonly: true, value: 5 });
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("5");

    await rerender({ readonly: false, value: 5 });
    expect(screen.getByRole("spinbutton")).toBe(input);
    expect(input).toHaveValue(5);
  });

  it("should not change value via arrow keys when readonly in text mode", async () => {
    render(NumberInput, {
      props: { readonly: true, allowDecimal: true, value: 50 },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("50");

    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("50");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("50");
  });

  it("should step by 10x step on PageUp and PageDown", async () => {
    render(NumberInput, { props: { value: 0, step: 1 } });

    const input = screen.getByRole("spinbutton");
    input.focus();

    await user.keyboard("{PageUp}");
    expect(getBoundText()).toBe("10");

    await user.keyboard("{PageDown}");
    expect(getBoundText()).toBe("0");
  });

  it("should step by 10x step on PageUp and PageDown in allowDecimal mode", async () => {
    render(NumberInput, { props: { allowDecimal: true, step: 0.1, value: 0 } });

    const input = screen.getByRole("textbox");
    input.focus();

    await user.keyboard("{PageUp}");
    expect(getBoundText()).toBe("1");

    await user.keyboard("{PageDown}");
    expect(getBoundText()).toBe("0");
  });

  it("should step and format the value with ArrowUp and ArrowDown in text mode", async () => {
    render(NumberInput, { props: { locale: "de-DE", value: 1000 } });

    const input = screen.getByRole("textbox");
    input.focus();

    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.001");
    expect(getBoundText()).toBe("1001");

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("999");
    expect(getBoundText()).toBe("999");
  });

  it.each([
    ["increment at max", "Increment number", 10, "10"],
    ["decrement at min", "Decrement number", 0, "0"],
  ])(
    "should keep the value when stepping with %s in text mode",
    async (_, name, value, expected) => {
      render(NumberInput, {
        props: { allowDecimal: true, min: 0, max: 10, value },
      });

      await user.click(screen.getByRole("button", { name }));

      expect(getBoundText()).toBe(expected);
      expect(screen.getByRole("textbox")).toHaveValue(expected);
    },
  );

  it("should clamp PageUp/PageDown values to min and max", async () => {
    render(NumberInput, { props: { value: 95, step: 1, min: 0, max: 100 } });

    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{PageUp}");

    expect(getBoundText()).toBe("100");
  });

  it("should not change value via PageUp/PageDown when readonly", async () => {
    render(NumberInput, { props: { readonly: true, value: 50 } });

    const input = screen.getByRole("textbox");
    input.focus();
    await user.keyboard("{PageUp}");
    expect(getBoundText()).toBe("50");

    await user.keyboard("{PageDown}");
    expect(getBoundText()).toBe("50");
  });

  it("should not change value via PageUp/PageDown when disabled", () => {
    render(NumberInput, { props: { disabled: true, value: 50 } });

    const input = screen.getByRole("spinbutton");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "PageUp", bubbles: true }),
    );
    expect(getBoundText()).toBe("50");
  });

  it("prevents PageUp/PageDown default actions (page scroll)", () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");

    for (const key of ["PageUp", "PageDown"]) {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it("should handle hidden steppers", () => {
    render(NumberInput, { props: { hideSteppers: true } });

    expect(
      screen.queryByRole("button", { name: "Increment number" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Decrement number" }),
    ).not.toBeInTheDocument();
  });

  it("should handle custom slots", () => {
    render(NumberInputCustom);

    expect(screen.getByText("Custom Label Text")).toBeInTheDocument();
  });

  it("should handle value binding", async () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");
    expect(getBoundText()).toBe("5");
  });

  it("should handle increment/decrement buttons", async () => {
    render(NumberInput);

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    await user.click(incrementButton);
    expect(getBoundText()).toBe("1");

    await user.click(decrementButton);
    expect(getBoundText()).toBe("0");
  });

  it("should show invalid state when value exceeds max via typing", async () => {
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "25");
    expect(getBoundText()).toBe("25");
    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("should handle disabled helper text", () => {
    render(NumberInput, {
      props: {
        disabled: true,
        helperText: "Helper text",
      },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("should dispatch keydown event", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { onkeydown: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "{Enter}");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch keyup event", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { onkeyup: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch focus event", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { onfocus: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.click(input);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch blur event with value", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { value: 5, onblur: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail.value).toBe(5);
    expect(mockHandler.mock.calls[0][0].detail.event).toBeInstanceOf(
      FocusEvent,
    );
  });

  it("should support custom translateWithId function", () => {
    const props = {
      translateWithId: (id: string) => {
        if (id === "increment") return "Custom Increment";
        if (id === "decrement") return "Custom Decrement";
        return id;
      },
    } satisfies ComponentProps<NumberInput>;

    render(NumberInput, { props });

    expect(
      screen.getByRole("button", { name: "Custom Increment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Custom Decrement" }),
    ).toBeInTheDocument();
  });

  it("should not describe the input with hidden helper text while invalid", () => {
    render(NumberInput, {
      props: {
        id: "test-input",
        invalid: true,
        invalidText: "",
        helperText: "Helper",
      },
    });

    expect(screen.queryByText("Helper")).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("should not set aria-describedby when no error, warn, or helperText", () => {
    render(NumberInput, {
      props: { id: "test-input" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should set aria-label when no label is provided", () => {
    render(NumberInput, {
      props: { labelText: "" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute(
      "aria-label",
      "Numeric input field with increment and decrement buttons",
    );
  });

  it("should not set aria-label when label is provided", () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-label");
  });

  it("should not set pattern attribute on type=number input (ignored per HTML spec)", () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("pattern");
  });

  it("should default inputmode to decimal on type=number input", () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it.each([false, true])(
    "renders disabled steppers instead of the readonly icon when readonly (fluid: %s)",
    (fluid) => {
      render(NumberInput, { fluid, readonly: true });

      const numberWrapper = screen
        .getByLabelText("Clusters")
        .closest(".bx--number");
      assert(numberWrapper);

      expect(
        numberWrapper.querySelector(".bx--text-input__readonly-icon"),
      ).not.toBeInTheDocument();
      const steppers = numberWrapper.querySelectorAll(
        ".bx--number__control-btn",
      );
      expect(steppers).toHaveLength(2);
      for (const button of steppers) {
        expect(button).toBeDisabled();
      }
    },
  );

  it("renders the readonly icon when readonly without steppers", () => {
    render(NumberInput, { readonly: true, hideSteppers: true });

    const numberWrapper = screen
      .getByLabelText("Clusters")
      .closest(".bx--number");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      numberWrapper?.querySelector(".bx--text-input__readonly-icon"),
    ).toBeInTheDocument();
  });

  it("should render invalid icon when invalid", () => {
    render(NumberInput, {
      props: { invalid: true, invalidText: "Invalid" },
    });

    const input = screen.getByLabelText("Clusters");
    const numberWrapper = input.closest(".bx--number");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      numberWrapper?.querySelector(".bx--number__invalid"),
    ).toBeInTheDocument();
  });

  it("should render warning icon when warn and not invalid", () => {
    render(NumberInput, {
      props: { warn: true, warnText: "Warning" },
    });

    const input = screen.getByLabelText("Clusters");
    const numberWrapper = input.closest(".bx--number");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      numberWrapper?.querySelector(".bx--number__invalid--warning"),
    ).toBeInTheDocument();
  });

  it("should not render warning icon when both invalid and warn", () => {
    render(NumberInput, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const input = screen.getByLabelText("Clusters");
    const numberWrapper = input.closest(".bx--number");
    expect(
      numberWrapper?.querySelector(".bx--number__invalid--warning"),
    ).not.toBeInTheDocument();
  });

  it("should not render icons when readonly", () => {
    render(NumberInput, {
      props: {
        readonly: true,
        invalid: true,
        invalidText: "Invalid",
      },
    });

    const input = screen.getByLabelText("Clusters");
    const numberWrapper = input.closest(".bx--number");
    expect(
      numberWrapper?.querySelector(".bx--number__invalid"),
    ).not.toBeInTheDocument();
  });

  it("should auto-invalidate when value exceeds max", () => {
    render(NumberInput, { props: { max: 10, value: 15 } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("should auto-invalidate when value is below min", () => {
    render(NumberInput, { props: { min: 5, value: 2 } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("should show invalid visual state when invalid prop is true but invalidText is empty", () => {
    const { container } = render(NumberInput, {
      props: { invalid: true, invalidText: "" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAttribute("aria-errormessage");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(
      container.querySelector(".bx--form-requirement"),
    ).not.toBeInTheDocument();
  });

  it("should preserve decimal input with trailing zeros when allowDecimal is true", async () => {
    render(NumberInput, {
      props: { allowDecimal: true, step: 0.1, value: null },
    });

    const input = screen.getByRole("textbox");
    assert(input instanceof HTMLInputElement);

    await user.type(input, "1.0");
    expect(input.value).toBe("1.0");

    await user.clear(input);
    await user.type(input, "2.00");
    expect(input.value).toBe("2.00");

    await user.clear(input);
    await user.type(input, "3.");
    expect(input.value).toBe("3.");
  });

  it("should allow deleting all characters when allowDecimal is true", async () => {
    // Regression test: when allowDecimal is true, the user should be able to
    // delete all characters from the input. A bug existed where the reactive
    // statement that syncs inputValue from value would reset the input because
    // bind:value updates inputValue before onInput updates value.
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: 1 },
    });

    const input = screen.getByRole("textbox");
    assert(input instanceof HTMLInputElement);
    expect(input.value).toBe("1");

    await user.clear(input);
    expect(input.value).toBe("");

    expect(getBoundText()).toBe("null");
  });

  it("should sync input when value prop changes programmatically in allowDecimal mode", async () => {
    // When value is changed from the parent (e.g., via bind:value), the input should update.
    // This tests the reactive statement that syncs inputValue from value.
    const { rerender } = render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: 5 },
    });

    const input = screen.getByRole("textbox");
    assert(input instanceof HTMLInputElement);
    expect(input.value).toBe("5");

    rerender({ allowDecimal: true, allowEmpty: true, value: 10 });
    await tick();
    expect(input.value).toBe("10");

    rerender({ allowDecimal: true, allowEmpty: true, value: null });
    await tick();
    expect(input.value).toBe("");

    rerender({ allowDecimal: true, allowEmpty: true, value: 2.5 });
    await tick();
    expect(input.value).toBe("2.5");
  });

  it("should use type=text with inputmode=decimal when allowDecimal is true", () => {
    render(NumberInput, { props: { allowDecimal: true } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("should handle increment/decrement with allowDecimal mode", async () => {
    render(NumberInput, { props: { allowDecimal: true, step: 0.1, value: 0 } });

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    await user.click(incrementButton);
    expect(getBoundText()).toBe("0.1");

    await user.click(decrementButton);
    expect(getBoundText()).toBe("0");
  });

  it("should set tabindex -1 on stepper buttons", () => {
    render(NumberInput);

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    expect(incrementButton).toHaveAttribute("tabindex", "-1");
    expect(decrementButton).toHaveAttribute("tabindex", "-1");
  });

  it("should set type button on stepper buttons", () => {
    render(NumberInput);

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("should disable stepper buttons when input is disabled", () => {
    render(NumberInput, { props: { disabled: true } });

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    expect(incrementButton).toBeDisabled();
    expect(decrementButton).toBeDisabled();
  });

  it("should render rule dividers between buttons", () => {
    const { container } = render(NumberInput);

    const dividers = container.querySelectorAll(".bx--number__rule-divider");
    expect(dividers).toHaveLength(2);
  });

  it("should have button titles matching labels", () => {
    render(NumberInput);

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    expect(incrementButton).toHaveAttribute("title", "Increment number");
    expect(decrementButton).toHaveAttribute("title", "Decrement number");
  });

  it("should dispatch change event on typing", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { onchange: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(5);
  });

  it("should dispatch input event on typing", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { oninput: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "7");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(7);
  });

  it("should dispatch both change and input events on stepper click", async () => {
    const changeHandler = vi.fn();
    const inputHandler = vi.fn();
    render(NumberInput, {
      props: { onchange: changeHandler, oninput: inputHandler },
    });

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });
    await user.click(incrementButton);

    expect(changeHandler).toHaveBeenCalled();
    expect(inputHandler).toHaveBeenCalled();
    expect(changeHandler.mock.calls[0][0].detail).toBe(1);
    expect(inputHandler.mock.calls[0][0].detail).toBe(1);
  });

  it("should dispatch events with null when clearing input", async () => {
    const inputHandler = vi.fn();
    render(NumberInput, {
      props: { value: 10, oninput: inputHandler },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    expect(inputHandler).toHaveBeenCalled();
    expect(inputHandler.mock.calls[0][0].detail).toBe(null);
  });

  it("should not show invalid state when value is null and allowEmpty is false without invalid prop", () => {
    // Per issue #1180, NumberInput should only show invalid state when invalid={true}
    render(NumberInput, { props: { value: null, allowEmpty: false } });

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".bx--number")).not.toHaveAttribute("data-invalid");
  });

  it.each([
    ["allowDecimal", { allowDecimal: true }, "0", "0"],
    ["locale", { locale: "de-DE", min: 1000 }, "1.000", "1000"],
  ])(
    "should show the default value when allowEmpty is false and the input is cleared in text mode (%s)",
    async (_, extra, displayed, bound) => {
      render(NumberInput, { props: { allowEmpty: false, value: 5, ...extra } });

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.tab();

      expect(input).toHaveValue(displayed);
      expect(getBoundText()).toBe(bound);
    },
  );

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should default to 0 when allowEmpty is false and input is cleared", async () => {
    render(NumberInput, { props: { allowEmpty: false, value: 5 } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    expect(getBoundText()).toBe("0");
    expect(input).toHaveValue(0);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should default to min when allowEmpty is false, min is defined, and input is cleared", async () => {
    render(NumberInput, {
      props: { allowEmpty: false, min: 4, value: 10 },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    expect(getBoundText()).toBe("4");
    expect(input).toHaveValue(4);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should use default value when allowEmpty is false and incrementing from null", async () => {
    render(NumberInput, {
      props: { allowEmpty: false, value: null, min: 5 },
    });

    const incrementButton = screen.getByRole("button", {
      name: "Increment number",
    });

    await user.click(incrementButton);

    expect(getBoundText()).toBe("6");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should use default value when allowEmpty is false and decrementing from null", async () => {
    render(NumberInput, {
      props: { allowEmpty: false, value: null },
    });

    const decrementButton = screen.getByRole("button", {
      name: "Decrement number",
    });

    await user.click(decrementButton);

    expect(getBoundText()).toBe("-1");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should preserve null value when allowEmpty is true and input is cleared", async () => {
    render(NumberInput, { props: { allowEmpty: true, value: 5 } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    // In Svelte 5, null and undefined are rendered as empty strings in the DOM (expected behavior).
    // See: https://svelte.dev/docs/svelte/v5-migration-guide
    // The actual bound value is still null, but DOM text interpolation renders it as "".
    expect(getBoundText()).toBe("null");
    expect(input).toHaveValue(null);
  });

  it("should not set error state when readonly and invalid", () => {
    render(NumberInput, {
      props: { readonly: true, invalid: true, invalidText: "Invalid" },
    });

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should parse empty string to null", async () => {
    render(NumberInput, { props: { value: 5 } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    // In Svelte 5, null and undefined are rendered as empty strings in the DOM (expected behavior).
    // See: https://svelte.dev/docs/svelte/v5-migration-guide
    // The actual bound value is still null, but DOM text interpolation renders it as "".
    expect(getBoundText()).toBe("null");
  });

  it("should support restProps passthrough", () => {
    render(NumberInput, {
      props: {
        title: "Custom title",
      },
    });

    const input = screen.getByLabelText("Clusters");
    expect(input).toHaveAttribute("title", "Custom title");
  });

  it("should apply bx--number--nolabel class when hideLabel is true", () => {
    const { container } = render(NumberInput, { props: { hideLabel: true } });

    expect(container.querySelector(".bx--number--nolabel")).toBeInTheDocument();
  });

  it("should apply bx--number--nosteppers class when hideSteppers is true", () => {
    const { container } = render(NumberInput, {
      props: { hideSteppers: true },
    });

    expect(
      container.querySelector(".bx--number--nosteppers"),
    ).toBeInTheDocument();
  });

  it("should render value as empty string when null", () => {
    render(NumberInput, { props: { value: null } });

    const input = screen.getByLabelText("Clusters");
    expect(input).toHaveValue(null);
  });

  it("should show warning requirement when warn is set", () => {
    render(NumberInput, {
      props: { warn: true, warnText: "Warning message" },
    });

    expect(screen.getByText("Warning message")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should show invalid requirement when error is true", () => {
    render(NumberInput, {
      props: { invalid: true, invalidText: "Invalid message" },
    });

    expect(screen.getByText("Invalid message")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should apply bx--number--readonly class when readonly", () => {
    const { container } = render(NumberInput, { props: { readonly: true } });

    expect(
      container.querySelector(".bx--number--readonly"),
    ).toBeInTheDocument();
  });

  it("should preserve last valid value when typing invalid input in allowDecimal mode", async () => {
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: null },
    });

    const input = screen.getByRole("textbox");
    assert(input instanceof HTMLInputElement);

    await user.type(input, "1.5");
    expect(input.value).toBe("1.5");
    expect(getBoundText()).toBe("1.5");

    await user.type(input, ".");
    expect(input.value).toBe("1.5.");

    expect(getBoundText()).toBe("1.5");
  });

  it("should set the value to null when typing a lone minus in text mode", async () => {
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: 3 },
    });

    const input = screen.getByRole("textbox");
    await user.type(input, "-", {
      initialSelectionStart: 0,
      initialSelectionEnd: 1,
    });
    expect(input).toHaveValue("-");
    expect(getBoundText()).toBe("null");

    await user.type(input, "5");
    expect(input).toHaveValue("-5");
    expect(getBoundText()).toBe("-5");
  });

  it("should normalize invalid input to last valid value on blur in allowDecimal mode", async () => {
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: null },
    });

    const input = screen.getByRole("textbox");
    assert(input instanceof HTMLInputElement);

    await user.type(input, "1.5.");
    expect(input.value).toBe("1.5.");
    expect(getBoundText()).toBe("1.5");

    await user.tab();
    expect(input.value).toBe("1.5");
    expect(getBoundText()).toBe("1.5");
  });

  describe("decimal separator normalization", () => {
    it.each([
      ["3.14", 3.14, "period (standard)"],
      ["3,14", 3.14, "comma (European)"],
      ["3\u066B14", 3.14, "Arabic decimal separator"],
      ["0,5", 0.5, "leading zero with comma"],
      ["0\u066B5", 0.5, "leading zero with Arabic separator"],
      ["12", 12, "integer (no separator)"],
      ["1,0", 1, "trailing zero with comma"],
      ["1\u066B0", 1, "trailing zero with Arabic separator"],
      ["1.000,5", 1000.5, "European thousands with comma decimal"],
      ["1,000.5", 1000.5, "English thousands with period decimal"],
      ["1.000.000,5", 1000000.5, "European millions"],
      ["1,000,000.5", 1000000.5, "English millions"],
      ["1,5", 1.5, "comma as decimal"],
      ["abc", null, "invalid input"],
    ] as const)(
      "should parse '%s' as %s (%s)",
      async (input, expectedValue, _description) => {
        render(NumberInput, {
          props: { allowDecimal: true, allowEmpty: true },
        });

        const inputEl = screen.getByRole("textbox");
        await user.clear(inputEl);
        await user.type(inputEl, input);
        await user.tab();

        expect(getBoundText()).toBe(String(expectedValue));
      },
    );

    it("should parse empty input as null after blur", async () => {
      render(NumberInput, {
        props: { allowDecimal: true, allowEmpty: true },
      });

      const inputEl = screen.getByRole("textbox");
      await user.clear(inputEl);
      await user.tab();

      expect(getBoundText()).toBe("null");
    });
  });

  describe("stepStartValue", () => {
    it("should jump to stepStartValue when decrementing from null", async () => {
      render(NumberInput, {
        props: { allowEmpty: true, value: null, stepStartValue: 10 },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });

      await user.click(decrementButton);

      expect(getBoundText()).toBe("10");
    });

    it("should jump to stepStartValue when incrementing from zero", async () => {
      render(NumberInput, {
        props: { value: 0, stepStartValue: 10 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      expect(getBoundText()).toBe("10");
    });

    it("should step normally after the first click", async () => {
      render(NumberInput, {
        props: { allowEmpty: true, value: null, stepStartValue: 10 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);
      expect(getBoundText()).toBe("10");

      await user.click(incrementButton);
      expect(getBoundText()).toBe("11");
    });

    it("should jump to stepStartValue in allowDecimal mode when stepping from null", async () => {
      render(NumberInput, {
        props: {
          allowDecimal: true,
          allowEmpty: true,
          value: null,
          stepStartValue: 5,
        },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);
      expect(getBoundText()).toBe("5");
    });

    it("should use stepStartValue over min as starting point", async () => {
      render(NumberInput, {
        props: {
          allowEmpty: true,
          value: null,
          min: 0,
          stepStartValue: 10,
        },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      expect(getBoundText()).toBe("10");
    });
  });

  describe("auto min/max validation", () => {
    it("should not auto-invalidate when value is within bounds", () => {
      render(NumberInput, { props: { min: 0, max: 100, value: 50 } });

      const input = screen.getByRole("spinbutton");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should not auto-invalidate when value equals min (boundary)", () => {
      render(NumberInput, { props: { min: 5, max: 20, value: 5 } });

      const input = screen.getByRole("spinbutton");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should not auto-invalidate when value equals max (boundary)", () => {
      render(NumberInput, { props: { min: 5, max: 20, value: 20 } });

      const input = screen.getByRole("spinbutton");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should not auto-invalidate when value is null with bounds set", () => {
      render(NumberInput, {
        props: { min: 5, max: 20, value: null, allowEmpty: true },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should show invalid icon but no error text when auto-invalid without invalidText", () => {
      render(NumberInput, { props: { max: 10, value: 15 } });

      const input = screen.getByLabelText("Clusters");
      const numberWrapper = input.closest(".bx--number");
      expect(
        numberWrapper?.querySelector(".bx--number__invalid"),
      ).toBeInTheDocument();
      expect(
        numberWrapper?.querySelector(".bx--form-requirement"),
      ).not.toBeInTheDocument();
    });

    it("should show invalid icon and error text when auto-invalid with invalidText", () => {
      render(NumberInput, {
        props: { max: 10, value: 15, invalidText: "Must be 10 or less" },
      });

      const input = screen.getByLabelText("Clusters");
      const numberWrapper = input.closest(".bx--number");
      expect(
        numberWrapper?.querySelector(".bx--number__invalid"),
      ).toBeInTheDocument();
      expect(screen.getByText("Must be 10 or less")).toBeInTheDocument();
    });

    it("should auto-invalidate in allowDecimal mode", () => {
      render(NumberInput, {
        props: { allowDecimal: true, min: 0, max: 10, value: 15 },
      });

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not auto-invalidate when readonly", () => {
      render(NumberInput, {
        props: { readonly: true, min: 5, max: 20, value: 25 },
      });

      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should keep invalid state when explicit invalid=true and value is within bounds", () => {
      render(NumberInput, {
        props: { invalid: true, min: 0, max: 100, value: 50 },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should hide helper text when auto-invalid", () => {
      render(NumberInput, {
        props: { max: 10, value: 15, helperText: "Helper text" },
      });

      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    });

    it("should suppress warn state when auto-invalid", () => {
      render(NumberInput, {
        props: { max: 10, value: 15, warn: true, warnText: "Warning" },
      });

      const input = screen.getByLabelText("Clusters");
      const numberWrapper = input.closest(".bx--number");
      expect(
        numberWrapper?.querySelector(".bx--number__invalid--warning"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Warning")).not.toBeInTheDocument();
    });
  });

  describe("validate", () => {
    it("should show invalid when validate returns false", () => {
      render(NumberInput, {
        props: { value: 5, validate: () => false },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should show valid when validate returns true even with autoInvalid", () => {
      render(NumberInput, {
        props: { value: 15, max: 10, validate: () => true },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should defer to autoInvalid when validate returns undefined", () => {
      render(NumberInput, {
        props: { value: 15, max: 10, validate: () => undefined },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not override explicit invalid=true when validate returns true", () => {
      render(NumberInput, {
        props: { value: 5, invalid: true, validate: () => true },
      });

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should receive raw input string and locale as arguments", () => {
      const validateFn = vi.fn(() => undefined);
      render(NumberInput, {
        props: { value: 5, locale: "de-DE", validate: validateFn },
      });

      expect(validateFn).toHaveBeenCalled();
      // In text mode with locale, receives the formatted inputValue
      expect(validateFn).toHaveBeenCalledWith(expect.any(String), "de-DE");
    });

    it("should receive undefined as locale when no locale prop", () => {
      const validateFn = vi.fn(() => undefined);
      render(NumberInput, {
        props: { value: 5, validate: validateFn },
      });

      expect(validateFn).toHaveBeenCalled();
      expect(validateFn).toHaveBeenCalledWith(expect.any(String), undefined);
    });

    it("should show invalid icon and error text when validate returns false with invalidText", () => {
      render(NumberInput, {
        props: {
          value: 5,
          validate: () => false,
          invalidText: "Custom error",
        },
      });

      const input = screen.getByLabelText("Clusters");
      const numberWrapper = input.closest(".bx--number");
      expect(
        numberWrapper?.querySelector(".bx--number__invalid"),
      ).toBeInTheDocument();
      expect(screen.getByText("Custom error")).toBeInTheDocument();
    });

    it("should show icon but no error text when validate returns false without invalidText", () => {
      const { container } = render(NumberInput, {
        props: { value: 5, validate: () => false },
      });

      const input = screen.getByLabelText("Clusters");
      const numberWrapper = input.closest(".bx--number");
      expect(
        numberWrapper?.querySelector(".bx--number__invalid"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".bx--form-requirement"),
      ).not.toBeInTheDocument();
    });

    it("should not show invalid when readonly even if validate returns false", () => {
      render(NumberInput, {
        props: { value: 5, readonly: true, validate: () => false },
      });

      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("locale", () => {
    it("should force text mode when locale is set", () => {
      render(NumberInput, { props: { locale: "de-DE", value: 5 } });

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("inputmode", "decimal");
    });

    it("should format initial value with locale", () => {
      render(NumberInput, { props: { locale: "de-DE", value: 1234.5 } });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      // German locale uses period for thousands and comma for decimal
      expect(input.value).toBe("1.234,5");
    });

    it("should format value on blur", async () => {
      render(NumberInput, {
        props: { locale: "en-US", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "1234.5");
      await user.tab();

      expect(getBoundText()).toBe("1234.5");
      expect(input.value).toBe("1,234.5");
    });

    it("should parse German decimal (comma) correctly on blur", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "3,14");
      await user.tab();

      expect(getBoundText()).toBe("3.14");
    });

    it("should handle null value with locale", () => {
      render(NumberInput, {
        props: { locale: "en-US", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("");
    });

    it("should handle stepper increment with locale formatting", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: 1000, step: 1 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("1.001");
      expect(getBoundText()).toBe("1001");
    });

    it("should handle stepper decrement with locale formatting", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: 1000, step: 1 },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });

      await user.click(decrementButton);

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("999");
      expect(getBoundText()).toBe("999");
    });

    it("should auto-invalidate with locale when value exceeds max", () => {
      render(NumberInput, {
        props: { locale: "en-US", value: 15, max: 10 },
      });

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should handle formatOptions for decimal precision", () => {
      render(NumberInput, {
        props: {
          locale: "en-US",
          formatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          value: 1234.5,
        },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("1,234.50");
    });

    it("reformats the value when formatOptions change", async () => {
      const { rerender } = render(NumberInput, {
        props: { locale: "en-US", value: 1000 },
      });

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("1,000");

      await rerender({ formatOptions: { minimumFractionDigits: 2 } });
      expect(input).toHaveValue("1,000.00");
    });

    it("should update formatting when value changes programmatically", async () => {
      const { rerender } = render(NumberInput, {
        props: { locale: "de-DE", value: 100, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("100");

      rerender({ locale: "de-DE", value: 1234.5, allowEmpty: true });
      await tick();
      expect(input.value).toBe("1.234,5");

      rerender({ locale: "de-DE", value: null, allowEmpty: true });
      await tick();
      expect(input.value).toBe("");
    });

    it("should parse locale input with group separators", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "1.234,56");
      await user.tab();

      expect(getBoundText()).toBe("1234.56");
    });

    it("should parse locale input without group separators", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "1234,5");
      await user.tab();

      expect(getBoundText()).toBe("1234.5");
    });

    it("should update separator cache when locale changes", async () => {
      const { rerender } = render(NumberInput, {
        props: { locale: "en-US", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);

      await user.type(input, "1,234.5");
      await user.tab();
      expect(getBoundText()).toBe("1234.5");

      rerender({ locale: "de-DE", value: null, allowEmpty: true });
      await tick();

      await user.clear(input);
      await user.type(input, "1.234,5");
      await user.tab();
      expect(getBoundText()).toBe("1234.5");
    });

    it("should parse Arabic-Indic digits typed with an Arabic locale", async () => {
      // Regression test: locales like "ar-EG" render/expect Arabic-Indic digit
      // glyphs (١٢٣٤٥ etc), which JS's `Number()` can't parse directly.
      render(NumberInput, {
        props: { locale: "ar-EG", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "١٢٣٤٫٥");
      await user.tab();

      expect(getBoundText()).toBe("1234.5");
    });

    it("should fall back to standard parsing when locale is removed", async () => {
      const { rerender } = render(NumberInput, {
        props: { locale: "de-DE", value: 1234.5, allowEmpty: true },
      });

      const input = screen.getByRole("textbox");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe("1.234,5");

      rerender({ locale: undefined, value: 1234.5, allowEmpty: true });
      await tick();

      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton).toHaveAttribute("type", "number");
      expect(spinbutton).toHaveValue(1234.5);
    });

    it("reuses a single Intl.NumberFormat instance across instances with the same locale", () => {
      const OriginalNumberFormat = Intl.NumberFormat;
      class MockNumberFormat extends OriginalNumberFormat {}
      const spy = vi
        .spyOn(Intl, "NumberFormat")
        .mockImplementation(MockNumberFormat);

      render(NumberInput, { props: { locale: "fr-FR", value: 1 } });
      render(NumberInput, { props: { locale: "fr-FR", value: 2 } });
      render(NumberInput, { props: { locale: "fr-FR", value: 3 } });

      const calls = spy.mock.calls.filter(([loc]) => loc === "fr-FR");
      expect(calls).toHaveLength(1);

      spy.mockRestore();
    });
  });

  describe("click:stepper event", () => {
    it("should dispatch click:stepper with direction 'up' on increment click", async () => {
      const mockHandler = vi.fn();
      render(NumberInput, {
        props: { value: 0, onclickstepper: mockHandler },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });
      await user.click(incrementButton);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler.mock.calls[0][0].detail).toEqual({
        value: 1,
        direction: "up",
      });
    });

    it("should dispatch click:stepper with direction 'down' on decrement click", async () => {
      const mockHandler = vi.fn();
      render(NumberInput, {
        props: { value: 5, onclickstepper: mockHandler },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });
      await user.click(decrementButton);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler.mock.calls[0][0].detail).toEqual({
        value: 4,
        direction: "down",
      });
    });

    it("should not dispatch click:stepper on arrow key press", async () => {
      const mockHandler = vi.fn();
      render(NumberInput, {
        props: { allowDecimal: true, value: 5, onclickstepper: mockHandler },
      });

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("{ArrowUp}");

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("held stepper", () => {
    const press = { button: 0, buttons: 1, isPrimary: true, pointerId: 1 };
    const release = { button: 0, buttons: 0, isPrimary: true, pointerId: 1 };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("repeats after the delay, then steps once per interval", async () => {
      const onclickstepper = vi.fn();
      render(NumberInput, { props: { value: 0, onclickstepper } });
      const input = screen.getByRole("spinbutton");
      const button = screen.getByRole("button", { name: "Increment number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_DELAY_MS - 1);
      expect(input).toHaveValue(0);

      await vi.advanceTimersByTimeAsync(1);
      expect(input).toHaveValue(1);

      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_INTERVAL_MS * 3);
      expect(input).toHaveValue(4);

      // The click that ends a held press does not step again.
      await fireEvent.pointerUp(button, release);
      await fireEvent.click(button, { detail: 1 });
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_INTERVAL_MS * 3);
      expect(input).toHaveValue(4);
      expect(onclickstepper).toHaveBeenCalledTimes(1);
      expect(onclickstepper.mock.calls[0][0].detail).toEqual({
        value: 4,
        direction: "up",
      });
    });

    it("steps once for a press shorter than the delay", async () => {
      render(NumberInput, { props: { value: 5 } });
      const input = screen.getByRole("spinbutton");
      const button = screen.getByRole("button", { name: "Decrement number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_DELAY_MS / 2);
      await fireEvent.pointerUp(button, release);
      await fireEvent.click(button, { detail: 1 });
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_DELAY_MS * 2);

      expect(input).toHaveValue(4);
    });

    it("stops at max", async () => {
      render(NumberInput, { props: { value: 8, max: 10 } });
      const button = screen.getByRole("button", { name: "Increment number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(
        STEPPER_REPEAT_DELAY_MS + STEPPER_REPEAT_INTERVAL_MS * 5,
      );

      expect(screen.getByRole("spinbutton")).toHaveValue(10);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("stops at min in text mode", async () => {
      render(NumberInput, {
        props: { value: 1.5, min: 0, step: 0.5, allowDecimal: true },
      });
      const button = screen.getByRole("button", { name: "Decrement number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(
        STEPPER_REPEAT_DELAY_MS + STEPPER_REPEAT_INTERVAL_MS * 5,
      );

      expect(screen.getByRole("textbox")).toHaveValue("0");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("stops when the pointer leaves, and a later click steps once", async () => {
      render(NumberInput, { props: { value: 0 } });
      const input = screen.getByRole("spinbutton");
      const button = screen.getByRole("button", { name: "Increment number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_DELAY_MS);
      await fireEvent.pointerLeave(button, press);
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_INTERVAL_MS * 3);
      expect(input).toHaveValue(1);

      await fireEvent.click(button);
      expect(input).toHaveValue(2);
    });

    it("does not repeat when read-only", async () => {
      render(NumberInput, { props: { value: 0, readonly: true } });
      const button = screen.getByRole("button", { name: "Increment number" });

      await fireEvent.pointerDown(button, press);
      await vi.advanceTimersByTimeAsync(STEPPER_REPEAT_DELAY_MS * 2);

      expect(screen.getByRole("textbox")).toHaveValue("0");
    });
  });

  describe("blur:stepper event", () => {
    it("should dispatch blur:stepper with direction 'down' on decrement button blur", () => {
      const mockHandler = vi.fn();
      render(NumberInput, {
        props: { value: 5, onblurstepper: mockHandler },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });
      decrementButton.focus();
      decrementButton.blur();

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler.mock.calls[0][0].detail.value).toBe(5);
      expect(mockHandler.mock.calls[0][0].detail.direction).toBe("down");
      expect(mockHandler.mock.calls[0][0].detail.event).toBeInstanceOf(
        FocusEvent,
      );
    });

    it("should dispatch blur:stepper with direction 'up' on increment button blur", () => {
      const mockHandler = vi.fn();
      render(NumberInput, {
        props: { value: 5, onblurstepper: mockHandler },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });
      incrementButton.focus();
      incrementButton.blur();

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler.mock.calls[0][0].detail.value).toBe(5);
      expect(mockHandler.mock.calls[0][0].detail.direction).toBe("up");
      expect(mockHandler.mock.calls[0][0].detail.event).toBeInstanceOf(
        FocusEvent,
      );
    });
  });

  describe("disableWheel", () => {
    it("should prevent wheel events from changing value when disableWheel is true", async () => {
      render(NumberInput, {
        props: { disableWheel: true, value: 5 },
      });

      const input = screen.getByRole("spinbutton");
      await user.click(input);

      const wheelEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      });

      const prevented = !input.dispatchEvent(wheelEvent);
      expect(prevented).toBe(true);
    });

    it("should allow wheel events when disableWheel is false (default)", async () => {
      render(NumberInput, {
        props: { value: 5 },
      });

      const input = screen.getByRole("spinbutton");
      await user.click(input);

      const wheelEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      });

      const prevented = !input.dispatchEvent(wheelEvent);
      expect(prevented).toBe(false);
    });

    it("should prevent wheel events in allowDecimal mode when disableWheel is true", async () => {
      render(NumberInput, {
        props: { disableWheel: true, allowDecimal: true, value: 5 },
      });

      const input = screen.getByRole("textbox");
      await user.click(input);

      const wheelEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      });

      const prevented = !input.dispatchEvent(wheelEvent);
      expect(prevented).toBe(true);
    });
  });

  describe("text mode parity with type=number attributes", () => {
    it("should have min, max, and step attributes when allowDecimal is true", () => {
      render(NumberInput, {
        props: { allowDecimal: true, min: 0, max: 100, step: 0.5, value: 50 },
      });

      const input = screen.getByLabelText("Clusters");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
      expect(input).toHaveAttribute("step", "0.5");
    });

    it("should have min, max, and step attributes when locale is set", () => {
      render(NumberInput, {
        props: { locale: "en-US", min: -10, max: 10, step: 1, value: 5 },
      });

      const input = screen.getByLabelText("Clusters");
      expect(input).toHaveAttribute("min", "-10");
      expect(input).toHaveAttribute("max", "10");
      expect(input).toHaveAttribute("step", "1");
    });

    it("should not have min/max attributes when not provided", () => {
      render(NumberInput, {
        props: { allowDecimal: true, value: 5 },
      });

      const input = screen.getByLabelText("Clusters");
      expect(input).not.toHaveAttribute("min");
      expect(input).not.toHaveAttribute("max");
    });

    it("should not set a pattern in text mode", () => {
      render(NumberInput, {
        props: { allowDecimal: true, value: 5 },
      });

      // A digits-only pattern would make decimal and formatted values
      // invalid and block form submission; inputmode already picks the
      // numeric keypad.
      const input = screen.getByLabelText("Clusters");
      expect(input).not.toHaveAttribute("pattern");
    });
  });

  describe("scrubbable", () => {
    const scrub = async (label: HTMLElement, moves: PointerEventInit[]) => {
      await fireEvent.pointerDown(label, { clientX: 100, pointerId: 1 });
      for (const move of moves) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential drag steps
        await fireEvent.pointerMove(label, { pointerId: 1, ...move });
      }
      await fireEvent.pointerUp(label, { pointerId: 1 });
    };

    it("steps the value by dragging the label and commits once", async () => {
      const onchange = vi.fn();
      const oninput = vi.fn();
      render(NumberInput, {
        props: { value: 10, scrubbable: true, onchange, oninput },
      });
      const label = screen.getByText("Clusters");
      expect(label).toHaveClass("bx--label--scrubbable");

      // 2px is no step yet; at 9px, 2 steps with 1px carried; 4px more is
      // the third.
      await scrub(label, [
        { clientX: 102 },
        { clientX: 109 },
        { clientX: 113 },
      ]);

      expect(screen.getByRole("spinbutton")).toHaveValue(13);
      expect(oninput.mock.calls.map(([e]) => e.detail)).toEqual([12, 13]);
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange.mock.calls[0][0].detail).toBe(13);
    });

    it("moves 10 steps per 4px with Shift and clamps to min and max", async () => {
      render(NumberInput, {
        props: { value: 10, min: 0, max: 30, scrubbable: true },
      });
      const label = screen.getByText("Clusters");

      await scrub(label, [{ clientX: 104, shiftKey: true }]);
      expect(screen.getByRole("spinbutton")).toHaveValue(20);

      await scrub(label, [{ clientX: 112, shiftKey: true }]);
      expect(screen.getByRole("spinbutton")).toHaveValue(30);

      await scrub(label, [{ clientX: 0 }]);
      expect(screen.getByRole("spinbutton")).toHaveValue(5);
    });

    it("rounds decimal steps in text mode", async () => {
      render(NumberInput, {
        props: { value: 0.2, step: 0.1, allowDecimal: true, scrubbable: true },
      });
      const label = screen.getByText("Clusters");

      await scrub(label, [{ clientX: 104 }]);

      expect(screen.getByRole("textbox")).toHaveValue("0.3");
    });

    it('raises the value dragging left under dir="rtl"', async () => {
      document.documentElement.setAttribute("dir", "rtl");
      onTestFinished(() => document.documentElement.removeAttribute("dir"));
      render(NumberInput, { props: { value: 10, scrubbable: true } });
      const label = screen.getByText("Clusters");

      await scrub(label, [{ clientX: 92 }]);
      expect(screen.getByRole("spinbutton")).toHaveValue(12);

      await scrub(label, [{ clientX: 104 }]);
      expect(screen.getByRole("spinbutton")).toHaveValue(11);
    });

    it("does not dispatch change for a press without enough travel", async () => {
      const onchange = vi.fn();
      render(NumberInput, { props: { value: 10, scrubbable: true, onchange } });

      await scrub(screen.getByText("Clusters"), [{ clientX: 103 }]);

      expect(onchange).not.toHaveBeenCalled();
      expect(screen.getByRole("spinbutton")).toHaveValue(10);
    });

    it.each([
      { name: "off by default", props: {} },
      { name: "disabled", props: { scrubbable: true, disabled: true } },
      { name: "read-only", props: { scrubbable: true, readonly: true } },
    ])("does not scrub when $name", async ({ props }) => {
      render(NumberInput, { props: { value: 10, ...props } });
      const label = screen.getByText("Clusters");

      await scrub(label, [{ clientX: 140 }]);

      expect(label).not.toHaveClass("bx--label--scrubbable");
      // Read-only renders as a text input, so look it up by its label.
      expect(screen.getByLabelText("Clusters")).toHaveValue(
        "readonly" in props ? "10" : 10,
      );
    });
  });
});
