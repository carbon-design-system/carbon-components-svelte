// @vitest-environment node
import { render } from "svelte/server";
import AccordionSsr from "./AccordionSsr.test.svelte";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(AccordionSsr, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Accordion server render", () => {
  const props = { firstId: "first", secondId: "second" };

  it("renders identical markup for explicit ids", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the heading and panel ids from each item id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<li id="first"');
    expect(html).toContain('<li id="second"');
    expect(html).toContain('id="first-button"');
    expect(html).toContain('aria-controls="first-content"');
    expect(html).toContain('id="first-content"');
    expect(html).toContain('aria-labelledby="first-button"');
    expect(html).toContain('id="second-button"');
    expect(html).toContain('aria-controls="second-content"');
    expect(html).toContain('id="second-content"');
  });
});
