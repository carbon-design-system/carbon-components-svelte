// @vitest-environment node
import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
import { renderRaw } from "../utils/ssr";

describe("Toggletip server render", () => {
  const props = { id: "info", open: true };

  it("derives the content id from the id", () => {
    const html = renderRaw(Toggletip, props);

    expect(html).toContain('id="info"');
    expect(html).toContain('aria-controls="info-content"');
    expect(html).toContain('aria-describedby="info-content"');
    expect(html).toContain('id="info-content"');
  });
});
