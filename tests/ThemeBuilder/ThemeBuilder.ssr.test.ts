// @vitest-environment node
import ThemeBuilder from "carbon-components-svelte/ThemeBuilder/ThemeBuilder.svelte";
import { render } from "svelte/server";

describe("ThemeBuilder server render", () => {
  it("renders the editor, the scoped preview, and the contrast summary", () => {
    const html = render(ThemeBuilder, {
      props: { base: "g100", tokens: { "button-primary": "#8a3ffc" } },
    }).body;

    expect(html).toContain('aria-label="Theme builder"');
    expect(html).toContain("bx--g100");
    expect(html).toMatch(/--cds-button-primary:\s*#8a3ffc/);
    expect(html).toContain("bx--theme-builder__summary");
    expect(html).toContain("No new contrast failures");
    // The first group renders without script.
    expect(html).toContain("button-primary-hover");
  });

  it("keeps an unsafe value out of the markup", () => {
    const html = render(ThemeBuilder, {
      props: { tokens: { "layer-01": "#fff; background: url(//evil)" } },
    }).body;
    expect(html).not.toContain("evil");
  });
});
