import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Mask from "./Mask.test.svelte";

const field = () => screen.getByRole("textbox") as HTMLInputElement;
const bound = () => screen.getByTestId("bound").textContent;

describe("mask action", () => {
  it("formats what is typed and updates the bound value", async () => {
    render(Mask);
    await user.type(field(), "4155550123");

    expect(field()).toHaveValue("(415) 555-0123");
    expect(bound()).toBe("(415) 555-0123");
  });

  it("works on the input itself", async () => {
    render(Mask, { props: { direct: true } });
    await user.type(screen.getByLabelText("Direct"), "415555");

    expect(screen.getByLabelText("Direct")).toHaveValue("(415) 555");
    expect(bound()).toBe("(415) 555");
  });

  it("formats the value a field starts with", async () => {
    render(Mask, { props: { value: "4155550123" } });
    await tick();

    expect(field()).toHaveValue("(415) 555-0123");
    expect(bound()).toBe("(415) 555-0123");
  });

  it("drops characters the pattern refuses", async () => {
    render(Mask);
    await user.type(field(), "4a1-b5");

    expect(field()).toHaveValue("(415");
  });

  it("lets Backspace delete the digit before a literal", async () => {
    render(Mask);
    await user.type(field(), "4155");
    expect(field()).toHaveValue("(415) 5");

    await user.keyboard("{Backspace}");
    expect(field()).toHaveValue("(415");
    await user.keyboard("{Backspace}");
    expect(field()).toHaveValue("(41");
  });

  it("deletes across a literal with the caret in the middle", async () => {
    render(Mask, { props: { value: "(415) 555-0123" } });
    await tick();
    field().focus();
    field().setSelectionRange(6, 6);

    await user.keyboard("{Backspace}");

    expect(field()).toHaveValue("(415) 550-123");
    expect(field().selectionStart).toBe(3);
  });

  it("keeps the caret among the digits when typing in the middle", async () => {
    render(Mask, { props: { value: "(415) 555" } });
    await tick();
    field().focus();
    field().setSelectionRange(2, 2);

    await user.keyboard("9");

    expect(field()).toHaveValue("(491) 555-5");
    expect(field().selectionStart).toBe(3);
  });

  it("replaces a selection and re-masks a paste", async () => {
    render(Mask, { props: { value: "(415) 555-0123" } });
    await tick();
    field().focus();
    field().setSelectionRange(0, field().value.length);

    // jsdom has no clipboard data for `user.paste`; send the event a
    // browser sends for a paste into a text field.
    field().dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertFromPaste",
        data: "212.555.0100",
        bubbles: true,
        cancelable: true,
      }),
    );
    await tick();

    expect(field()).toHaveValue("(212) 555-0100");
    expect(bound()).toBe("(212) 555-0100");
  });

  it("reports the raw value and completeness", async () => {
    const onchange = vi.fn();
    render(Mask, { props: { onchange } });
    await user.type(field(), "4155550123");

    expect(onchange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: "(415) 555-0123",
        rawValue: "4155550123",
        complete: true,
      }),
    );
    expect(onchange.mock.calls.some(([d]) => d.complete === false)).toBe(true);
  });

  it("re-masks with a new pattern", async () => {
    const { rerender } = render(Mask, { props: { value: "4155550123" } });
    await tick();

    await rerender({ pattern: "999-999-9999" });

    expect(field()).toHaveValue("415-555-0123");
  });

  it("sets inputmode and the mask marker where the field has none, and clears them", () => {
    const { unmount } = render(Mask, { props: { direct: true } });
    const input = screen.getByLabelText("Direct");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("data-ccs-mask");
    expect(input).toHaveAttribute("spellcheck", "false");
    unmount();
  });

  it("leaves a field that is read-only alone", () => {
    render(Mask, { props: { direct: true } });
    const input = screen.getByLabelText("Direct") as HTMLInputElement;
    input.readOnly = true;
    const event = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: "4",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("does nothing between compositionstart and compositionend", () => {
    render(Mask, { props: { direct: true } });
    const input = screen.getByLabelText("Direct") as HTMLInputElement;
    input.focus();
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );

    const before = new InputEvent("beforeinput", {
      inputType: "insertCompositionText",
      data: "x",
      bubbles: true,
      isComposing: true,
    });
    input.dispatchEvent(before);
    input.value = "x4";
    input.dispatchEvent(
      new InputEvent("input", {
        inputType: "insertCompositionText",
        bubbles: true,
        isComposing: true,
      }),
    );
    expect(input.value).toBe("x4");

    input.value = "415";
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    expect(input.value).toBe("(415");
  });

  it("re-masks an edit the browser made by itself (a drop or a spell-check fix)", () => {
    render(Mask, { props: { direct: true } });
    const input = screen.getByLabelText("Direct") as HTMLInputElement;
    input.focus();
    // A drop or a spell-check replacement: no beforeinput the mask maps.
    input.value = "4155x550123";
    input.setSelectionRange(5, 5);
    input.dispatchEvent(
      new InputEvent("input", { inputType: "insertFromDrop", bubbles: true }),
    );

    expect(input.value).toBe("(415) 555-0123");
  });

  it("restores the field and edits again when beforeinput cannot be canceled", async () => {
    render(Mask, { props: { direct: true, value: "(415) 555" } });
    await tick();
    const input = screen.getByLabelText("Direct") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(7, 7);

    input.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "deleteContentBackward",
        bubbles: true,
        cancelable: false,
      }),
    );
    // The browser deleted the space-and-paren it saw, not the digit.
    input.value = "(415)555";
    input.dispatchEvent(
      new InputEvent("input", {
        inputType: "deleteContentBackward",
        bubbles: true,
      }),
    );

    expect(input.value).toBe("(415) 55");
  });
});
