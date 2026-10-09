// @vitest-environment node
import { render } from "svelte/server";
import TagInputSsr from "./TagInputSsr.test.svelte";

describe("TagInput server render", () => {
  it("renders the tags, hidden inputs, and labelled field", () => {
    const html = render(TagInputSsr).body;

    expect(html).toContain('<label for="topics"');
    expect(html).toContain('aria-label="Remove"');
    expect(html).toMatch(/<input type="hidden" name="topics" value="a"/);
    expect(html).toMatch(/<input type="hidden" name="topics" value="b"/);
    // No roving tab stop until the set mounts.
    expect(html).not.toContain('tabindex="-1"');
  });
});
