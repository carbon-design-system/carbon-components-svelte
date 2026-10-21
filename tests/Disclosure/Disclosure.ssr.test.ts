// @vitest-environment node

import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";
import { renderRaw } from "../utils/ssr";

describe("Disclosure server render", () => {
  const props = { id: "details", summary: "Show details" };

  it("derives the content id from the id", () => {
    const html = renderRaw(Disclosure, props);

    expect(html).toContain('<div id="details"');
    expect(html).toContain('aria-controls="details-content"');
    expect(html).toContain('id="details-content"');
  });
});
