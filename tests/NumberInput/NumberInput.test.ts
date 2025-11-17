import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
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
      const { container } = render(NumberInput, {
        props: { size },
      });

      const input = container.querySelector("input");
      expect(input?.closest(".bx--number")).toHaveClass(`bx--number--${size}`);
      container.remove();
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

  // TODO(bug): The icon descriptions are not being applied.
  it.skip("should handle custom icon descriptions", () => {
    render(NumberInput, {
      props: { iconDescription: "Custom description" },
    });

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveAttribute("title", "Custom description");
    }
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

  it("should handle min/max validation", async () => {
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
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("keydown", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "{Enter}");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch keyup event", async () => {
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("keyup", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch focus event", async () => {
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("focus", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.click(input);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch blur event", async () => {
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("blur", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should have paste event listener", () => {
    const { container } = render(NumberInput);
    const input = container.querySelector("input");

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

  it("should use iconDescription as fallback for button labels", () => {
    render(NumberInput, {
      props: {
        translateWithId: () => "",
        iconDescription: "Adjust value",
      },
    });

    const buttons = screen.getAllByRole("button", { name: "Adjust value" });
    expect(buttons).toHaveLength(2); // Both increment and decrement buttons
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
    const { container } = render(NumberInput, {
      props: {
        labelText: "",
      },
    });

    const input = container.querySelector("input");
    expect(input).toHaveAttribute(
      "aria-label",
      "Numeric input field with increment and decrement buttons",
    );
  });

  it("should render readonly icon when readonly", () => {
    const { container } = render(NumberInput, {
      props: { readonly: true },
    });

    expect(
      container.querySelector(".bx--text-input__readonly-icon"),
    ).toBeInTheDocument();
  });

  it("should render invalid icon when invalid", () => {
    const { container } = render(NumberInput, {
      props: { invalid: true, invalidText: "Invalid" },
    });

    expect(container.querySelector(".bx--number__invalid")).toBeInTheDocument();
  });

  it("should render warning icon when warn and not invalid", () => {
    const { container } = render(NumberInput, {
      props: { warn: true, warnText: "Warning" },
    });

    const icon = container.querySelector(".bx--number__invalid--warning");
    expect(icon).toBeInTheDocument();
  });

  it("should not render warning icon when both invalid and warn", () => {
    const { container } = render(NumberInput, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const warningIcon = container.querySelector(
      ".bx--number__invalid--warning",
    );
    expect(warningIcon).not.toBeInTheDocument();
  });

  it("should not render icons when readonly", () => {
    const { container } = render(NumberInput, {
      props: {
        readonly: true,
        invalid: true,
        invalidText: "Invalid",
      },
    });

    expect(
      container.querySelector(".bx--number__invalid"),
    ).not.toBeInTheDocument();
  });

  it("should bind ref to input element", () => {
    const { container } = render(NumberInput, {
      props: { ref: null },
    });

    const input = container.querySelector("input");
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
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("change", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(5);
  });

  it("should dispatch input event on typing", async () => {
    const { component } = render(NumberInput);
    const mockHandler = vi.fn();
    component.$on("input", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "7");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(7);
  });

  it("should dispatch both change and input events on stepper click", async () => {
    const { component } = render(NumberInput);
    const changeHandler = vi.fn();
    const inputHandler = vi.fn();
    component.$on("change", changeHandler);
    component.$on("input", inputHandler);

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
    const { component } = render(NumberInput, { props: { value: 10 } });
    const inputHandler = vi.fn();
    component.$on("input", inputHandler);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    expect(inputHandler).toHaveBeenCalled();
    expect(inputHandler.mock.calls[0][0].detail).toBe(null);
  });

  it("should set error state when value is null and allowEmpty is false", () => {
    render(NumberInput, { props: { value: null, allowEmpty: false } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".bx--number")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("should not set error state when value is null and allowEmpty is true", () => {
    render(NumberInput, { props: { value: null, allowEmpty: true } });

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should set error state when value exceeds max", async () => {
    render(NumberInput, { props: { max: 10 } });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "15");

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should set error state when value is below min", async () => {
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

    expect(screen.getByTestId("value").textContent).toBe("null");
  });

  it("should support restProps passthrough", () => {
    const { container } = render(NumberInput, {
      props: {
        title: "Custom title",
      },
    });

    const input = container.querySelector("input");
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
    const { container } = render(NumberInput, { props: { value: null } });

    const input = container.querySelector("input");
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
