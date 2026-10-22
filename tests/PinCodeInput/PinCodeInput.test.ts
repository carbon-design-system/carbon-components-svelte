import { fireEvent, render, screen } from "@testing-library/svelte";
import PinCodeInputSkeletonComponent from "carbon-components-svelte/PinCodeInput/PinCodeInputSkeleton.svelte";
import { tick } from "svelte";
import { clickToFocus } from "../utils/click-to-focus";
import { user } from "../utils/user";
import { getPinCodeInputs as getInputs } from "./helpers";
import PinCodeInputSkeleton from "./PinCodeInput.skeleton.test.svelte";
import PinCodeInput from "./PinCodeInput.test.svelte";

const getFieldset = (container: HTMLElement) =>
  container.querySelector(".bx--pin-code-input__fieldset");

const getFieldsWrapper = (container: HTMLElement) =>
  container.querySelector(".bx--pin-code-input__fields");

const getRequirement = (container: HTMLElement) =>
  container.querySelector(".bx--form-requirement");

describe("PinCodeInput", () => {
  it("renders `count` segments by default", () => {
    render(PinCodeInput);
    expect(getInputs()).toHaveLength(4);
    for (const input of getInputs()) {
      expect(input).not.toHaveAttribute("placeholder");
    }
  });

  it("renders a custom number of segments", () => {
    render(PinCodeInput, { props: { count: 6 } });
    expect(getInputs()).toHaveLength(6);
  });

  describe("groups", () => {
    const getSeparators = (container: HTMLElement) =>
      container.querySelectorAll(".bx--pin-code-input__group-separator");

    it("renders decorative separators between valid groups", () => {
      const { container } = render(PinCodeInput, {
        props: { count: 6, groups: [3, 3] },
      });

      expect(getInputs()).toHaveLength(6);
      expect(getSeparators(container)).toHaveLength(1);
      expect(getSeparators(container)[0]).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(getSeparators(container)[0]).toHaveTextContent("–");
    });

    it("renders a separator between each adjacent group", () => {
      const { container } = render(PinCodeInput, {
        props: { count: 6, groups: [2, 2, 2] },
      });

      expect(getSeparators(container)).toHaveLength(2);
    });

    it("ignores groups that do not sum to count", () => {
      const { container } = render(PinCodeInput, {
        props: { count: 6, groups: [2, 2] },
      });

      expect(getInputs()).toHaveLength(6);
      expect(getSeparators(container)).toHaveLength(0);
    });

    it("ignores groups with non-positive sizes", () => {
      const { container } = render(PinCodeInput, {
        props: { count: 4, groups: [0, 4] },
      });

      expect(getSeparators(container)).toHaveLength(0);
    });

    it("keeps arrow navigation contiguous across separators", async () => {
      render(PinCodeInput, { props: { count: 6, groups: [3, 3] } });
      const inputs = getInputs();

      inputs[2].focus();
      await user.keyboard("{ArrowRight}");
      expect(inputs[3]).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(inputs[2]).toHaveFocus();
    });

    it("auto-advances focus across a group boundary", async () => {
      render(PinCodeInput, { props: { count: 6, groups: [3, 3] } });
      const inputs = getInputs();

      inputs[2].focus();
      await user.keyboard("1");
      expect(inputs[3]).toHaveFocus();
    });

    it("distributes a pasted code across grouped segments", async () => {
      const { component } = render(PinCodeInput, {
        props: { count: 6, groups: [3, 3] },
      });
      const inputs = getInputs();

      inputs[0].focus();
      await fireEvent.paste(inputs[0], {
        clipboardData: { getData: () => "123456" },
      });
      await tick();

      expect(component.value).toBe("123456");
      expect(inputs.map((input) => input.value)).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
      ]);
      expect(inputs[5]).toHaveFocus();
    });

    it("fills a partial paste from the focused segment across groups", async () => {
      const { component } = render(PinCodeInput, {
        props: { count: 6, groups: [3, 3] },
      });
      const inputs = getInputs();

      inputs[2].focus();
      await fireEvent.paste(inputs[2], {
        clipboardData: { getData: () => "789" },
      });
      await tick();

      expect(inputs.map((input) => input.value)).toEqual([
        "",
        "",
        "7",
        "8",
        "9",
        "",
      ]);
      expect(component.value).toBe("789");
      // First empty segment receives focus after paste.
      expect(inputs[0]).toHaveFocus();
    });
  });

  it("applies the extra-small size to each field", () => {
    render(PinCodeInput, { props: { size: "xs" } });
    for (const input of getInputs()) {
      expect(input).toHaveClass("bx--text-input--xs");
    }
  });

  it("auto-advances focus on input", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1");
    expect(inputs[1]).toHaveFocus();

    await user.keyboard("2");
    expect(inputs[2]).toHaveFocus();
  });

  describe("typing into a filled segment", () => {
    it("replaces the character after a click", async () => {
      const { component } = render(PinCodeInput, { props: { value: "1234" } });
      const inputs = getInputs();

      await user.click(inputs[2]);
      await user.keyboard("9");
      await tick();

      expect(component.code).toEqual(["1", "2", "9", "4"]);
      expect(inputs[2].value).toBe("9");
      expect(inputs[3]).toHaveFocus();
    });

    it("replaces the character after moving back with ArrowLeft", async () => {
      const { component } = render(PinCodeInput);
      const inputs = getInputs();

      inputs[0].focus();
      await user.keyboard("12{ArrowLeft}7");
      await tick();

      expect(component.code).toEqual(["1", "7", "", ""]);
      expect(inputs[2]).toHaveFocus();
    });

    it("keeps the old character when the new one is invalid", async () => {
      const { component } = render(PinCodeInput, { props: { value: "1234" } });
      const inputs = getInputs();

      await user.click(inputs[0]);
      await user.keyboard("x");
      await tick();

      expect(component.code).toEqual(["1", "2", "3", "4"]);
      expect(inputs[0].value).toBe("1");
      expect(inputs[0]).toHaveFocus();
    });

    it("dispatches one change per overwrite", async () => {
      const onChange = vi.fn();
      render(PinCodeInput, { props: { value: "1234", onChange } });
      const inputs = getInputs();

      await user.click(inputs[2]);
      onChange.mockClear();
      await user.keyboard("9");
      await tick();

      expect(onChange.mock.calls).toEqual([
        [{ value: "1294", code: ["1", "2", "9", "4"] }],
      ]);
    });

    it("does not overwrite when read-only", async () => {
      const { component } = render(PinCodeInput, {
        props: { readonly: true, value: "1234" },
      });
      const inputs = getInputs();

      await user.click(inputs[1]);
      await user.keyboard("9");
      await tick();

      expect(component.code).toEqual(["1", "2", "3", "4"]);
    });
  });

  it("rejects characters that do not match the numeric type", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    expect(inputs[0].value).toBe("");

    await user.keyboard("7");
    expect(inputs[0].value).toBe("7");
  });

  it("allows letters when type is alphanumeric", async () => {
    render(PinCodeInput, { props: { type: "alphanumeric" } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    expect(inputs[0].value).toBe("a");
  });

  describe("segment labels", () => {
    it("labels numeric segments as digits", () => {
      render(PinCodeInput);
      expect(
        screen.getByLabelText("Verification code digit 1 of 4"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Verification code digit 4 of 4"),
      ).toBeInTheDocument();
    });

    it("labels alphanumeric segments as characters", () => {
      render(PinCodeInput, { props: { type: "alphanumeric" } });
      expect(
        screen.getByLabelText("Verification code character 1 of 4"),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/digit/)).toBeNull();
    });

    it("falls back to a default label when labelText is empty", () => {
      render(PinCodeInput, { props: { labelText: "" } });
      expect(
        screen.getByLabelText("Pin code digit 1 of 4"),
      ).toBeInTheDocument();
    });

    it("includes the segment count", () => {
      render(PinCodeInput, { props: { type: "alphanumeric", count: 6 } });
      expect(
        screen.getByLabelText("Verification code character 6 of 6"),
      ).toBeInTheDocument();
    });

    it("uses a custom segmentLabelText", () => {
      render(PinCodeInput, {
        props: {
          segmentLabelText: (position: number, count: number) =>
            `Dígito ${position} de ${count}`,
        },
      });
      const inputs = getInputs();
      expect(inputs[0]).toHaveAttribute("aria-label", "Dígito 1 de 4");
      expect(inputs[3]).toHaveAttribute("aria-label", "Dígito 4 de 4");
    });

    it("passes the label text and type to segmentLabelText", () => {
      const segmentLabelText = vi.fn(() => "x");
      render(PinCodeInput, {
        props: {
          segmentLabelText,
          labelText: "Código",
          type: "alphanumeric",
          count: 2,
        },
      });
      expect(segmentLabelText).toHaveBeenCalledWith(
        1,
        2,
        "Código",
        "alphanumeric",
      );
      expect(segmentLabelText).toHaveBeenCalledWith(
        2,
        2,
        "Código",
        "alphanumeric",
      );
    });

    it("updates the default label when labelText changes", async () => {
      const { component } = render(PinCodeInput);
      component.labelText = "Invite code";
      await tick();
      expect(
        screen.getByLabelText("Invite code digit 1 of 4"),
      ).toBeInTheDocument();
    });
  });

  it("accepts and rejects characters against a custom pattern", async () => {
    render(PinCodeInput, { props: { pattern: /^[0-9a-fA-F]$/ } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("g");
    expect(inputs[0].value).toBe("");

    await user.keyboard("a");
    expect(inputs[0].value).toBe("a");

    await user.keyboard("F");
    expect(inputs[1].value).toBe("F");

    await user.keyboard("9");
    expect(inputs[2].value).toBe("9");
  });

  it("compiles a string pattern for per-character validation", async () => {
    render(PinCodeInput, { props: { pattern: "^[a-zA-Z]$" } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1");
    expect(inputs[0].value).toBe("");

    await user.keyboard("b");
    expect(inputs[0].value).toBe("b");
  });

  describe("inputmode", () => {
    it("shows a numeric keypad by default", () => {
      render(PinCodeInput);
      for (const input of getInputs()) {
        expect(input).toHaveAttribute("inputmode", "numeric");
      }
    });

    it("keeps the type's keypad when pattern is set", () => {
      render(PinCodeInput, { props: { pattern: /^[0-9a-fA-F]$/ } });
      for (const input of getInputs()) {
        expect(input).toHaveAttribute("inputmode", "numeric");
      }
    });

    it("shows a text keyboard for an alphanumeric type with a pattern", () => {
      render(PinCodeInput, {
        props: { pattern: /^[0-9a-fA-F]$/, type: "alphanumeric" },
      });
      for (const input of getInputs()) {
        expect(input).toHaveAttribute("inputmode", "text");
      }
    });
  });

  it("filters pasted characters with a custom pattern", async () => {
    const { component } = render(PinCodeInput, {
      props: { pattern: /^[0-9a-fA-F]$/ },
    });
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "A1gB2z" },
    });
    await tick();

    expect(component.value).toBe("A1B2");
    expect(inputs.map((input) => input.value)).toEqual(["A", "1", "B", "2"]);
  });

  it("moves focus back and clears on backspace when empty", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("12");
    expect(inputs[2]).toHaveFocus();

    // inputs[2] is empty -> backspace moves to and clears inputs[1]
    await user.keyboard("{Backspace}");
    expect(inputs[1]).toHaveFocus();
    expect(inputs[1].value).toBe("");
  });

  describe("Delete", () => {
    it("does not dispatch change on an empty segment", async () => {
      const onChange = vi.fn();
      render(PinCodeInput, { props: { onChange } });
      const inputs = getInputs();

      inputs[1].focus();
      await user.keyboard("{Delete}");
      await tick();

      expect(onChange).not.toHaveBeenCalled();
      expect(inputs[1]).toHaveFocus();
    });

    it("clears a filled segment with one change", async () => {
      const onChange = vi.fn();
      render(PinCodeInput, { props: { value: "1234", onChange } });
      const inputs = getInputs();

      inputs[1].focus();
      await user.keyboard("{Delete}");
      await tick();

      expect(onChange.mock.calls).toEqual([
        [{ value: "134", code: ["1", "", "3", "4"] }],
      ]);
    });

    it("does not dispatch change when read-only", async () => {
      const onChange = vi.fn();
      render(PinCodeInput, {
        props: { readonly: true, value: "1234", onChange },
      });
      const inputs = getInputs();

      inputs[1].focus();
      await user.keyboard("{Delete}");
      await tick();

      expect(onChange).not.toHaveBeenCalled();
      expect(inputs[1].value).toBe("2");
    });
  });

  it("binds the assembled value and code", async () => {
    const { component } = render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("123");
    await tick();

    expect(component.value).toBe("123");
    expect(component.code).toEqual(["1", "2", "3", ""]);
  });

  it("renders a hidden input for native form participation when name is set", async () => {
    const { container } = render(PinCodeInput, {
      props: { name: "otp", value: "12" },
    });
    const fieldset = getFieldset(container);
    const hidden = fieldset?.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );

    expect(hidden).not.toBeNull();
    expect(hidden).toHaveAttribute("name", "otp");
    expect(hidden?.value).toBe("12");

    const inputs = getInputs();
    inputs[2].focus();
    await user.keyboard("34");
    await tick();

    expect(hidden?.value).toBe("1234");
  });

  it("does not render a hidden input when name is omitted", () => {
    const { container } = render(PinCodeInput);
    const fieldset = getFieldset(container);

    expect(fieldset?.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("keeps required on the segments when name is set", () => {
    const { container } = render(PinCodeInput, {
      props: { name: "otp", required: true },
    });
    const hidden = getFieldset(container)?.querySelector(
      'input[type="hidden"]',
    );

    expect(hidden).not.toHaveAttribute("required");
    for (const input of getInputs()) {
      expect(input).toBeRequired();
    }
  });

  it("dispatches complete and change events", async () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(PinCodeInput, { props: { onChange, onComplete } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1234");
    await tick();

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ value: "1234" }),
    );
  });

  it("does not dispatch complete on initial render with a seeded value", () => {
    const onComplete = vi.fn();
    render(PinCodeInput, { props: { value: "1234", onComplete } });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("distributes a full pasted code across all segments", async () => {
    const onPaste = vi.fn();
    const { component } = render(PinCodeInput, { props: { onPaste } });
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "4321" },
    });
    await tick();

    expect(component.value).toBe("4321");
    expect(inputs[3]).toHaveFocus();
    expect(onPaste).toHaveBeenCalledWith(
      expect.objectContaining({ value: "4321" }),
    );
  });

  it("distributes multi-char autofill input across all segments", async () => {
    const onPaste = vi.fn();
    const onComplete = vi.fn();
    const { component } = render(PinCodeInput, {
      props: { onPaste, onComplete },
    });
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.input(inputs[0], { target: { value: "1234" } });
    await tick();

    expect(component.value).toBe("1234");
    expect(component.code).toEqual(["1", "2", "3", "4"]);
    expect(inputs[3]).toHaveFocus();
    expect(onPaste).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ value: "1234" }),
    );
  });

  it("does not dispatch paste when the clipboard has no valid characters", async () => {
    const onPaste = vi.fn();
    render(PinCodeInput, { props: { onPaste } });
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "abcd" },
    });
    await tick();

    expect(onPaste).not.toHaveBeenCalled();
  });

  it("dispatches paste with whitespace stripped from the clipboard value", async () => {
    const onPaste = vi.fn();
    render(PinCodeInput, { props: { onPaste } });
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "43 21" },
    });
    await tick();

    expect(onPaste).toHaveBeenCalledWith(
      expect.objectContaining({ value: "4321" }),
    );
  });

  it("dispatches complete again after a segment is emptied and refilled", async () => {
    const onComplete = vi.fn();
    render(PinCodeInput, { props: { onComplete } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1234");
    await tick();
    expect(onComplete).toHaveBeenCalledOnce();

    await user.keyboard("{Delete}");
    await tick();
    expect(onComplete).toHaveBeenCalledOnce();

    await user.keyboard("9");
    await tick();
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "1239" }),
    );
  });

  describe("clear", () => {
    it.each(["Backspace", "Delete"])(
      "dispatches once when %s empties the last filled segment",
      async (key) => {
        const onClear = vi.fn();
        render(PinCodeInput, { props: { value: "12", onClear } });
        const inputs = getInputs();

        inputs[1].focus();
        await user.keyboard(`{${key}}`);
        await tick();
        expect(onClear).not.toHaveBeenCalled();

        inputs[0].focus();
        await user.keyboard(`{${key}}`);
        await tick();
        expect(onClear).toHaveBeenCalledOnce();
      },
    );

    it("does not dispatch again on a further empty edit", async () => {
      const onClear = vi.fn();
      render(PinCodeInput, { props: { value: "1", onClear } });
      const inputs = getInputs();

      inputs[0].focus();
      await user.keyboard("{Delete}");
      await tick();
      expect(onClear).toHaveBeenCalledOnce();

      // Backspace on an empty segment re-clears the previous (empty) one.
      inputs[1].focus();
      await user.keyboard("{Backspace}");
      await tick();
      expect(onClear).toHaveBeenCalledOnce();
    });
  });

  describe("paste", () => {
    it("fills from the focused segment on a partial paste", async () => {
      const onPaste = vi.fn();
      const { component } = render(PinCodeInput, {
        props: { value: "1234", onPaste },
      });
      const inputs = getInputs();

      inputs[2].focus();
      await fireEvent.paste(inputs[2], {
        clipboardData: { getData: () => "56" },
      });
      await tick();

      expect(component.code).toEqual(["1", "2", "5", "6"]);
      expect(onPaste).toHaveBeenCalledWith(
        expect.objectContaining({ value: "56" }),
      );
    });

    it("truncates an over-length paste at `count`", async () => {
      const onChange = vi.fn();
      const { component } = render(PinCodeInput, { props: { onChange } });
      const inputs = getInputs();

      inputs[0].focus();
      await fireEvent.paste(inputs[0], {
        clipboardData: { getData: () => "123456" },
      });
      await tick();

      expect(component.code).toEqual(["1", "2", "3", "4"]);
      expect(onChange.mock.calls).toEqual([
        [{ value: "1234", code: ["1", "2", "3", "4"] }],
      ]);
    });

    it("does nothing when read-only", async () => {
      const onPaste = vi.fn();
      const onChange = vi.fn();
      const { component } = render(PinCodeInput, {
        props: { readonly: true, value: "12", onPaste, onChange },
      });
      const inputs = getInputs();

      await fireEvent.paste(inputs[2], {
        clipboardData: { getData: () => "34" },
      });
      await tick();

      expect(component.code).toEqual(["1", "2", "", ""]);
      expect(onPaste).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("arrow keys", () => {
    it("moves focus forward with ArrowRight", async () => {
      render(PinCodeInput);
      const inputs = getInputs();

      inputs[0].focus();
      await user.keyboard("{ArrowRight}");
      expect(inputs[1]).toHaveFocus();
    });

    it("keeps focus on ArrowLeft in the first segment", async () => {
      render(PinCodeInput);
      const inputs = getInputs();

      inputs[0].focus();
      // Not prevented, so the caret still moves natively.
      expect(await fireEvent.keyDown(inputs[0], { key: "ArrowLeft" })).toBe(
        true,
      );
      expect(inputs[0]).toHaveFocus();
    });

    it("keeps focus on ArrowRight in the last segment", async () => {
      render(PinCodeInput);
      const inputs = getInputs();

      inputs[3].focus();
      expect(await fireEvent.keyDown(inputs[3], { key: "ArrowRight" })).toBe(
        true,
      );
      expect(inputs[3]).toHaveFocus();
    });
  });

  it("masks the segments when mask is true", () => {
    render(PinCodeInput, { props: { mask: true } });
    const inputs = getInputs();
    // Masking is applied with CSS (revealed on focus via `:not(:focus)`),
    // so the segments stay text inputs rather than switching to password.
    expect(inputs).toHaveLength(4);
    for (const input of inputs) {
      expect(input).toHaveClass("bx--pin-code-input__field--masked");
    }
  });

  it("does not mask the segments by default", () => {
    render(PinCodeInput);
    for (const input of getInputs()) {
      expect(input).not.toHaveClass("bx--pin-code-input__field--masked");
    }
  });

  it("displays uppercase but retains the original value", async () => {
    const { component } = render(PinCodeInput, {
      props: { type: "alphanumeric", uppercase: true },
    });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    await tick();

    expect(component.value).toBe("a");
    expect(inputs[0]).toHaveClass("bx--pin-code-input__field--uppercase");
  });

  it("focuses the first empty segment when the label is clicked", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    await fireEvent.click(screen.getByText("Verification code"));
    expect(inputs[0]).toHaveFocus();
  });

  // Tab already lands in the segments; the legend isn't a stop of its own.
  it("leaves the legend out of the tab order", async () => {
    render(PinCodeInput);
    const legend = screen.getByText("Verification code");

    expect(legend).not.toHaveAttribute("tabindex");
    await user.tab();
    expect(getInputs()[0]).toHaveFocus();
  });

  it("exposes OTP-friendly input attributes on every segment", () => {
    render(PinCodeInput);
    getInputs().forEach((input, index) => {
      expect(input).toHaveAttribute("spellcheck", "false");
      expect(input).toHaveAttribute("autocorrect", "off");
      expect(input).toHaveAttribute("autocapitalize", "off");
      expect(input).toHaveAttribute(
        "autocomplete",
        index === 0 ? "one-time-code" : "off",
      );
    });
  });

  it("selects a segment's value on focus when selectTextOnFocus is true", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInput, {
      props: { selectTextOnFocus: true, value: "0182" },
    });
    const inputs = getInputs();

    inputs[2].focus();
    await tick();

    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });

  it("keeps the selected value through the click's mouseup", async () => {
    render(PinCodeInput, {
      props: { selectTextOnFocus: true, value: "0182" },
    });

    const mouseup = await clickToFocus(getInputs()[2]);
    expect(mouseup.defaultPrevented).toBe(true);
  });

  describe("invalid and warning states", () => {
    it("renders the invalid state with visible requirement text after the fields wrapper", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-invalid",
          invalid: true,
          invalidText: "Incorrect code",
        },
      });
      const fields = getFieldsWrapper(container);
      const message = screen.getByText("Incorrect code");
      const inputs = getInputs();

      expect(fields).toHaveAttribute("data-invalid", "true");
      expect(fields).toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields?.nextElementSibling).toBe(message);
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "error-pin-invalid");
      expect(message).toHaveAttribute("role", "alert");
      expect(message).toBeVisible();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).toBeInTheDocument();

      for (const input of inputs) {
        expect(input).toHaveClass("bx--text-input--invalid");
        expect(input).toHaveAttribute("data-invalid", "true");
        expect(input).toHaveAttribute("aria-invalid", "true");
      }

      expect(getFieldset(container)).not.toHaveAttribute("aria-describedby");
      for (const input of inputs) {
        expect(input).not.toHaveAttribute("aria-describedby");
        expect(input).toHaveAttribute("aria-errormessage", "error-pin-invalid");
      }
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    it("renders the warning state with visible requirement text after the fields wrapper", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-warn",
          warn: true,
          warnText: "Code expiring soon",
        },
      });
      const fields = getFieldsWrapper(container);
      const message = screen.getByText("Code expiring soon");
      const inputs = getInputs();

      expect(fields).toHaveAttribute("data-warn", "true");
      expect(fields).toHaveClass("bx--pin-code-input__fields--warning");
      expect(fields?.nextElementSibling).toBe(message);
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "warn-pin-warn");
      expect(message).toBeVisible();
      expect(
        container.querySelector(".bx--pin-code-input__icon--warning"),
      ).toBeInTheDocument();

      for (const input of inputs) {
        expect(input).toHaveClass("bx--text-input--warning");
        expect(input).toHaveAttribute("data-warn", "true");
        expect(input).not.toHaveAttribute("aria-invalid");
      }

      expect(getFieldset(container)).toHaveAttribute(
        "aria-describedby",
        "warn-pin-warn",
      );
      expect(
        container.querySelector(".bx--pin-code-input__icon--warning"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    it("prefers invalid over warning when both props are set", () => {
      const { container } = render(PinCodeInput, {
        props: {
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
        },
      });

      expect(screen.getByText("Incorrect code")).toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getFieldsWrapper(container)).toHaveAttribute(
        "data-invalid",
        "true",
      );
      expect(getFieldsWrapper(container)).not.toHaveAttribute("data-warn");
    });

    it("suppresses invalid and warning UI when disabled", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-disabled",
          disabled: true,
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
          helperText: "Enter the code sent to your device",
        },
      });
      const fields = getFieldsWrapper(container);
      const inputs = getInputs();

      expect(screen.queryByText("Incorrect code")).not.toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getRequirement(container)).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).not.toBeInTheDocument();
      expect(fields).not.toHaveAttribute("data-invalid");
      expect(fields).not.toHaveAttribute("data-warn");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--warning");

      for (const input of inputs) {
        expect(input).toBeDisabled();
        expect(input).not.toHaveClass("bx--text-input--invalid");
        expect(input).not.toHaveClass("bx--text-input--warning");
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("data-invalid");
        expect(input).not.toHaveAttribute("data-warn");
      }

      expect(getFieldset(container)).toHaveAttribute(
        "aria-describedby",
        "helper-pin-disabled",
      );

      expect(
        screen.getByText("Enter the code sent to your device"),
      ).toBeInTheDocument();
    });

    it("suppresses invalid and warning UI when read-only", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-readonly",
          readonly: true,
          value: "0182",
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
        },
      });
      const fields = getFieldsWrapper(container);
      const inputs = getInputs();

      expect(screen.queryByText("Incorrect code")).not.toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getRequirement(container)).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).not.toBeInTheDocument();
      expect(fields).not.toHaveAttribute("data-invalid");
      expect(fields).not.toHaveAttribute("data-warn");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--warning");

      for (const input of inputs) {
        expect(input).toHaveAttribute("readonly");
        expect(input).toHaveAttribute("aria-readonly", "true");
        expect(input).not.toHaveClass("bx--text-input--invalid");
        expect(input).not.toHaveClass("bx--text-input--warning");
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("data-invalid");
        expect(input).not.toHaveAttribute("data-warn");
        expect(input).not.toHaveAttribute("aria-describedby");
      }

      expect(getFieldset(container)).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("fluid variant", () => {
    it("uses the fluid default placeholder", () => {
      render(PinCodeInput, { props: { fluid: true } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "–");
      }
    });

    it("allows placeholder override in the fluid variant", () => {
      render(PinCodeInput, { props: { fluid: true, placeholder: "•" } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "•");
      }
    });

    it("allows placeholder override in the non-fluid variant", () => {
      render(PinCodeInput, { props: { placeholder: "0" } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "0");
      }
    });

    it("renders the error message inside the fields wrapper", () => {
      render(PinCodeInput, {
        props: {
          fluid: true,
          invalid: true,
          invalidText: "Incorrect code",
          id: "pin-fluid-invalid",
        },
      });

      const message = screen.getByText("Incorrect code");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "error-pin-fluid-invalid");
      expect(message.closest(".bx--pin-code-input__fields")).not.toBeNull();
      expect(message.closest(".bx--pin-code-input__message")).not.toBeNull();
      expect(
        message
          .closest(".bx--pin-code-input__message")
          ?.querySelector(".bx--pin-code-input__icon"),
      ).toBeInTheDocument();
      expect(message).toHaveAttribute("role", "alert");
      expect(getFieldset(document.body)).not.toHaveAttribute(
        "aria-describedby",
      );
      for (const input of getInputs()) {
        expect(input).toHaveAttribute(
          "aria-errormessage",
          "error-pin-fluid-invalid",
        );
      }
    });

    it("renders the warning message inside the fields wrapper", () => {
      render(PinCodeInput, {
        props: {
          fluid: true,
          warn: true,
          warnText: "Code expiring soon",
          id: "pin-fluid-warn",
        },
      });

      const message = screen.getByText("Code expiring soon");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "warn-pin-fluid-warn");
      expect(message.closest(".bx--pin-code-input__fields")).not.toBeNull();
    });
  });

  it("renders skeleton state", () => {
    render(PinCodeInputSkeleton);

    const skeleton = screen.getByTestId("pin-code-input-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--form-item");
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--pin-code-input__segments");
    // One segment per digit, as many as PinCodeInput's default `count`.
    expect(skeleton.children[1].children).toHaveLength(4);
    for (const segment of skeleton.children[1].children) {
      expect(segment).toHaveClass("bx--skeleton", "bx--pin-code-input__field");
    }
  });

  it("draws a segment per count at the skeleton's size", () => {
    const { container } = render(PinCodeInputSkeletonComponent, {
      props: { count: 6, size: "sm" },
    });

    const segments = container.querySelectorAll(".bx--pin-code-input__field");
    expect(segments).toHaveLength(6);
    expect(segments[0]).toHaveClass("bx--text-input--sm");
  });

  it("hides the skeleton label when hideLabel is true", () => {
    render(PinCodeInputSkeleton, { props: { hideLabel: true } });

    const skeleton = screen.getByTestId("pin-code-input-skeleton");
    expect(skeleton.children).toHaveLength(1);
    expect(skeleton.children[0]).toHaveClass("bx--pin-code-input__segments");
  });
});
