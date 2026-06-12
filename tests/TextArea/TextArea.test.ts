import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TextAreaFluidForm from "./TextArea.fluidForm.test.svelte";
import TextAreaFluidSkeleton from "./TextArea.fluidSkeleton.test.svelte";
import TextAreaFluidSlot from "./TextArea.fluidSlot.test.svelte";
import TextArea from "./TextArea.test.svelte";
import TextAreaCustom from "./TextAreaCustom.test.svelte";

describe("TextArea", () => {
  it("should render with default props", () => {
    render(TextArea);

    expect(screen.getByLabelText("App description")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("cols");
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

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea.parentElement).toHaveClass(
      "bx--text-area__wrapper--readonly",
    );
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

  it("should disable resize when cols is specified", () => {
    render(TextArea, { props: { cols: 30 } });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveStyle({ resize: "none" });
  });

  it("should allow resize when cols is not specified", () => {
    render(TextArea, { props: { cols: undefined } });

    const textarea = screen.getByRole("textbox");
    expect(textarea.style.resize).toBe("");
  });

  it("should not have default cols value", () => {
    render(TextArea, { props: { cols: undefined } });

    const textarea = screen.getByRole("textbox");
    expect(textarea).not.toHaveAttribute("cols");
  });

  describe("fluid variant", () => {
    it("does not render fluid classes by default", () => {
      render(TextArea);

      expect(document.querySelector(".bx--text-area--fluid")).toBeNull();
      expect(document.querySelector(".bx--text-area__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(TextArea, { fluid: true, helperText: "Helper text" });

      const textarea = screen.getByLabelText("App description");
      expect(textarea.closest(".bx--form-item")).toHaveClass(
        "bx--text-area--fluid",
      );
      expect(
        document.querySelector(".bx--text-area__divider"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(textarea).not.toHaveAttribute("aria-describedby");
    });

    it("renders the error message inside the input wrapper", () => {
      render(TextArea, {
        fluid: true,
        invalid: true,
        invalidText: "Invalid input",
      });

      const message = screen.getByText("Invalid input");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--text-area__wrapper")).not.toBeNull();
      expect(screen.getByLabelText("App description")).toHaveAttribute(
        "aria-describedby",
        "error-ccs-test",
      );
    });

    it("renders the warning message inside the input wrapper", () => {
      render(TextArea, {
        fluid: true,
        warn: true,
        warnText: "Warning message",
      });

      const message = screen.getByText("Warning message");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--text-area__wrapper")).not.toBeNull();
    });

    it.each([
      { disabled: true },
      { readonly: true },
    ])("suppresses invalid and warn states when %o", (props) => {
      render(TextArea, {
        fluid: true,
        invalid: true,
        invalidText: "Invalid input",
        warn: true,
        warnText: "Warning message",
        ...props,
      });

      expect(screen.queryByText("Invalid input")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
      expect(document.querySelector("[data-invalid]")).toBeNull();
    });

    it("inherits fluid from the FluidForm context", () => {
      render(TextAreaFluidForm);

      const textarea = screen.getByLabelText("Fluid form description");
      expect(textarea.closest(".bx--form-item")).toHaveClass(
        "bx--text-area--fluid",
      );
    });

    it("marks the label as slotted when fluid", () => {
      render(TextAreaFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(TextAreaFluidSlot, { fluid: false });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });
  });

  it("renders fluid skeleton state", () => {
    render(TextAreaFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-text-area-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      "bx--form-item",
      "bx--text-area--fluid__skeleton",
    );
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--skeleton", "bx--text-area");
  });
});
