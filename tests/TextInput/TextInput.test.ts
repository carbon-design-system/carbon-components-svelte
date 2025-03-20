import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TextInput from "./TextInput.test.svelte";
import TextInputCustom from "./TextInputCustom.test.svelte";

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
});
