// @vitest-environment node
import { render } from "svelte/server";
import RichTextEditorSsr from "./RichTextEditorSsr.test.svelte";

describe("RichTextEditor server render", () => {
  const html = render(RichTextEditorSsr).body;

  it("renders the sanitized document in the textbox", () => {
    expect(html).toContain('role="textbox"');
    expect(html).toContain(
      "<p>Hello <strong>world</strong></p><ul><li>one</li></ul>",
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
  });

  it("waits for the browser before it is editable", () => {
    expect(html).not.toContain("contenteditable");
  });

  it("renders the label, toolbar and submitted value", () => {
    expect(html).toContain('id="label-notes"');
    expect(html).toContain('aria-labelledby="label-notes"');
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Text formatting"');
    expect(html).toContain(
      'name="notes" value="&lt;p>Hello &lt;strong>world&lt;/strong>&lt;/p>&lt;ul>&lt;li>one&lt;/li>&lt;/ul>"',
    );
  });

  it("shows the placeholder when empty", () => {
    expect(render(RichTextEditorSsr, { props: { value: "" } }).body).toContain(
      "Write something",
    );
  });
});
