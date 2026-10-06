// @vitest-environment node

import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(Disclosure, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Disclosure server render", () => {
  const props = { id: "details", summary: "Show details" };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the content id from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<div id="details"');
    expect(html).toContain('aria-controls="details-content"');
    expect(html).toContain('id="details-content"');
  });
});
