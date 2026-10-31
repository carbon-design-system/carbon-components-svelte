import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import RichTextEditor from "./RichTextEditor.test.svelte";

const editor = () => screen.getByRole("textbox", { name: "Notes" });
const toolbar = () => screen.getByRole("toolbar", { name: "Text formatting" });
const shown = () => screen.getByTestId("value").textContent;

/** Select the text of the first text node that contains `text`. */
function select(text: string) {
  const walker = document.createTreeWalker(editor(), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const index = (n as Text).data.indexOf(text);
    if (index !== -1) {
      window.getSelection()?.setBaseAndExtent(n, index, n, index + text.length);
      return;
    }
  }
  throw new Error(`no text ${text}`);
}

async function mount(
  props: Record<string, unknown> = {},
  value = "<p>Hello</p>",
) {
  const view = render(RichTextEditor, { value, fieldProps: props });
  await tick();
  return view;
}

describe("RichTextEditor", () => {
  describe("semantics", () => {
    it("is a labelled multiline textbox with a toolbar that controls it", async () => {
      await mount();

      expect(editor()).toHaveAttribute("aria-multiline", "true");
      expect(editor()).toHaveAttribute("contenteditable", "true");
      expect(toolbar()).toHaveAttribute("aria-controls", editor().id);
    });

    it("lets a consumer aria-label name the textbox over the label", async () => {
      await mount({ "aria-label": "Message body" });

      expect(
        screen.getByRole("textbox", { name: "Message body" }),
      ).toBeInTheDocument();
    });

    it("is one tab stop in the toolbar, on the first button that can act", async () => {
      await mount();

      const stops = [...toolbar().querySelectorAll("button")].filter(
        (button) => button.tabIndex === 0,
      );
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveAccessibleName(/^Heading 2/);
    });

    it("points the textbox at its helper, counter and error text", async () => {
      await mount({
        helperText: "Helper",
        maxCount: 10,
        invalid: true,
        invalidText: "Too vague",
      });

      expect(editor()).toHaveAttribute("aria-invalid", "true");
      const error = screen.getByText("Too vague");
      expect(editor().getAttribute("aria-errormessage")).toBe(error.id);
      expect(editor().getAttribute("aria-describedby")).toContain("counter-");
    });

    it("says what a read-only or disabled editor is", async () => {
      await mount({ readonly: true });
      expect(editor()).toHaveAttribute("aria-readonly", "true");
      expect(editor()).not.toHaveAttribute("contenteditable");
      expect(screen.queryByRole("toolbar")).toBeNull();
    });

    it("disables the toolbar with a disabled editor", async () => {
      await mount({ disabled: true });

      expect(editor()).toHaveAttribute("aria-disabled", "true");
      for (const button of toolbar().querySelectorAll("button")) {
        expect(button).toBeDisabled();
      }
    });
  });

  describe("value", () => {
    it("shows the sanitized value and leaves the prop as given", async () => {
      await mount({}, '<p onclick="x()">Hi <b>there</b></p><script>1</script>');

      expect(editor().innerHTML).toBe("<p>Hi <strong>there</strong></p>");
      expect(shown()).toContain("<script>");
    });

    it("shows an empty document as one empty paragraph with a placeholder", async () => {
      await mount({ placeholder: "Write" }, "");

      expect(editor().innerHTML).toBe("<p><br></p>");
      expect(screen.getByText("Write")).toBeInTheDocument();
    });

    it("renders a value set from outside", async () => {
      const { rerender } = await mount();

      await rerender({ value: "<h2>New</h2>" });
      await tick();

      expect(editor().querySelector("h2")).toHaveTextContent("New");
    });

    it("writes the HTML back and dispatches input after an edit", async () => {
      await mount();

      editor().innerHTML = "<p>Hello there</p>";
      await fireEvent.input(editor());

      expect(shown()).toBe("<p>Hello there</p>");
    });

    it("counts words and flags a count over the limit", async () => {
      await mount({ maxCount: 2, counterMode: "word" }, "<p>one two three</p>");

      expect(screen.getByText("3/2")).toBeInTheDocument();
      expect(editor()).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("toolbar", () => {
    it("bolds the selection and presses the button", async () => {
      await mount();
      select("Hello");

      await user.click(screen.getByRole("button", { name: /^Bold/ }));
      await tick();

      expect(editor().innerHTML).toBe("<p><strong>Hello</strong></p>");
      expect(shown()).toBe("<p><strong>Hello</strong></p>");
    });

    it("shows only the commands it is given", async () => {
      await mount({ toolbar: ["bold", "|", "italic"] });

      expect(
        screen.getAllByRole("button").map((b) => b.textContent?.trim()),
      ).toEqual(["Bold (Ctrl+B)", "Italic (Ctrl+I)"]);
    });

    it("has no toolbar, and no shortcuts, when given none", async () => {
      await mount({ toolbar: false });
      select("Hello");

      await fireEvent.keyDown(editor(), { key: "b", ctrlKey: true });

      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(editor().innerHTML).toBe("<p>Hello</p>");
    });

    it("renames buttons", async () => {
      await mount({ commandText: { bold: "Fett" } });

      expect(screen.getByRole("button", { name: /^Fett/ })).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("runs a shortcut and stops the browser from acting on it", async () => {
      await mount();
      select("Hello");

      const notCanceled = await fireEvent.keyDown(editor(), {
        key: "b",
        ctrlKey: true,
      });

      expect(notCanceled).toBe(false);
      expect(editor().innerHTML).toBe("<p><strong>Hello</strong></p>");
    });

    it("leaves a shortcut alone while an IME is composing", async () => {
      await mount();
      select("Hello");

      const notCanceled = await fireEvent.keyDown(editor(), {
        key: "b",
        ctrlKey: true,
        isComposing: true,
      });

      expect(notCanceled).toBe(true);
      expect(editor().innerHTML).toBe("<p>Hello</p>");
    });

    it("undoes and redoes through beforeinput", async () => {
      await mount();
      select("Hello");
      await user.click(screen.getByRole("button", { name: /^Bold/ }));
      await tick();

      await fireEvent(
        editor(),
        new InputEvent("beforeinput", {
          inputType: "historyUndo",
          bubbles: true,
          cancelable: true,
        }),
      );
      await tick();
      expect(editor().innerHTML).toBe("<p>Hello</p>");

      await fireEvent(
        editor(),
        new InputEvent("beforeinput", {
          inputType: "historyRedo",
          bubbles: true,
          cancelable: true,
        }),
      );
      await tick();
      expect(editor().innerHTML).toBe("<p><strong>Hello</strong></p>");
    });
  });

  describe("IME composition", () => {
    it("leaves its text alone and commits when the composition ends", async () => {
      await mount();
      const paragraph = editor().querySelector("p") as HTMLElement;
      const text = paragraph.firstChild as Text;

      await fireEvent.compositionStart(editor());
      text.textContent = "Hello日本";
      await fireEvent(
        editor(),
        new InputEvent("input", {
          inputType: "insertCompositionText",
          isComposing: true,
          bubbles: true,
        }),
      );
      expect(shown()).toBe("<p>Hello</p>");

      await fireEvent.compositionEnd(editor());
      expect(shown()).toBe("<p>Hello日本</p>");
    });

    it("holds a value set from outside until the composition ends", async () => {
      const { rerender } = await mount();

      await fireEvent.compositionStart(editor());
      await rerender({ value: "<p>Outside</p>" });
      await tick();
      expect(editor().textContent).toBe("Hello");

      await fireEvent.compositionEnd(editor());
      await tick();
      expect(editor().textContent).toBe("Outside");
    });
  });

  describe("paste", () => {
    it("inserts the clipboard's HTML as the schema, not as it came", async () => {
      await mount({}, "<p>ab</p>");
      const text = editor().querySelector("p")?.firstChild;
      if (text) window.getSelection()?.collapse(text, 1);

      const notCanceled = await fireEvent.paste(editor(), {
        clipboardData: {
          getData: (type: string) =>
            type === "text/html"
              ? '<span style="color:red" onclick="x()">X<script>1</script></span>'
              : "",
        },
      });

      expect(notCanceled).toBe(false);
      expect(editor().innerHTML).toBe("<p>aXb</p>");
    });

    it("dispatches a cancelable paste with the sanitized HTML first", async () => {
      const seen: { html: string; text: string }[] = [];
      render(RichTextEditor, {
        value: "<p>ab</p>",
        onPaste: (event: CustomEvent<{ html: string; text: string }>) => {
          seen.push(event.detail);
          event.preventDefault();
        },
      });
      await tick();
      const text = editor().querySelector("p")?.firstChild;
      if (text) window.getSelection()?.collapse(text, 1);

      await fireEvent.paste(editor(), {
        clipboardData: {
          getData: (type: string) =>
            type === "text/html" ? "<b onclick='x()'>X</b>" : "X",
        },
      });

      expect(seen).toEqual([{ html: "<p><strong>X</strong></p>", text: "X" }]);
      expect(editor().innerHTML).toBe("<p>ab</p>");
      expect(shown()).toBe("<p>ab</p>");
    });
  });

  describe("form", () => {
    it("submits the HTML under its name, and blocks an empty required editor", async () => {
      await mount({ name: "body", required: true }, "");
      const input = document.querySelector(
        "input[name=body]",
      ) as HTMLInputElement;

      expect(input.validity.valueMissing).toBe(true);
      const onInvalid = await fireEvent(
        input,
        new Event("invalid", { cancelable: true }),
      );
      await tick();

      // The editor shows its own message instead of the browser's bubble.
      expect(onInvalid).toBe(false);
      expect(screen.getByText("Enter some text")).toBeInTheDocument();
    });

    it("keeps a value with text valid", async () => {
      await mount({ name: "body", required: true }, "<p>Hi</p>");
      const input = document.querySelector(
        "input[name=body]",
      ) as HTMLInputElement;

      expect(input.validity.valueMissing).toBe(false);
      expect(input.value).toBe("<p>Hi</p>");
    });
  });
});
