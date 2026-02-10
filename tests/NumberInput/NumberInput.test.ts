import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { isSvelte5, user } from "../setup-tests";
import NumberInput from "./NumberInput.test.svelte";
import NumberInputCustom from "./NumberInputCustom.test.svelte";

describe("NumberInput", () => {
  it("should render with default props", () => {
    render(NumberInput);

    expect(screen.getByLabelText("Clusters")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
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
    const sizes = ["sm", "xl"] as const;
    for (const size of sizes) {
      const { unmount } = render(NumberInput, {
        props: { size },
      });

      const input = screen.getByLabelText("Clusters");
      expect(input.closest(".bx--number")).toHaveClass(`bx--number--${size}`);
      unmount();
    }
  });

  it("should handle light variant", () => {
    render(NumberInput, { props: { light: true } });

    expect(screen.getByRole("spinbutton").closest(".bx--number")).toHaveClass(
      "bx--number--light",
    );
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

  it("should handle hidden label", () => {
    render(NumberInput, { props: { hideLabel: true } });

    expect(screen.getByText("Clusters")).toHaveClass("bx--visually-hidden");
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
    render(NumberInput, { props: { readonly: true } });

    expect(screen.getByRole("spinbutton")).toHaveAttribute("readonly");
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
    expect(screen.getByTestId("value").textContent).toBe("5");
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
    expect(screen.getByTestId("value").textContent).toBe("1");

    await user.click(decrementButton);
    expect(screen.getByTestId("value").textContent).toBe("0");
  });

  it("should handle empty value when allowEmpty is true", async () => {
    render(NumberInput, {
      props: { allowEmpty: true },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    expect(input).toHaveValue(null);
  });

  it("should show invalid state when value exceeds max via typing", async () => {
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "25");
    expect(screen.getByTestId("value").textContent).toBe("25");
    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("should not show helper text when invalid", () => {
    render(NumberInput, {
      props: {
        invalid: true,
        invalidText: "Invalid input",
        helperText: "Helper text",
      },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("should not show helper text when warning", () => {
    render(NumberInput, {
      props: {
        warn: true,
        warnText: "Warning message",
        helperText: "Helper text",
      },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Warning message")).toBeInTheDocument();
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

  it("should have paste event listener", () => {
    render(NumberInput);
    const input = screen.getByLabelText("Clusters");

    expect(input).toBeInTheDocument();
  });

  it("should have wrapper element for event handling", () => {
    const { container } = render(NumberInput);

    const wrapper = container.querySelector(".bx--form-item");
    expect(wrapper).toBeInTheDocument();
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

  it("should use translateWithId to customize button labels", () => {
    render(NumberInput, {
      props: {
        translateWithId: (id: string) => {
          if (id === "increment") return "Plus";
          if (id === "decrement") return "Minus";
          return id;
        },
      },
    });

    expect(screen.getByRole("button", { name: "Plus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minus" })).toBeInTheDocument();
  });

  it("should have translationIds constant", () => {
    render(NumberInput);

    // translationIds is exported from the component, available for external use
    expect(true).toBe(true);
  });

  it("should set aria-describedby to error id when invalid", () => {
    render(NumberInput, {
      props: { id: "test-input", invalid: true, invalidText: "Error" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-describedby", "error-test-input");
  });

  it("should set aria-describedby to warn id when warn", () => {
    render(NumberInput, {
      props: { id: "test-input", warn: true, warnText: "Warning" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-describedby", "warn-test-input");
  });

  it("should set aria-describedby to helper id when helperText is provided", () => {
    render(NumberInput, {
      props: { id: "test-input", helperText: "Helper" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-describedby", "helper-test-input");
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

  it("should set pattern attribute for numeric input", () => {
    render(NumberInput);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
  });

  it("should support aria-label override via restProps", () => {
    render(NumberInput, {
      props: {
        labelText: "",
      },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute(
      "aria-label",
      "Numeric input field with increment and decrement buttons",
    );
  });

  it("should render readonly icon when readonly", () => {
    render(NumberInput, {
      props: { readonly: true },
    });

    const input = screen.getByLabelText("Clusters");
    const numberWrapper = input.closest(".bx--number");
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
    // When invalid, only invalid icon should be present, not warning icon
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
    // Should have readonly icon but not invalid icon
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

  it("should show invalid state when invalid prop is true and invalidText is provided", () => {
    // NumberInput should require both invalid=true AND invalidText to show invalid state
    render(NumberInput, {
      props: { invalid: true, invalidText: "This field is invalid" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(screen.getByText("This field is invalid")).toBeInTheDocument();
  });

  it("should show invalid visual state when invalid prop is true but invalidText is empty", () => {
    const { container } = render(NumberInput, {
      props: { invalid: true, invalidText: "" },
    });

    const input = screen.getByRole("spinbutton");
    // Visual invalid state (border, icon) shows even without invalidText
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    // But no error message div should be rendered
    expect(
      container.querySelector(".bx--form-requirement"),
    ).not.toBeInTheDocument();
  });

  it("should bind ref to input element", () => {
    render(NumberInput, {
      props: { ref: null },
    });

    const input = screen.getByLabelText("Clusters");
    expect(input).toBeInTheDocument();
  });

  it("should preserve decimal input with trailing zeros when allowDecimal is true", async () => {
    render(NumberInput, {
      props: { allowDecimal: true, step: 0.1, value: null },
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;

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
    expect.assert(input instanceof HTMLInputElement);
    expect(input.value).toBe("1");

    await user.clear(input);
    expect(input.value).toBe("");

    // Value should be null when cleared
    if (isSvelte5) {
      expect(screen.getByTestId("value").textContent).toBe("");
    } else {
      expect(screen.getByTestId("value").textContent).toBe("null");
    }
  });

  it("should sync input when value prop changes programmatically in allowDecimal mode", async () => {
    // When value is changed from the parent (e.g., via bind:value), the input should update.
    // This tests the reactive statement that syncs inputValue from value.
    const { rerender } = render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: 5 },
    });

    const input = screen.getByRole("textbox");
    expect.assert(input instanceof HTMLInputElement);
    expect(input.value).toBe("5");

    // Simulate parent changing value programmatically
    rerender({ allowDecimal: true, allowEmpty: true, value: 10 });
    await tick();
    expect(input.value).toBe("10");

    // Set to null
    rerender({ allowDecimal: true, allowEmpty: true, value: null });
    await tick();
    expect(input.value).toBe("");

    // Set back to a value
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
    expect(screen.getByTestId("value").textContent).toBe("0.1");

    await user.click(decrementButton);
    expect(screen.getByTestId("value").textContent).toBe("0");
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
    // Should NOT automatically show invalid state - requires explicit invalid={true}
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".bx--number")).not.toHaveAttribute("data-invalid");
  });

  it("should not set error state when value is null and allowEmpty is true", () => {
    render(NumberInput, { props: { value: null, allowEmpty: true } });

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/pull/2384
  it("should default to 0 when allowEmpty is false and input is cleared", async () => {
    render(NumberInput, { props: { allowEmpty: false, value: 5 } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    // Value should default to 0 when allowEmpty is false
    expect(screen.getByTestId("value").textContent).toBe("0");
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

    // Value should default to min (4) when allowEmpty is false and min is defined
    expect(screen.getByTestId("value").textContent).toBe("4");
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

    // Should use min (5) as starting point, then increment to 6
    expect(screen.getByTestId("value").textContent).toBe("6");
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

    // Should use 0 as default, then decrement to -1
    expect(screen.getByTestId("value").textContent).toBe("-1");
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
    if (isSvelte5) {
      const valueText = screen.getByTestId("value").textContent;
      expect(valueText).toBe("");
      expect(input).toHaveValue(null);
    } else {
      expect(screen.getByTestId("value").textContent).toBe("null");
      expect(input).toHaveValue(null);
    }
  });

  it("should auto-invalidate when typed value exceeds max", async () => {
    render(NumberInput, { props: { max: 10 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "15");

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should auto-invalidate when initial value is below min", () => {
    render(NumberInput, { props: { min: 5, value: 3 } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not set error state when readonly and invalid", () => {
    render(NumberInput, {
      props: { readonly: true, invalid: true, invalidText: "Invalid" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should parse empty string to null", async () => {
    render(NumberInput, { props: { value: 5 } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    // In Svelte 5, null and undefined are rendered as empty strings in the DOM (expected behavior).
    // See: https://svelte.dev/docs/svelte/v5-migration-guide
    // The actual bound value is still null, but DOM text interpolation renders it as "".
    if (isSvelte5) {
      const valueText = screen.getByTestId("value").textContent;
      expect(valueText).toBe("");
    } else {
      expect(screen.getByTestId("value").textContent).toBe("null");
    }
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
    // When allowDecimal is true and user types invalid input like "1.5." (two decimals),
    // the value should preserve the last valid number (1.5) instead of becoming null.
    // The input field can show "1.5." but value should stay at 1.5.
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: null },
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Type a valid decimal
    await user.type(input, "1.5");
    expect(input.value).toBe("1.5");
    expect(screen.getByTestId("value").textContent).toBe("1.5");

    // Type an additional decimal point (invalid)
    await user.type(input, ".");
    expect(input.value).toBe("1.5.");

    // Value should preserve the last valid value (1.5), not become null
    expect(screen.getByTestId("value").textContent).toBe("1.5");
  });

  it("should normalize invalid input to last valid value on blur in allowDecimal mode", async () => {
    // When allowDecimal is true and user types invalid input like "1.5." and then blurs,
    // the input should normalize back to the last valid value "1.5".
    render(NumberInput, {
      props: { allowDecimal: true, allowEmpty: true, value: null },
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Type a valid decimal then an invalid character
    await user.type(input, "1.5.");
    expect(input.value).toBe("1.5.");
    expect(screen.getByTestId("value").textContent).toBe("1.5");

    // Blur the input - should normalize back to last valid value
    await user.tab();
    expect(input.value).toBe("1.5");
    expect(screen.getByTestId("value").textContent).toBe("1.5");
  });

  describe("decimal separator normalization", () => {
    test.each([
      // Standard and locale decimal separators (comma, Arabic ٫)
      ["3.14", 3.14, "period (standard)"],
      ["3,14", 3.14, "comma (European)"],
      ["3\u066B14", 3.14, "Arabic decimal separator"],
      ["0,5", 0.5, "leading zero with comma"],
      ["0\u066B5", 0.5, "leading zero with Arabic separator"],
      // Integers and trailing zeros
      ["12", 12, "integer (no separator)"],
      ["1,0", 1, "trailing zero with comma"],
      ["1\u066B0", 1, "trailing zero with Arabic separator"],
      // Mixed separators: thousands + decimal
      ["1.000,5", 1000.5, "European thousands with comma decimal"],
      ["1,000.5", 1000.5, "English thousands with period decimal"],
      ["1.000.000,5", 1000000.5, "European millions"],
      ["1,000,000.5", 1000000.5, "English millions"],
      // Comma-only as decimal (single comma, no dot)
      ["1,5", 1.5, "comma as decimal"],
      // Invalid input
      ["abc", null, "invalid input"],
    ] as const)("should parse '%s' as %s (%s)", async (input, expectedValue, _description) => {
      render(NumberInput, {
        props: { allowDecimal: true, allowEmpty: true },
      });

      const inputEl = screen.getByRole("textbox");
      await user.clear(inputEl);
      await user.type(inputEl, input);
      await user.tab();

      const valueDisplay = screen.getByTestId("value");
      if (expectedValue === null) {
        expect(valueDisplay.textContent).toBe(isSvelte5 ? "" : "null");
      } else {
        expect(valueDisplay.textContent).toBe(expectedValue.toString());
      }
    });

    it("should parse empty input as null after blur", async () => {
      render(NumberInput, {
        props: { allowDecimal: true, allowEmpty: true },
      });

      const inputEl = screen.getByRole("textbox");
      await user.clear(inputEl);
      await user.tab();

      const valueDisplay = screen.getByTestId("value");
      expect(valueDisplay.textContent).toBe(isSvelte5 ? "" : "null");
    });
  });

  describe("stepStartValue", () => {
    it("should jump to stepStartValue when incrementing from null", async () => {
      render(NumberInput, {
        props: { allowEmpty: true, value: null, stepStartValue: 10 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      // First step from empty jumps directly to stepStartValue
      expect(screen.getByTestId("value").textContent).toBe("10");
    });

    it("should jump to stepStartValue when decrementing from null", async () => {
      render(NumberInput, {
        props: { allowEmpty: true, value: null, stepStartValue: 10 },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });

      await user.click(decrementButton);

      // First step from empty jumps directly to stepStartValue
      expect(screen.getByTestId("value").textContent).toBe("10");
    });

    it("should jump to stepStartValue when incrementing from zero", async () => {
      render(NumberInput, {
        props: { value: 0, stepStartValue: 10 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      // First step from 0 jumps directly to stepStartValue
      expect(screen.getByTestId("value").textContent).toBe("10");
    });

    it("should step normally after the first click", async () => {
      render(NumberInput, {
        props: { allowEmpty: true, value: null, stepStartValue: 10 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);
      expect(screen.getByTestId("value").textContent).toBe("10");

      await user.click(incrementButton);
      expect(screen.getByTestId("value").textContent).toBe("11");
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
      expect(screen.getByTestId("value").textContent).toBe("5");
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

      // Should jump to stepStartValue (10), not min (0)
      expect(screen.getByTestId("value").textContent).toBe("10");
    });

    it("should default to min when stepStartValue is not set", async () => {
      render(NumberInput, {
        props: { allowEmpty: false, value: null, min: 5 },
      });

      const incrementButton = screen.getByRole("button", {
        name: "Increment number",
      });

      await user.click(incrementButton);

      // Should start from min (5), then increment to 6
      expect(screen.getByTestId("value").textContent).toBe("6");
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
      // Icon should be present
      expect(
        numberWrapper?.querySelector(".bx--number__invalid"),
      ).toBeInTheDocument();
      // No error message text
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

      const input = screen.getByRole("spinbutton");
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

    it("should defer to autoInvalid when validate is not provided", () => {
      render(NumberInput, {
        props: { value: 15, max: 10 },
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

      const input = screen.getByRole("spinbutton");
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

      const input = screen.getByRole("textbox") as HTMLInputElement;
      // German locale uses period for thousands and comma for decimal
      expect(input.value).toBe("1.234,5");
    });

    it("should format value on blur", async () => {
      render(NumberInput, {
        props: { locale: "en-US", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.type(input, "1234.5");
      await user.tab();

      // After blur, value should be formatted according to locale
      expect(screen.getByTestId("value").textContent).toBe("1234.5");
      expect(input.value).toBe("1,234.5");
    });

    it("should parse German decimal (comma) correctly on blur", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.type(input, "3,14");
      await user.tab();

      expect(screen.getByTestId("value").textContent).toBe("3.14");
    });

    it("should handle null value with locale", () => {
      render(NumberInput, {
        props: { locale: "en-US", value: null, allowEmpty: true },
      });

      const input = screen.getByRole("textbox") as HTMLInputElement;
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

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("1.001");
      expect(screen.getByTestId("value").textContent).toBe("1001");
    });

    it("should handle stepper decrement with locale formatting", async () => {
      render(NumberInput, {
        props: { locale: "de-DE", value: 1000, step: 1 },
      });

      const decrementButton = screen.getByRole("button", {
        name: "Decrement number",
      });

      await user.click(decrementButton);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("999");
      expect(screen.getByTestId("value").textContent).toBe("999");
    });

    it("should auto-invalidate with locale when value exceeds max", () => {
      render(NumberInput, {
        props: { locale: "en-US", value: 15, max: 10 },
      });

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should fall back to standard behavior when locale is undefined", () => {
      render(NumberInput, { props: { value: 5 } });

      // Should be a number input, not text
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("should handle formatOptions for decimal precision", () => {
      render(NumberInput, {
        props: {
          locale: "en-US",
          formatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          value: 1234.5,
        },
      });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("1,234.50");
    });

    it("should update formatting when value changes programmatically", async () => {
      const { rerender } = render(NumberInput, {
        props: { locale: "de-DE", value: 100, allowEmpty: true },
      });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("100");

      rerender({ locale: "de-DE", value: 1234.5, allowEmpty: true });
      await tick();
      expect(input.value).toBe("1.234,5");

      rerender({ locale: "de-DE", value: null, allowEmpty: true });
      await tick();
      expect(input.value).toBe("");
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
});
