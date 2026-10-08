// @vitest-environment node
import {
  extractSnippets,
  fingerprint,
  literal,
} from "../../scripts/lib/release-screenshots";

const notes = [
  "### `Meter`",
  "```svelte",
  "<Meter value={1} />",
  "```",
  "<!-- screenshot: meter — a meter -->",
  "```svelte",
  "<Carousel />",
  "```",
  "<!-- video: carousel — next slide -->",
  "<!-- screenshot: orphan-name — no fence of its own -->",
].join("\r\n");

describe("extractSnippets", () => {
  it("pairs each marker with the fence before it, across CRLF", () => {
    const { snippets } = extractSnippets(notes);
    expect(snippets.get("meter")).toBe("<Meter value={1} />\n");
    expect(snippets.get("carousel")).toBe("<Carousel />\n");
  });

  it("reuses the nearest earlier fence for back-to-back markers", () => {
    const { snippets } = extractSnippets(notes);
    expect(snippets.get("orphan-name")).toBe("<Carousel />\n");
  });

  it("skips markers with no fence before them", () => {
    const { snippets, skipped } = extractSnippets(
      "<!-- screenshot: lonely — nothing above -->",
    );
    expect(snippets.size).toBe(0);
    expect(skipped).toEqual(["lonely"]);
  });
});

describe("literal", () => {
  it("round-trips as JSON", () => {
    const value = `a"b'c\\d\n</script>\u2028\u2029`;
    expect(JSON.parse(literal(value))).toBe(value);
  });

  it("escapes characters JSON.stringify leaves raw", () => {
    const out = literal("</script>\u2028\u2029");
    expect(out).not.toMatch(/[<\u2028\u2029]/);
    expect(out).toContain("\\u003c");
  });
});

describe("fingerprint", () => {
  it("is stable for equal parts", () => {
    expect(fingerprint(["lib", "<Meter />", 4])).toBe(
      fingerprint(["lib", "<Meter />", 4]),
    );
  });

  it("changes when any part changes", () => {
    const base = fingerprint(["lib", "<Meter />", 4, { width: 420 }]);
    expect(fingerprint(["lib2", "<Meter />", 4, { width: 420 }])).not.toBe(
      base,
    );
    expect(
      fingerprint(["lib", "<Meter value={2} />", 4, { width: 420 }]),
    ).not.toBe(base);
    expect(fingerprint(["lib", "<Meter />", 2, { width: 420 }])).not.toBe(base);
    expect(fingerprint(["lib", "<Meter />", 4, { width: 480 }])).not.toBe(base);
  });
});
