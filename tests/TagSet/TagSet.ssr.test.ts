// @vitest-environment node
import { renderRaw, renderSSR } from "../utils/ssr";
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

  const root = (multiline = false) =>
    renderSSR(TagSetSsr, { multiline }).document.querySelector(".bx--tag-set");

  it("clips a one-line set until it measures", () => {
    expect(root()).toHaveClass("bx--tag-set--unmeasured");
  });

  it("lets a multiline set wrap", () => {
    expect(root(true)).not.toHaveClass("bx--tag-set--unmeasured");
  });
});
