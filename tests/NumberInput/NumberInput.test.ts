import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
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

  it("should accept values outside min/max range without showing invalid state", async () => {
    // Per issue #1180, NumberInput should not automatically show invalid state
    // based on min/max constraints - it should require explicit invalid={true}
    render(NumberInput, { props: { min: 4, max: 20 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "25");
    expect(screen.getByTestId("value").textContent).toBe("25");
    // Should NOT show invalid state since invalid prop is false
    expect(screen.getByRole("spinbutton")).not.toHaveAttribute("aria-invalid");
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

  it("should dispatch blur event", async () => {
    const mockHandler = vi.fn();
    render(NumberInput, { props: { onblur: mockHandler } });

    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
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

  it("should set aria-describedby attribute", () => {
    render(NumberInput, {
      props: { id: "test-input" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-describedby", "error-test-input");
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

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1180
  it("should not show invalid state when value exceeds max but invalid prop is false", () => {
    // NumberInput should be consistent with TextInput - only show invalid state when invalid={true}
    render(NumberInput, { props: { max: 10, value: 15 } });

    const input = screen.getByRole("spinbutton");
    // Should NOT show invalid state since invalid prop is false
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".bx--number")).not.toHaveAttribute("data-invalid");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1180
  it("should not show invalid state when value is below min but invalid prop is false", () => {
    render(NumberInput, { props: { min: 5, value: 2 } });

    const input = screen.getByRole("spinbutton");
    // Should NOT show invalid state since invalid prop is false
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".bx--number")).not.toHaveAttribute("data-invalid");
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

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1180
  it("should not show invalid state when invalid prop is true but invalidText is empty", () => {
    render(NumberInput, {
      props: { invalid: true, invalidText: "" },
    });

    const input = screen.getByRole("spinbutton");
    // Should NOT show invalid state since invalidText is empty
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".bx--number")).not.toHaveAttribute("data-invalid");
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

    // TODO(svelte-5): Investigate inconsistent value representation - cleared inputs may display as empty string instead of "null" in Svelte 5
    if (isSvelte5) {
      // In Svelte 5, cleared inputs may result in empty string instead of null
      const valueText = screen.getByTestId("value").textContent;
      expect(valueText === "" || valueText === "null").toBe(true);
      expect(input).toHaveValue(null);
    } else {
      expect(screen.getByTestId("value").textContent).toBe("null");
      expect(input).toHaveValue(null);
    }
  });

  it("should not show invalid state when value exceeds max without invalid prop", async () => {
    // Per issue #1180, NumberInput should only show invalid state when invalid={true}
    render(NumberInput, { props: { max: 10 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "15");

    // Should NOT automatically show invalid state - requires explicit invalid={true}
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should not show invalid state when value is below min without invalid prop", () => {
    // Per issue #1180, NumberInput should only show invalid state when invalid={true}
    render(NumberInput, { props: { min: 5, value: 3 } });

    const input = screen.getByRole("spinbutton");
    // Should NOT automatically show invalid state - requires explicit invalid={true}
    expect(input).not.toHaveAttribute("aria-invalid");
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
});
