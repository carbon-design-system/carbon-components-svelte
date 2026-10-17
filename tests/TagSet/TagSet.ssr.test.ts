// @vitest-environment node
import { renderRaw } from "../utils/ssr";
import TagSetSsr from "./TagSetSsr.test.svelte";

describe("TagSet server render", () => {
  const props = { id: "tags", firstId: "first", secondId: "second" };

  it("renders identical markup for explicit ids", () => {
    expect(renderRaw(TagSetSsr, props)).toBe(renderRaw(TagSetSsr, props));
  });

  it("derives the overflow tooltip id from the id", () => {
    const html = renderRaw(TagSetSsr, props);

    expect(html).toContain('<div id="tags"');
    expect(html).toContain('aria-describedby="tags-overflow"');
    expect(html).toContain('id="tags-overflow"');
    expect(html).toContain('id="first"');
    expect(html).toContain('id="second"');
  });
});
