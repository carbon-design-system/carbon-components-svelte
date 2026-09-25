import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
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

  it("selects the full value on focus when selectTextOnFocus is true", async () => {
    render(TextArea, {
      props: { selectTextOnFocus: true, value: "hello world" },
    });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    await user.click(textarea);
    await tick();

    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe("hello world".length);
  });

  it("does not select all text on focus when selectTextOnFocus is false (default)", async () => {
    render(TextArea, { props: { value: "hello world" } });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    await user.click(textarea);
    await tick();

    expect(textarea.selectionStart).toBe(textarea.selectionEnd);
  });

  it("does not select text on focus when disabled", async () => {
    render(TextArea, {
      props: { selectTextOnFocus: true, disabled: true, value: "hello world" },
    });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    const select = vi.spyOn(textarea, "select");
    await fireEvent.focus(textarea);

    expect(select).not.toHaveBeenCalled();
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

  it("should associate helper text with the textarea via aria-describedby", () => {
    render(TextArea, { props: { helperText: "Helper text" } });

    const textarea = screen.getByRole("textbox");
    const describedById = textarea.getAttribute("aria-describedby");
    assert(describedById);
    expect(screen.getByText("Helper text")).toHaveAttribute(
      "id",
      describedById,
    );
  });

  it("should include the counter id in aria-describedby alongside helper text", () => {
    render(TextArea, {
      props: { helperText: "Helper text", maxCount: 100, value: "hi" },
    });

    const textarea = screen.getByRole("textbox");
    const describedBy = textarea.getAttribute("aria-describedby");
    assert(describedBy);
    const ids = describedBy.split(" ");

    expect(screen.getByText("Helper text").id).toBe(ids[0]);
    expect(screen.getByText("2 of 100 characters").id).toBe(ids[1]);
    expect(screen.getByText("2/100")).toBeInTheDocument();
  });

  it("should include the counter id in aria-describedby without helper text", () => {
    render(TextArea, { props: { maxCount: 100, value: "hi" } });

    const textarea = screen.getByRole("textbox");
    expect(textarea.getAttribute("aria-describedby")).toBe(
      screen.getByText("2 of 100 characters").id,
    );
    expect(screen.getByText("2/100")).toBeInTheDocument();
  });

  it("does not describe the visible count twice; the sentence span carries the description", () => {
    render(TextArea, { props: { maxCount: 100, value: "hi" } });

    expect(screen.getByText("2/100")).toHaveAttribute("aria-hidden", "true");
  });

  it("announces the character limit only when the count reaches it", async () => {
    render(TextArea, { props: { maxCount: 5, value: "" } });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    assert(liveRegion);
    expect(liveRegion).toHaveTextContent("");

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.value = "12345";
    await fireEvent.input(textarea);
    expect(liveRegion).toHaveTextContent("Character limit reached");

    textarea.value = "1234";
    await fireEvent.input(textarea);
    expect(liveRegion).toHaveTextContent("");
  });

  it("does not announce the limit on mount when the initial value is already at the limit", () => {
    render(TextArea, { props: { maxCount: 5, value: "12345" } });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    assert(liveRegion);
    expect(liveRegion).toHaveTextContent("");
  });

  it("uses a custom counterText for the description", () => {
    render(TextArea, {
      props: {
        maxCount: 100,
        value: "hi",
        counterText: (count: number, max: number) =>
          `${count} chars remaining of ${max}`,
      },
    });

    expect(screen.getByText("2 chars remaining of 100")).toBeInTheDocument();
  });

  it("uses a custom limitReachedText when the limit is reached", async () => {
    render(TextArea, {
      props: { maxCount: 5, value: "", limitReachedText: "No more room" },
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    assert(liveRegion);

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.value = "12345";
    await fireEvent.input(textarea);

    expect(liveRegion).toHaveTextContent("No more room");
  });

  it("does not render a live region when maxCount is unset", () => {
    render(TextArea);

    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it("should handle invalid state", () => {
    render(TextArea, {
      props: { invalid: true, invalidText: "Invalid input" },
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("bx--text-area--invalid");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    const message = screen.getByText("Invalid input");
    expect(message).toHaveClass("bx--form-requirement");
    expect(message).toHaveAttribute("role", "alert");
  });

  it("should handle hidden label", () => {
    render(TextArea, { props: { hideLabel: true } });

    expect(screen.getByLabelText("App description")).toBeInTheDocument();
  });

  it("should handle hidden label in fluid mode", () => {
    render(TextArea, { props: { fluid: true, hideLabel: true } });

    const label = screen.getByText("App description");
    expect(label).toHaveClass("bx--visually-hidden");
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

  it("does not set a maxlength attribute when maxCount is set", () => {
    render(TextArea, { props: { maxCount: 100 } });

    expect(screen.getByRole("textbox")).not.toHaveAttribute("maxlength");
  });

  it("blocks an insert at the start of a value already at its limit, leaving existing text untouched", async () => {
    render(TextArea, { props: { maxCount: 5, value: "abcde" } });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    await user.type(textarea, "X", {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });

    expect(textarea.value).toBe("abcde");
  });

  it("accepts graphemes up to maxCount and blocks the next one, by code unit not grapheme", async () => {
    render(TextArea, { props: { maxCount: 3 } });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    await user.type(textarea, "😀😀😀😀");

    expect(textarea.value).toBe("😀😀😀");
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("does not clamp a value already over maxCount when set from a parent prop", () => {
    render(TextArea, { props: { maxCount: 2, value: "😀😀😀😀" } });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    expect(textarea.value).toBe("😀😀😀😀");
  });

  it("still allows deleting from a value already over maxCount", async () => {
    render(TextArea, { props: { maxCount: 5, value: "abcdef" } });

    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await user.keyboard("{Backspace}");

    expect(textarea.value).toBe("abcde");
  });

  it("should show the counter without a label", () => {
    render(TextArea, { props: { maxCount: 100, value: "hi", labelText: "" } });

    expect(screen.getByText("2/100")).toBeInTheDocument();
    expect(screen.getByRole("textbox").getAttribute("aria-describedby")).toBe(
      screen.getByText("2 of 100 characters").id,
    );
  });

  it("should show a zero counter when maxCount is 0 and there is no label", () => {
    render(TextArea, { props: { maxCount: 0, value: "", labelText: "" } });

    expect(screen.getByText("0/0")).toBeInTheDocument();
  });

  it("should not show a counter when maxCount is unset and there is no label", () => {
    render(TextArea, { props: { labelText: "" } });

    expect(screen.queryByText(/\/0$/)).not.toBeInTheDocument();
    expect(document.querySelector(".bx--text-area__label-counter")).toBeNull();
  });

  it("marks a bound value that is already over maxCount", () => {
    render(TextArea, { props: { maxCount: 2, value: "abcd" } });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).not.toHaveClass("bx--text-area--invalid");
    const counter = screen
      .getByText("4/2")
      .closest(".bx--text-area__label-counter");
    expect(counter).toHaveClass("bx--text-area__label-counter--error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the warning class, not the invalid class, when warn is set with an over-limit value", () => {
    render(TextArea, {
      props: {
        warn: true,
        warnText: "Check length",
        maxCount: 2,
        value: "abcd",
      },
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("bx--text-area--warning");
    expect(textarea).not.toHaveClass("bx--text-area--invalid");
    expect(
      screen.getByText("4/2").closest(".bx--text-area__label-counter"),
    ).toHaveClass("bx--text-area__label-counter--error");
  });

  it("shows both the counter error and the invalid message when invalid is also set", () => {
    render(TextArea, {
      props: {
        invalid: true,
        invalidText: "Required",
        maxCount: 2,
        value: "abcd",
      },
    });

    expect(
      screen.getByText("4/2").closest(".bx--text-area__label-counter"),
    ).toHaveClass("bx--text-area__label-counter--error");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("does not mark aria-invalid for an over-limit value when disabled", () => {
    render(TextArea, {
      props: { disabled: true, maxCount: 2, value: "abcd" },
    });

    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
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

  describe("grow", () => {
    it("has no inline height when grow is unset", () => {
      render(TextArea, { props: { value: "line 1\nline 2\nline 3" } });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      expect(textarea.style.height).toBe("");
    });

    it("sets an inline height after tick when growing with a multi-line value", async () => {
      const { rerender } = render(TextArea, { props: { grow: true } });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 120,
      });

      rerender({ grow: true, value: "line 1\nline 2\nline 3" });
      await tick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(textarea.style.height).toBe("120px");
    });

    it("switches to overflow-y auto once content exceeds maxRows", async () => {
      render(TextArea, { props: { grow: true, maxRows: 2 } });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      textarea.style.lineHeight = "20px";
      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 200,
      });

      await user.type(textarea, "a long value that grows past the cap");
      await tick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(textarea.style.height).toBe("40px");
      expect(textarea.style.overflowY).toBe("auto");
    });
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
      expect(message).toHaveAttribute("role", "alert");
      expect(message.closest(".bx--text-area__wrapper")).not.toBeNull();
      const textarea = screen.getByLabelText("App description");
      expect(textarea).toHaveAttribute("aria-errormessage", "error-ccs-test");
      expect(textarea).not.toHaveAttribute("aria-describedby");
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

    it.each([{ disabled: true }, { readonly: true }])(
      "suppresses invalid and warn states when %o",
      (props) => {
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
      },
    );

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
