import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { user } from "../utils/user";
import CodeEditor from "./CodeEditor.test.svelte";

const lines = (container: HTMLElement) =>
  [...container.querySelectorAll(".bx--code-editor__line")].map(
    (line) => line.textContent,
  );

function textarea() {
  const field = screen.getByLabelText("Script");
  assert(field instanceof HTMLTextAreaElement);
  return field;
}

describe("CodeEditor", () => {
  it("labels the textarea and keeps its value", () => {
    render(CodeEditor, { props: { value: "let a;", name: "code" } });

    const field = screen.getByLabelText("Script");
    expect(field).toHaveValue("let a;");
    expect(field).toHaveAttribute("name", "code");
    expect(field).toHaveAttribute("spellcheck", "false");
  });

  it("paints a line per row of code, colored by tokens", () => {
    const { container } = render(CodeEditor, {
      props: { value: "const a = 1;\n\nlet b;" },
    });

    expect(lines(container)).toEqual(["const a = 1;", "", "let b;"]);
    expect(
      container.querySelector(".bx--code-editor__line .tok-definition-keyword"),
    ).toHaveTextContent("const");
    expect(
      container.querySelector(".bx--code-editor__highlight"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("repaints the changed line when typing, and keeps the others", async () => {
    const { container } = render(CodeEditor, {
      props: { value: "const a = 1;\nlet b;" },
    });
    const [first, second] = container.querySelectorAll(
      ".bx--code-editor__line",
    );

    await user.click(textarea());
    await user.keyboard("{Control>}{Home}{/Control}x");

    expect(lines(container)).toEqual(["xconst a = 1;", "let b;"]);
    expect(container.querySelectorAll(".bx--code-editor__line")[0]).toBe(first);
    expect(container.querySelectorAll(".bx--code-editor__line")[1]).toBe(
      second,
    );
    expect(getBoundText()).toBe("xconst a = 1;\nlet b;");
  });

  it("leaves the code plain without a tokenizer", () => {
    const { container } = render(CodeEditor, {
      props: { value: "const a;", withTokenizer: false },
    });

    expect(lines(container)).toEqual(["const a;"]);
    expect(container.querySelector("[class*='tok-']")).toBeNull();
  });

  describe("Tab", () => {
    it("indents with Tab and outdents with Shift+Tab", async () => {
      render(CodeEditor, { props: { value: "a\nb" } });
      const field = textarea();

      await user.click(field);
      field.setSelectionRange(0, 3);
      await user.keyboard("{Tab}");
      expect(field).toHaveValue("  a\n  b");
      expect(getBoundText()).toBe("  a\n  b");
      await user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(field).toHaveValue("a\nb");
    });

    it("inserts a tab character with indent=tabs", async () => {
      render(CodeEditor, { props: { indent: "tabs" } });

      await user.click(textarea());
      await user.keyboard("{Tab}x");

      expect(textarea()).toHaveValue("\tx");
    });

    it("lets Escape release Tab, and typing take it back", async () => {
      render(CodeEditor, { props: { value: "a" } });
      const field = textarea();

      await user.click(field);
      await user.keyboard("{Escape}");
      expect(screen.getByText("Tab now moves focus.")).toBeInTheDocument();
      await user.keyboard("{Tab}");
      expect(field).not.toHaveFocus();
      expect(screen.getByRole("button", { name: "Reset" })).toHaveFocus();
      expect(field).toHaveValue("a");

      await user.click(field);
      await user.keyboard("{Escape}x{Tab}");
      expect(field).toHaveFocus();
      expect(field).toHaveValue("ax  ");
    });

    it("lets Tab move focus when indentWithTab is false", async () => {
      render(CodeEditor, { props: { indentWithTab: false } });

      await user.click(textarea());
      await user.keyboard("{Tab}");

      expect(screen.getByRole("button", { name: "Reset" })).toHaveFocus();
      expect(textarea()).toHaveValue("");
      expect(textarea()).not.toHaveAccessibleDescription(/Escape/);
    });

    it("lets Tab move focus out of a read-only editor", async () => {
      render(CodeEditor, { props: { value: "a", readonly: true } });

      await user.click(textarea());
      await user.keyboard("{Tab}");

      expect(screen.getByRole("button", { name: "Reset" })).toHaveFocus();
    });

    it("describes how to leave the editor", () => {
      render(CodeEditor, { props: { helperText: "Plain JS" } });

      expect(textarea()).toHaveAccessibleDescription(
        "Plain JS Press Escape, then Tab, to move focus out.",
      );
    });

    it("ignores Tab during an IME composition", () => {
      render(CodeEditor, { props: { value: "a" } });
      const field = textarea();
      field.focus();

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      });
      field.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("Enter", () => {
    it("keeps the indent and opens a block between brackets", async () => {
      render(CodeEditor, { props: { value: "  if (a) {}" } });
      const field = textarea();

      await user.click(field);
      field.setSelectionRange(10, 10);
      await user.keyboard("{Enter}");

      expect(field).toHaveValue("  if (a) {\n    \n  }");
      expect(field.selectionStart).toBe(15);
    });
  });

  describe("autoClose", () => {
    it("pairs brackets, steps over the closer and removes an empty pair", async () => {
      render(CodeEditor, { props: { autoClose: true } });
      const field = textarea();

      await user.click(field);
      await user.keyboard("f(");
      expect(field).toHaveValue("f()");
      await user.keyboard(")");
      expect(field).toHaveValue("f()");
      expect(field.selectionStart).toBe(3);
      await user.keyboard("{Backspace}{Backspace}");
      expect(field).toHaveValue("f");
    });

    it("types brackets as they are by default", async () => {
      render(CodeEditor);

      await user.click(textarea());
      await user.keyboard("(");

      expect(textarea()).toHaveValue("(");
    });
  });

  describe("states", () => {
    it("marks an invalid editor and points at its message", () => {
      render(CodeEditor, {
        props: { invalid: true, invalidText: "Not JSON" },
      });

      expect(textarea()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("Not JSON");
      expect(
        document.querySelector(".bx--code-editor__wrapper"),
      ).toHaveAttribute("data-invalid", "true");
    });

    it("does not edit when read-only", async () => {
      render(CodeEditor, { props: { value: "a", readonly: true } });

      await user.type(textarea(), "xyz");

      expect(textarea()).toHaveValue("a");
    });
  });

  describe("form", () => {
    it("follows a programmatic value without losing the layer", async () => {
      const { container, rerender } = render(CodeEditor, {
        props: { value: "a" },
      });

      await rerender({ value: "let x;\nlet y;" });

      expect(textarea()).toHaveValue("let x;\nlet y;");
      expect(lines(container)).toEqual(["let x;", "let y;"]);
    });

    it("repaints the layer when a form reset clears the field", async () => {
      const { container } = render(CodeEditor, { props: { value: "let a;" } });

      await fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      await flushFormReset();

      expect(textarea()).toHaveValue("");
      expect(getBoundText()).toBe("");
      expect(lines(container)).toEqual([""]);
    });
  });
});
