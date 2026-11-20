// @vitest-environment node
import { render } from "svelte/server";
import KeyValueEditorSsr from "./KeyValueEditorSsr.test.svelte";

describe("KeyValueEditor server render", () => {
  const html = render(KeyValueEditorSsr).body;

  it("renders the rows with their names and labels", () => {
    expect(html).toContain('aria-label="Row 1 of 3"');
    expect(html).toMatch(/name="env\[0\]\[key\]"[^>]*value="HOST"/);
    expect(html).toMatch(/name="env\[0\]\[value\]"[^>]*value="example.com"/);
    expect(html).toContain('<legend class="bx--label">');
  });

  it("renders the empty line for a new row, with no name", () => {
    expect(html).toContain('aria-label="Add row"');
    expect(html).not.toContain("env[3]");
  });

  it("renders a stored secret as a mask with no value field", () => {
    expect(html).toContain("••••••••");
    expect(html).toContain('name="env[1][stored]"');
    expect(html).not.toContain("env[1][value]");
  });

  it("shows no message before anyone has left a row", () => {
    expect(html).not.toContain("bx--form-requirement");
  });
});
