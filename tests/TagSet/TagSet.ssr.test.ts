// @vitest-environment node
import { render } from "svelte/server";
import TagSetSsr from "./TagSetSsr.test.svelte";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(TagSetSsr, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("TagSet server render", () => {
  const props = { id: "tags", firstId: "first", secondId: "second" };

  it("renders identical markup for explicit ids", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the overflow tooltip id from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<div id="tags"');
    expect(html).toContain('aria-describedby="tags-overflow"');
    expect(html).toContain('id="tags-overflow"');
    expect(html).toContain('id="first"');
    expect(html).toContain('id="second"');
  });
});
