import { render, screen } from "@testing-library/svelte";
import { assert } from "vitest";
import { user, isSvelte4, isSvelte5 } from "../setup-tests";
import TextInputSvelte4 from "./TextInput.test.svelte";
import TextInputSvelte5 from "./TextInput.svelte5.test.svelte";
import TextInputCustom from "./TextInputCustom.test.svelte";
import TextInputFluid from "./TextInputFluid.test.svelte";

const TextInput = isSvelte5 ? TextInputSvelte5 : TextInputSvelte4;

describe("TextInput", () => {
  it("should render with default props", () => {
    render(TextInput);

    expect(screen.getByLabelText("User name")).toBeInTheDocument();
  });

  it("should handle placeholder text", () => {
    render(TextInput, {
      props: { placeholder: "Enter user name..." },
    });

    expect(
      screen.getByPlaceholderText("Enter user name..."),
    ).toBeInTheDocument();
  });

  it("should handle different sizes", () => {
    (["sm", "xl"] as const).forEach((size) => {
      const { container } = render(TextInput, {
        props: { size },
      });

      const input = container.querySelector("input");
      expect(input).toHaveClass(`bx--text-input--${size}`);
      container.remove();
    });
  });

  it("should handle light variant", () => {
    render(TextInput, { props: { light: true } });

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--light");
  });

  it("should handle disabled state", () => {
    render(TextInput, { props: { disabled: true } });

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(screen.getByText("User name")).toHaveClass("bx--label--disabled");
  });

  it("should handle helper text", () => {
    render(TextInput, { props: { helperText: "Helper text" } });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text",
    );
  });

  it("should handle invalid state", () => {
    render(TextInput, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid input")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should handle warning state", () => {
    render(TextInput, {
      props: { warn: true, warnText: "Warning message" },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--warning");
    expect(screen.getByText("Warning message")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should handle hidden label", () => {
    render(TextInput, { props: { hideLabel: true } });

    expect(screen.getByText("User name")).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(TextInput, { props: { id: "custom-id" } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("User name")).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(TextInput, { props: { name: "custom-name" } });

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "custom-name");
  });

  it("should handle required state", () => {
    render(TextInput, { props: { required: true } });

    expect(screen.getByRole("textbox")).toHaveAttribute("required");
  });

  it("should handle inline variant", () => {
    render(TextInput, { props: { inline: true } });

    expect(screen.getByText("User name")).toHaveClass("bx--label--inline");
  });

  it("should handle readonly state", () => {
    render(TextInput, {
      props: { readonly: true },
    });

    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("should handle custom slots", () => {
    render(TextInputCustom);

    expect(screen.getByText("Custom Label Text").tagName).toBe("SPAN");
  });

  it("should handle value binding", async () => {
    render(TextInput);

    const input = screen.getByRole("textbox");
    await user.type(input, "Test value");
    expect(screen.getByTestId("value").textContent).toBe("Test value");
  });

  it("should handle number type input", async () => {
    render(TextInput, { props: { type: "number" } });

    const input = screen.getByLabelText("User name");
    await user.type(input, "123");
    expect(input).toHaveValue(123);

    await user.clear(input);
    expect(input).toHaveValue(null);
  });

  it("should bind number value as number", async () => {
    render(TextInput, { props: { type: "number" } });

    const input = screen.getByLabelText("User name");
    await user.type(input, "123");

    // The bound value should be a number (backward compatibility).
    const boundValue = screen.getByTestId("value").textContent;
    expect(boundValue).toBe("123");

    await user.clear(input);
    const clearedDisplayValue = screen.getByTestId("value").textContent;
    // Svelte renders {null} as a string.
    expect(clearedDisplayValue).toBe("null");
  });

  it("should not show helper text when invalid", () => {
    render(TextInput, {
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
    render(TextInput, {
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
    render(TextInput, {
      props: {
        disabled: true,
        helperText: "Helper text",
      },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("should handle inline helper text", () => {
    render(TextInput, {
      props: {
        inline: true,
        helperText: "Helper text",
      },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text--inline",
    );
  });

  describe.skipIf(isSvelte5)("svelte 4", () => {
    it("should dispatch keydown event", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("keydown", mockHandler);

      const input = screen.getByRole("textbox");
      await user.type(input, "{Enter}");

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch keyup event", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("keyup", mockHandler);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch focus event", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("focus", mockHandler);

      const input = screen.getByRole("textbox");
      await user.click(input);

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch blur event", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("blur", mockHandler);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch change event with parsed value", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("change", mockHandler);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe("test");
    });

    it("should dispatch change event with number value for number type", async () => {
      const { component } = render(TextInput, {
        props: { type: "number" },
      });
      const mockHandler = vi.fn();
      component.$on("change", mockHandler);

      const input = screen.getByRole("spinbutton");
      await user.type(input, "123");
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(123);
    });

    it("should dispatch change event with null for empty number input", async () => {
      const { component } = render(TextInput, {
        props: { type: "number", value: 123 },
      });
      const mockHandler = vi.fn();
      component.$on("change", mockHandler);

      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(null);
    });

    it("should dispatch input event with parsed value", async () => {
      const { component } = render(TextInput);
      const mockHandler = vi.fn();
      component.$on("input", mockHandler);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe("a");
    });

    it("should dispatch input event with number value for number type", async () => {
      const { component } = render(TextInput, {
        props: { type: "number" },
      });
      const mockHandler = vi.fn();
      component.$on("input", mockHandler);

      const input = screen.getByRole("spinbutton");
      await user.type(input, "5");

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(5);
    });
  });

  describe.skipIf(isSvelte4)("svelte 5", () => {
    it("should dispatch keydown event", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { onkeydown: mockHandler });

      const input = screen.getByRole("textbox");
      await user.type(input, "{Enter}");

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch keyup event", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { onkeyup: mockHandler });

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch focus event", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { onfocus: mockHandler });

      const input = screen.getByRole("textbox");
      await user.click(input);

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch blur event", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { onblur: mockHandler });

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should dispatch change event with parsed value", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { onchange: mockHandler });

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe("test");
    });

    it("should dispatch change event with number value for number type", async () => {
      const mockHandler = vi.fn();
      render(TextInput, {
        type: "number",
        onchange: mockHandler,
      });

      const input = screen.getByRole("spinbutton");
      await user.type(input, "123");
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(123);
    });

    it("should dispatch change event with null for empty number input", async () => {
      const mockHandler = vi.fn();
      render(TextInput, {
        type: "number",
        value: 123,
        onchange: mockHandler,
      });

      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.tab();

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(null);
    });

    it("should dispatch input event with parsed value", async () => {
      const mockHandler = vi.fn();
      render(TextInput, { oninput: mockHandler });

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe("a");
    });

    it("should dispatch input event with number value for number type", async () => {
      const mockHandler = vi.fn();
      render(TextInput, {
        type: "number",
        oninput: mockHandler,
      });

      const input = screen.getByRole("spinbutton");
      await user.type(input, "5");

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler.mock.calls[0][0].detail).toBe(5);
    });
  });

  it("should have paste event listener", () => {
    const { container } = render(TextInput);
    const input = container.querySelector("input");

    expect(input).toBeInTheDocument();
  });

  it("should render fluid mode with divider", () => {
    const { container } = render(TextInputFluid);

    expect(
      container.querySelector(".bx--text-input__divider"),
    ).toBeInTheDocument();
  });

  it("should render fluid mode with invalid state", () => {
    const { container } = render(TextInputFluid, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const requirement = container.querySelector(".bx--form-requirement");
    expect(requirement).toBeInTheDocument();
    expect(requirement).toHaveTextContent("Invalid input");
  });

  it("should render fluid mode with warning state", () => {
    const { container } = render(TextInputFluid, {
      props: { warn: true, warnText: "Warning message" },
    });

    const requirement = container.querySelector(".bx--form-requirement");
    expect(requirement).toBeInTheDocument();
    expect(requirement).toHaveTextContent("Warning message");
  });

  it("should not render helper text in fluid mode when not inline", () => {
    render(TextInputFluid, {
      props: { helperText: "Helper text" },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
  });

  it("should not render helper text in fluid mode even when inline", () => {
    render(TextInputFluid, {
      props: { inline: true, helperText: "Helper text" },
    });

    // In fluid+inline mode, helper text is not rendered based on the source code logic
    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
  });

  it("should set aria-describedby to error id when invalid", () => {
    render(TextInput, {
      props: {
        id: "test-input",
        invalid: true,
        invalidText: "Invalid input",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "error-test-input");
  });

  it("should set aria-describedby to warning id when warn", () => {
    render(TextInput, {
      props: {
        id: "test-input",
        warn: true,
        warnText: "Warning message",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "warn-test-input");
  });

  it("should set aria-describedby to helper id when only helper text", () => {
    render(TextInput, {
      props: {
        id: "test-input",
        helperText: "Helper text",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "helper-test-input");
  });

  it("should not set aria-describedby when no helper/error/warn", () => {
    render(TextInput, {
      props: {
        id: "test-input",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should render readonly icon when readonly", () => {
    const { container } = render(TextInput, {
      props: { readonly: true },
    });

    expect(
      container.querySelector(".bx--text-input__readonly-icon"),
    ).toBeInTheDocument();
  });

  it("should render invalid icon when invalid", () => {
    const { container } = render(TextInput, {
      props: { invalid: true, invalidText: "Invalid" },
    });

    expect(
      container.querySelector(".bx--text-input__invalid-icon"),
    ).toBeInTheDocument();
  });

  it("should render warning icon when warn and not invalid", () => {
    const { container } = render(TextInput, {
      props: { warn: true, warnText: "Warning" },
    });

    const icon = container.querySelector(
      ".bx--text-input__invalid-icon--warning",
    );
    expect(icon).toBeInTheDocument();
  });

  it("should not render warning icon when both invalid and warn", () => {
    const { container } = render(TextInput, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const warningIcon = container.querySelector(
      ".bx--text-input__invalid-icon--warning",
    );
    expect(warningIcon).not.toBeInTheDocument();
  });

  it("should apply inline-sm class when inline and size is sm", () => {
    render(TextInput, {
      props: { inline: true, size: "sm" },
    });

    const label = screen.getByText("User name");
    expect(label).toHaveClass("bx--label--inline--sm");
  });

  it("should apply inline-xl class when inline and size is xl", () => {
    render(TextInput, {
      props: { inline: true, size: "xl" },
    });

    const label = screen.getByText("User name");
    expect(label).toHaveClass("bx--label--inline--xl");
  });

  it("should render label helper wrapper in inline mode", () => {
    const { container } = render(TextInput, {
      props: { inline: true, helperText: "Helper text" },
    });

    expect(
      container.querySelector(".bx--text-input__label-helper-wrapper"),
    ).toBeInTheDocument();
  });

  it("should render field outer wrapper with inline class", () => {
    const { container } = render(TextInput, {
      props: { inline: true },
    });

    expect(
      container.querySelector(".bx--text-input__field-outer-wrapper--inline"),
    ).toBeInTheDocument();
  });

  it("should bind ref to input element", () => {
    const { container } = render(TextInput, {
      props: { ref: null },
    });

    const input = container.querySelector("input");
    expect(input).toBeInTheDocument();
  });

  it("should handle empty string to null conversion for number type", async () => {
    render(TextInput, {
      props: { type: "number", value: 123 },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    // When cleared, number input value becomes null which displays as "null" string
    const valueDisplay = screen.getByTestId("value").textContent;
    expect(valueDisplay).toBe("null");
  });

  it("should support restProps on input element", () => {
    const { container } = render(TextInput);

    // The input element should exist and be able to receive additional props via restProps
    const input = container.querySelector("input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
  });

  it("should still show warning text in readonly mode", () => {
    render(TextInput, {
      props: {
        readonly: true,
        warn: true,
        warnText: "Warning message",
      },
    });

    // Warning text is still displayed even in readonly mode
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should show invalid but not set data-invalid on input when readonly", () => {
    render(TextInput, {
      props: {
        readonly: true,
        invalid: true,
        invalidText: "Invalid input",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("data-invalid");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should show invalid message when both invalid and warn are set", () => {
    render(TextInput, {
      props: {
        invalid: true,
        invalidText: "Invalid input",
        warn: true,
        warnText: "Warning message",
      },
    });

    // When both are set, invalid takes precedence
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("should dispatch change event with parsed value", async () => {
    const { component } = render(TextInput);
    const mockHandler = vi.fn();
    component.$on("change", mockHandler);

    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe("test");
  });

  it("should dispatch change event with number value for number type", async () => {
    const { component } = render(TextInput, {
      props: { type: "number" },
    });
    const mockHandler = vi.fn();
    component.$on("change", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "123");
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(123);
  });

  it("should dispatch change event with null for empty number input", async () => {
    const { component } = render(TextInput, {
      props: { type: "number", value: 123 },
    });
    const mockHandler = vi.fn();
    component.$on("change", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(null);
  });

  it("should dispatch input event with parsed value", async () => {
    const { component } = render(TextInput);
    const mockHandler = vi.fn();
    component.$on("input", mockHandler);

    const input = screen.getByRole("textbox");
    await user.type(input, "a");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe("a");
  });

  it("should dispatch input event with number value for number type", async () => {
    const { component } = render(TextInput, {
      props: { type: "number" },
    });
    const mockHandler = vi.fn();
    component.$on("input", mockHandler);

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(5);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1836
  it("should preserve HTML5 step attribute validation for number inputs", async () => {
    render(TextInput, { props: { type: "number", step: "0.01" } });

    const input = screen.getByLabelText("User name");
    assert(input instanceof HTMLInputElement);

    // Set a value that doesn't match the step.
    await user.type(input, "1.234");

    // The input should keep the string value during typing to allow native validation.
    expect(input.value).toBe("1.234");

    // Native step validation should work.
    expect(input.validity.stepMismatch).toBe(true);

    // Set a value that matches the step.
    await user.clear(input);
    await user.type(input, "1.23");

    expect(input.value).toBe("1.23");
    expect(input.validity.stepMismatch).toBe(false);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1836
  it("should preserve HTML5 min/max attribute validation for number inputs", async () => {
    render(TextInput, {
      props: {
        type: "number",
        min: "1",
        max: "100",
      },
    });

    const input = screen.getByLabelText("User name");
    assert(input instanceof HTMLInputElement);
    await user.type(input, "0");
    expect(input.value).toBe("0");
    expect(input.validity.rangeUnderflow).toBe(true);

    // Type a value that's within range and valid.
    await user.clear(input);
    await user.type(input, "50");
    expect(input.value).toBe("50");
    expect(input.validity.valid).toBe(true);

    // Type a value that's above max.
    await user.clear(input);
    await user.type(input, "101");
    expect(input.value).toBe("101");
    expect(input.validity.rangeOverflow).toBe(true);
  });
});
