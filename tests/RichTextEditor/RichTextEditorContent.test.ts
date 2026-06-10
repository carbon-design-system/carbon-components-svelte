import { fireEvent, render, screen } from "@testing-library/svelte";
import RichTextEditorContent from "./RichTextEditorContent.test.svelte";

describe("RichTextEditorContent", () => {
  it("renders an accessible multiline textbox", () => {
    render(RichTextEditorContent);

    const box = screen.getByRole("textbox", { name: "Editor" });
    expect(box).toHaveAttribute("aria-multiline", "true");
    expect(box).toHaveAttribute("contenteditable", "true");
    expect(box).toHaveAttribute("tabindex", "0");
  });

  it("renders the initial value as HTML", () => {
    render(RichTextEditorContent, { props: { value: "<p>init</p>" } });

    expect(screen.getByRole("textbox").innerHTML).toBe("<p>init</p>");
  });

  it("pushes edits to value and dispatches change", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RichTextEditorContent);

    const box = screen.getByRole("textbox");
    box.innerHTML = "<p>hello</p>";
    await fireEvent.input(box);

    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) => event === "change" && detail === "<p>hello</p>",
      ),
    ).toBe(true);
  });

  it("exposes a placeholder hook while empty", () => {
    render(RichTextEditorContent);

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "data-placeholder",
      "Write something",
    );
  });

  it("is non-editable and out of the tab order when disabled", () => {
    render(RichTextEditorContent, { props: { disabled: true } });

    const box = screen.getByRole("textbox");
    expect(box).toHaveAttribute("contenteditable", "false");
    expect(box).toHaveAttribute("tabindex", "-1");
  });

  it("does not throw when focused (selectionchange wiring)", async () => {
    render(RichTextEditorContent);

    const box = screen.getByRole("textbox");
    await fireEvent.focus(box);
    await fireEvent.blur(box);

    expect(box).toBeInTheDocument();
  });
});
