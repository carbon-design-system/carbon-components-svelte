import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TextArea from "./TextArea.test.svelte";
import TextAreaCustom from "./TextAreaCustom.test.svelte";

describe("TextArea", () => {
  it("should render with default props", () => {
    render(TextArea);

    expect(screen.getByLabelText("App description")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("cols", "50");
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
  });

  it("should handle placeholder text", () => {
    render(TextArea, { props: { placeholder: "Enter description..." } });

    expect(
      screen.getByPlaceholderText("Enter description..."),
    ).toBeInTheDocument();
  });

  it("should handle custom rows and cols", () => {
    render(TextArea, {
      props: { rows: 10, cols: 100 },
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "10");
    expect(textarea).toHaveAttribute("cols", "100");
  });

  it("should handle max character count", () => {
    render(TextArea, { props: { maxCount: 100, value: "Test text" } });

    expect(screen.getByText("9/100")).toBeInTheDocument();
  });

  it("should handle light variant", () => {
    render(TextArea, { props: { light: true } });

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-area--light");
  });

  it("should handle disabled state", () => {
    render(TextArea, { props: { disabled: true } });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(screen.getByText("App description")).toHaveClass(
      "bx--label--disabled",
    );
  });

  it("should handle readonly state", () => {
    render(TextArea, { props: { readonly: true } });

    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("should handle helper text", () => {
    render(TextArea, { props: { helperText: "Helper text" } });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text",
    );
  });

  it("should handle invalid state", () => {
    render(TextArea, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("bx--text-area--invalid");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid input")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should handle hidden label", () => {
    render(TextArea, { props: { hideLabel: true } });

    expect(screen.getByLabelText("App description")).toBeInTheDocument();
  });

  it("should handle custom id", () => {
    render(TextArea, { props: { id: "custom-id" } });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("App description")).toHaveAttribute(
      "for",
      "custom-id",
    );
  });

  it("should handle custom name", () => {
    render(TextArea, {
      props: { name: "custom-name" },
    });

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom slots", () => {
    render(TextAreaCustom);

    expect(screen.getByText("Custom Label Text").tagName).toBe("SPAN");
  });

  it("should handle value binding", async () => {
    render(TextArea);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Test value");
    expect(screen.getByTestId("value").textContent).toBe("Test value");
  });

  it("should handle maxlength attribute when maxCount is set", () => {
    render(TextArea, { props: { maxCount: 100 } });

    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "100");
  });

  it("should not show helper text when invalid", () => {
    render(TextArea, {
      props: {
        invalid: true,
        invalidText: "Invalid input",
        helperText: "Helper text",
      },
    });

    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("should handle disabled helper text", () => {
    render(TextArea, {
      props: {
        disabled: true,
        helperText: "Helper text",
      },
    });

    expect(screen.getByText("Helper text")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });
});
