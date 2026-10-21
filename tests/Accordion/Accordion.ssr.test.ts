// @vitest-environment node
import { renderRaw } from "../utils/ssr";
import AccordionSsr from "./AccordionSsr.test.svelte";

describe("Accordion server render", () => {
  const props = { firstId: "first", secondId: "second" };

  it("derives the heading and panel ids from each item id", () => {
    const html = renderRaw(AccordionSsr, props);

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
