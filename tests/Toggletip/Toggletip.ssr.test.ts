// @vitest-environment node
import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(Toggletip, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Toggletip server render", () => {
  const props = { id: "info", open: true };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the content id from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('id="info"');
    expect(html).toContain('aria-controls="info-content"');
    expect(html).toContain('aria-describedby="info-content"');
    expect(html).toContain('id="info-content"');
  });
});
