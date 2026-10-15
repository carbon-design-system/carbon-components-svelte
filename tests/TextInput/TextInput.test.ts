import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { user } from "../utils/user";
import TextInput from "./TextInput.test.svelte";
import TextInputCustom from "./TextInputCustom.test.svelte";
import TextInputInlineLabelChildren from "./TextInputInlineLabelChildren.test.svelte";

describe("TextInput", () => {
  it("should not render a stray helper element or aria-describedby for an empty-string helperText", () => {
    const { container } = render(TextInput, { props: { helperText: "" } });

    expect(
      container.querySelector(".bx--form__helper-text"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
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
    const sizes = ["xs", "sm", "xl"] as const;
    for (const size of sizes) {
      const { unmount } = render(TextInput, {
        props: { size },
      });

      const input = screen.getByLabelText("User name");
      expect(input).toHaveClass(`bx--text-input--${size}`);
      unmount();
    }
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

  it("should show the character counter when maxCount is set", () => {
    render(TextInput, {
      props: { maxCount: 100, value: "Test text" },
    });

    expect(screen.getByText("9/100")).toBeInTheDocument();
  });

  it("updates the character counter as the user types", async () => {
    render(TextInput, { props: { maxCount: 10 } });
    expect(screen.getByText("0/10")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "abc");
    expect(screen.getByText("3/10")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "{Backspace}");
    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("renders and updates the character counter in inline mode", async () => {
    render(TextInput, { props: { inline: true, maxCount: 10 } });
    const counter = screen.getByText("0/10");
    expect(counter).toHaveClass("bx--text-input__label-counter");

    await user.type(screen.getByRole("textbox"), "abcd");
    expect(counter).toHaveTextContent("4/10");
  });

  it.each([
    { hideLabel: true, maxCount: undefined, helperText: "", hidden: true },
    { hideLabel: true, maxCount: 10, helperText: "", hidden: false },
    { hideLabel: true, maxCount: undefined, helperText: "Help", hidden: false },
    { hideLabel: false, maxCount: undefined, helperText: "", hidden: false },
  ])(
    "inline column hidden=$hidden for hideLabel=$hideLabel maxCount=$maxCount helperText=$helperText",
    ({ hideLabel, maxCount, helperText, hidden }) => {
      const { container } = render(TextInput, {
        props: { inline: true, hideLabel, maxCount, helperText },
      });

      const column = container.querySelector(
        ".bx--text-input__label-helper-wrapper",
      );
      expect(column?.classList.contains("bx--visually-hidden")).toBe(hidden);
    },
  );

  it("clears invalid attributes and the message when invalid turns false", async () => {
    const { rerender } = render(TextInput, {
      props: { invalid: true, invalidText: "Required" },
    });
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-errormessage");
    expect(screen.getByText("Required")).toBeInTheDocument();

    await rerender({ invalid: false });

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-errormessage");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("should not show the character counter when maxCount is unset", () => {
    render(TextInput, { props: { value: "Test text" } });

    expect(screen.queryByText(/^9\//)).not.toBeInTheDocument();
  });

  it("should set maxlength when maxCount is set", () => {
    render(TextInput, { props: { maxCount: 100 } });

    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "100");
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

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2625
  it("should render labelChildren in inline mode when labelText is empty", () => {
    render(TextInputInlineLabelChildren);

    const slotLabel = screen.getByText("Inline Slot Label");
    expect(slotLabel).toBeInTheDocument();
    expect(slotLabel.closest("label")).toHaveClass("bx--label--inline");
  });

  it("should handle readonly state", () => {
    render(TextInput, {
      props: { readonly: true },
    });

    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("renders a read-only number field as a text input", async () => {
    const { rerender } = render(TextInput, {
      props: { type: "number", readonly: true, value: 5 },
    });

    // NVDA announces a read-only number input as editable.
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("5");

    await rerender({ type: "number", readonly: false, value: 5 });
    expect(screen.getByRole("spinbutton")).toBe(input);
    expect(input).toHaveValue(5);
  });

  it("should handle custom slots", () => {
    render(TextInputCustom);

    expect(screen.getByText("Custom Label Text").tagName).toBe("SPAN");
  });

  it("should handle value binding", async () => {
    render(TextInput);

    const input = screen.getByRole("textbox");
    await user.type(input, "Test value");
    expect(getBoundText()).toBe("Test value");
  });

  it("should handle number type input", async () => {
    render(TextInput, { props: { type: "number" } });

    const input = screen.getByLabelText("User name");
    await user.type(input, "123");
    expect(input).toHaveValue(123);

    await user.clear(input);
    expect(input).toHaveValue(null);
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
    expect(screen.getByLabelText("User name")).toHaveAccessibleDescription(
      "Helper text",
    );
  });

  it("should dispatch keydown event", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { onkeydown: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.type(input, "{Enter}");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch keyup event", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { onkeyup: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.type(input, "a");

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch focus event", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { onfocus: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.click(input);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should dispatch blur event", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { onblur: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should render readonly icon when readonly", () => {
    render(TextInput, {
      props: { readonly: true },
    });

    const input = screen.getByLabelText("User name");
    const fieldWrapper = input.closest(".bx--text-input__field-wrapper");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      fieldWrapper?.querySelector(".bx--text-input__readonly-icon"),
    ).toBeInTheDocument();
  });

  it("should render invalid icon when invalid", () => {
    render(TextInput, {
      props: { invalid: true, invalidText: "Invalid" },
    });

    const input = screen.getByLabelText("User name");
    const fieldWrapper = input.closest(".bx--text-input__field-wrapper");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      fieldWrapper?.querySelector(".bx--text-input__invalid-icon"),
    ).toBeInTheDocument();
  });

  it("should render warning icon when warn and not invalid", () => {
    render(TextInput, {
      props: { warn: true, warnText: "Warning" },
    });

    const input = screen.getByLabelText("User name");
    const fieldWrapper = input.closest(".bx--text-input__field-wrapper");
    // Icon is decorative (aria-hidden) so we check by class within the wrapper
    expect(
      fieldWrapper?.querySelector(".bx--text-input__invalid-icon--warning"),
    ).toBeInTheDocument();
  });

  it("should not render warning icon when both invalid and warn", () => {
    render(TextInput, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const input = screen.getByLabelText("User name");
    const fieldWrapper = input.closest(".bx--text-input__field-wrapper");
    expect(
      fieldWrapper?.querySelector(".bx--text-input__invalid-icon--warning"),
    ).not.toBeInTheDocument();
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

  it("hides the inline label column when hideLabel leaves it empty", () => {
    const { container } = render(TextInput, {
      props: { inline: true, hideLabel: true },
    });

    expect(
      container.querySelector(".bx--text-input__label-helper-wrapper"),
    ).toHaveClass("bx--visually-hidden");
    expect(
      screen.getByRole("textbox", { name: "User name" }),
    ).toBeInTheDocument();
  });

  it("keeps the inline label column for helper text when hideLabel is set", () => {
    const { container } = render(TextInput, {
      props: { inline: true, hideLabel: true, helperText: "Helper text" },
    });

    expect(
      container.querySelector(".bx--text-input__label-helper-wrapper"),
    ).not.toHaveClass("bx--visually-hidden");
    expect(screen.getByText("User name")).toHaveClass("bx--visually-hidden");
  });

  it("should render field outer wrapper with inline class", () => {
    const { container } = render(TextInput, {
      props: { inline: true },
    });

    expect(
      container.querySelector(".bx--text-input__field-outer-wrapper--inline"),
    ).toBeInTheDocument();
  });

  it("should handle empty string to null conversion for number type", async () => {
    render(TextInput, {
      props: { type: "number", value: 123 },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    expect(getBoundText()).toBe("null");
  });

  it("should suppress warning text in readonly mode", () => {
    render(TextInput, {
      props: {
        readonly: true,
        warn: true,
        warnText: "Warning message",
      },
    });

    expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
  });

  it("should not set data-invalid on input when readonly", () => {
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

  it("should dispatch change event with parsed value", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { onchange: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe("test");
  });

  it("should dispatch change event with number value for number type", async () => {
    const mockHandler = vi.fn();
    render(TextInput, {
      props: { type: "number", onchange: mockHandler },
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
      props: { type: "number", value: 123, onchange: mockHandler },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(null);
  });

  it("should dispatch input event with parsed value", async () => {
    const mockHandler = vi.fn();
    render(TextInput, { props: { oninput: mockHandler } });

    const input = screen.getByRole("textbox");
    await user.type(input, "a");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe("a");
  });

  it("should dispatch input event with number value for number type", async () => {
    const mockHandler = vi.fn();
    render(TextInput, {
      props: { type: "number", oninput: mockHandler },
    });

    const input = screen.getByRole("spinbutton");
    await user.type(input, "5");

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].detail).toBe(5);
  });
});
