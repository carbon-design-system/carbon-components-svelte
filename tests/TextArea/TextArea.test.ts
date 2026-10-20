import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import TextAreaCounterMode from "./TextArea.counterMode.test.svelte";
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

  function beforeInput(
    textarea: HTMLTextAreaElement,
    data: string | null,
    inputType = "insertText",
    init: InputEventInit = {},
  ) {
    const event = new InputEvent("beforeinput", {
      inputType,
      data,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    textarea.dispatchEvent(event);
    return event;
  }

  describe("counterMode", () => {
    function setup(value: string, maxCount: number, caret = value.length) {
      render(TextArea, { props: { counterMode: "word", maxCount, value } });
      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
      return textarea;
    }

    it("counts words in the visible and hidden counter", () => {
      render(TextArea, {
        props: { counterMode: "word", maxCount: 3, value: "one two" },
      });

      expect(screen.getByText("2/3")).toBeInTheDocument();
      expect(screen.getByText("2 of 3 words")).toBeInTheDocument();
    });

    it("blocks a new word at the cap but allows whitespace", () => {
      const textarea = setup("one two three", 3);

      expect(beforeInput(textarea, " four").defaultPrevented).toBe(true);
      expect(textarea.value).toBe("one two three");
      expect(beforeInput(textarea, " ").defaultPrevented).toBe(false);
    });

    it("allows extending the last word at the cap", () => {
      const textarea = setup("one two thr", 3);

      expect(beforeInput(textarea, "ee").defaultPrevented).toBe(false);
    });

    it("truncates a paste to the word limit", () => {
      const textarea = setup("", 2);

      const event = beforeInput(textarea, "a b c d e", "insertFromPaste");

      expect(event.defaultPrevented).toBe(true);
      expect(textarea.value.trim()).toBe("a b");
    });

    it("announces the word limit when it is reached", async () => {
      render(TextArea, {
        props: { counterMode: "word", maxCount: 3, value: "one two" },
      });
      const liveRegion = document.querySelector('[aria-live="polite"]');
      assert(liveRegion);
      expect(liveRegion).toHaveTextContent("");

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      textarea.value = "one two three";
      await fireEvent.input(textarea);
      expect(liveRegion).toHaveTextContent("Word limit reached");

      textarea.value = "one two three four";
      await fireEvent.input(textarea);
      expect(liveRegion).toHaveTextContent("");
    });

    it("uses limitReachedText over the word default", async () => {
      render(TextArea, {
        props: {
          counterMode: "word",
          maxCount: 3,
          value: "one two",
          limitReachedText: "Stop",
        },
      });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      textarea.value = "one two three";
      await fireEvent.input(textarea);

      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
        "Stop",
      );
    });

    it("switches the counter from characters to words without remounting", async () => {
      render(TextAreaCounterMode);

      const textarea = screen.getByRole("textbox");
      expect(screen.getByText("7/10")).toBeInTheDocument();
      expect(screen.getByText("7 of 10 characters")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Count words" }));

      expect(screen.getByRole("textbox")).toBe(textarea);
      expect(screen.getByText("2/10")).toBeInTheDocument();
      expect(screen.getByText("2 of 10 words")).toBeInTheDocument();
    });

    it("marks a value already over the word limit without changing it", () => {
      render(TextArea, {
        props: { counterMode: "word", maxCount: 2, value: "one two three" },
      });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      expect(textarea).toHaveAttribute("aria-invalid", "true");
      expect(textarea.value).toBe("one two three");
      expect(
        screen.getByText("3/2").closest(".bx--text-area__label-counter"),
      ).toHaveClass("bx--text-area__label-counter--error");
    });
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

  it.each([false, true])("should handle hidden label (fluid: %s)", (fluid) => {
    render(TextArea, { props: { fluid, hideLabel: true } });

    const label = screen.getByText("App description");
    expect(label).toHaveClass("bx--visually-hidden");
    expect(screen.getByLabelText("App description")).toBeInTheDocument();
  });

  it("should describe the textarea with the warning in fluid mode", () => {
    render(TextArea, {
      props: { fluid: true, warn: true, warnText: "Too informal" },
    });

    const warning = screen.getByText("Too informal");
    expect(warning).toHaveAttribute("id");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Too informal",
    );
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
    expect(getBoundText()).toBe("Test value");
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

  it("blocks a line break at the character limit", () => {
    render(TextArea, { props: { maxCount: 3, value: "abc" } });
    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.focus();
    textarea.setSelectionRange(3, 3);

    expect(
      beforeInput(textarea, null, "insertLineBreak").defaultPrevented,
    ).toBe(true);
  });

  it("does not block composition input at the character limit", () => {
    render(TextArea, { props: { maxCount: 3, value: "abc" } });
    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.focus();
    textarea.setSelectionRange(3, 3);

    expect(
      beforeInput(textarea, "d", "insertCompositionText", { isComposing: true })
        .defaultPrevented,
    ).toBe(false);
  });

  it("truncates a paste that replaces a selection at the limit", async () => {
    render(TextArea, { props: { maxCount: 5, value: "abcde" } });
    const textarea = screen.getByRole("textbox");
    assert(textarea instanceof HTMLTextAreaElement);
    textarea.focus();
    textarea.setSelectionRange(1, 3);

    const event = beforeInput(textarea, "XYZ", "insertFromPaste");
    await tick();

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toBe("aXYde");
    expect(getBoundText()).toBe("aXYde");
    expect(screen.getByText("5/5")).toBeInTheDocument();
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

  it.each([{ disabled: true }, { readonly: true }])(
    "does not mark aria-invalid for an over-limit value when %o",
    (state) => {
      render(TextArea, {
        props: { ...state, maxCount: 2, value: "abcd" },
      });

      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    },
  );

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
      await nextFrame();

      expect(textarea.style.height).toBe("120px");
    });

    it("clears the inline height when grow is turned off", async () => {
      const { rerender } = render(TextArea, { props: { grow: true } });

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 120,
      });
      await rerender({ grow: true, value: "line 1\nline 2\nline 3" });
      await tick();
      await nextFrame();
      expect(textarea.style.height).toBe("120px");

      await rerender({ grow: false });
      await tick();

      expect(textarea.style.height).toBe("");
      expect(textarea.style.overflowY).toBe("");
    });

    it("measures every growing field before any field is given its final height", async () => {
      const heightsSeenAtRead: string[][] = [];
      const fields: HTMLTextAreaElement[] = [];
      for (let i = 0; i < 3; i++) {
        render(TextArea, {
          props: { grow: true, labelText: `Field ${i}`, id: `field-${i}` },
        });
      }
      for (let i = 0; i < 3; i++) {
        const field = screen.getByLabelText(`Field ${i}`);
        assert(field instanceof HTMLTextAreaElement);
        Object.defineProperty(field, "scrollHeight", {
          configurable: true,
          get() {
            heightsSeenAtRead.push(fields.map((other) => other.style.height));
            return 80;
          },
        });
        fields.push(field);
      }

      // Skip the frame the mount already scheduled, then ask for a fresh one.
      await nextFrame();
      heightsSeenAtRead.length = 0;
      for (const field of fields) {
        fireEvent.input(field, { target: { value: "a" } });
      }
      await tick();
      await nextFrame();

      // Every field was collapsed before the first read and none was resized
      // until the last, so the reads share one layout.
      expect(heightsSeenAtRead).toHaveLength(3);
      for (const heights of heightsSeenAtRead) {
        expect(heights).toEqual(["auto", "auto", "auto"]);
      }
      expect(fields.map((field) => field.style.height)).toEqual([
        "80px",
        "80px",
        "80px",
      ]);
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
      await nextFrame();

      expect(textarea.style.height).toBe("40px");
      expect(textarea.style.overflowY).toBe("auto");
    });
  });

  describe("shared ResizeObserver", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("shares one ResizeObserver across instances", async () => {
      let created = 0;
      const Base = globalThis.ResizeObserver;
      vi.stubGlobal(
        "ResizeObserver",
        class extends Base {
          constructor(callback: ResizeObserverCallback) {
            super(callback);
            created++;
          }
        },
      );
      for (let i = 0; i < 3; i++) {
        render(TextArea, { props: { grow: true } });
      }
      await tick();
      expect(created).toBe(1);
    });

    it("re-fits the height when the observer reports a new width and stops on unmount", async () => {
      let deliver: ResizeObserverCallback = () => {};
      const observed = new Set<Element>();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: ResizeObserverCallback) {
            deliver = callback;
          }
          observe(element: Element) {
            observed.add(element);
          }
          unobserve(element: Element) {
            observed.delete(element);
          }
          disconnect() {}
        },
      );
      const { unmount } = render(TextArea, { props: { grow: true } });
      await tick();

      const textarea = screen.getByRole("textbox");
      assert(textarea instanceof HTMLTextAreaElement);
      expect(observed.has(textarea)).toBe(true);
      await nextFrame();

      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 90,
      });
      expect(textarea.style.height).not.toBe("90px");
      deliver(
        [
          { target: textarea, contentRect: { width: 300 } },
        ] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
      await nextFrame();

      expect(textarea.style.height).toBe("90px");

      unmount();
      expect(observed.size).toBe(0);
    });
  });
});
