// @vitest-environment node
import { matchText } from "../../src/utils/text-match.js";
import { textSnippet } from "../../src/utils/text-snippet.js";

const FOX =
  "The quick brown fox jumps over the lazy dog while the sleepy cat watches from a distant windowsill and the ordinary bird sings loudly in the tree near the river bank where fox cubs play.";

function snippetOf(
  text: string,
  query: string,
  options?: Parameters<typeof textSnippet>[2],
) {
  const result = textSnippet(text, matchText(text, query), options);
  return {
    ...result,
    shown: result.ranges.map((r) => result.text.slice(r.start, r.end)),
  };
}

describe("textSnippet", () => {
  it("returns short text whole, with its ranges", () => {
    const result = snippetOf("hello world", "world", { maxLength: 50 });
    expect(result.text).toBe("hello world");
    expect(result.truncated).toBe(false);
    expect(result.ranges).toEqual([{ start: 6, end: 11 }]);
  });

  it("keeps context on both sides and ends at word boundaries", () => {
    const result = snippetOf(FOX, "lazy", { maxLength: 60, context: 15 });
    expect(result.text).toBe("…jumps over the lazy dog while the…");
    expect(result.shown).toEqual(["lazy"]);
    expect(result.truncated).toBe(true);
  });

  it("omits the leading ellipsis at the start and the trailing one at the end", () => {
    expect(snippetOf(FOX, "quick", { maxLength: 30, context: 10 }).text).toBe(
      "The quick brown fox…",
    );
    expect(snippetOf(FOX, "play", { maxLength: 30, context: 10 }).text).toBe(
      "…fox cubs play.",
    );
  });

  it("joins the windows of separate matches when they fit", () => {
    const result = snippetOf(FOX, "fox", { maxLength: 90, context: 12 });
    expect(result.text).toBe(
      "…quick brown fox jumps over … bank where fox cubs play.",
    );
    expect(result.shown).toEqual(["fox", "fox"]);
  });

  it("drops later matches that do not fit, never the first", () => {
    const result = snippetOf(FOX, "fox", { maxLength: 40, context: 12 });
    expect(result.shown).toEqual(["fox"]);
    expect(result.text.length).toBeLessThanOrEqual(40);
  });

  it("merges windows that nearly touch into one run", () => {
    const text = `${"x ".repeat(40)}alpha beta ${"y ".repeat(40)}`;
    const result = snippetOf(text, "alpha beta", {
      maxLength: 60,
      context: 10,
    });
    expect(result.shown).toEqual(["alpha", "beta"]);
    expect(result.text).not.toContain(" … ");
  });

  it("shows the head when nothing matched", () => {
    const result = textSnippet(FOX, [], { maxLength: 40 });
    expect(result.text).toBe("The quick brown fox jumps over the lazy…");
    expect(result.ranges).toEqual([]);
    expect(result.truncated).toBe(true);
  });

  it("clips a match longer than the room", () => {
    const text = `intro ${"abcdefghij".repeat(10)} outro`;
    const result = snippetOf(text, "abcdefghij".repeat(10), { maxLength: 30 });
    expect(result.text.length).toBeLessThanOrEqual(30);
    expect(result.text.startsWith("…abcdefghij")).toBe(true);
    expect(result.text.endsWith("…")).toBe(true);
    expect(result.ranges).toHaveLength(1);
  });

  it("cuts inside a long unbroken word on a grapheme boundary", () => {
    const text = `${"👨‍👩‍👧".repeat(30)}X${"👨‍👩‍👧".repeat(30)}`;
    const result = snippetOf(text, "x", { maxLength: 40, context: 11 });
    const segments = [...new Intl.Segmenter().segment(result.text)].map(
      (s) => s.segment,
    );
    // Every segment is a whole family, the X, or an ellipsis.
    for (const segment of segments) {
      expect(["…", "X", "👨‍👩‍👧"]).toContain(segment);
    }
    expect(result.shown).toEqual(["X"]);
  });

  it("does not split a combining sequence", () => {
    const word = "é".repeat(60);
    const result = textSnippet(word, [], { maxLength: 21 });
    expect(result.text.endsWith("…")).toBe(true);
    const body = result.text.slice(0, -1);
    expect(body.length % 2).toBe(0);
  });

  it("honors a custom ellipsis and separator", () => {
    const result = snippetOf(FOX, "fox", {
      maxLength: 90,
      context: 12,
      ellipsis: "...",
      separator: " | ",
    });
    expect(result.text.startsWith("...")).toBe(true);
    expect(result.text).toContain(" | ");
    expect(result.text.length).toBeLessThanOrEqual(90);
  });

  it("keeps the ranges aligned with the text they mark", () => {
    const result = snippetOf(FOX, "fox lazy cat", {
      maxLength: 120,
      context: 8,
    });
    for (const word of result.shown) {
      expect(["fox", "lazy", "cat"]).toContain(word);
    }
  });

  it("handles an empty text and missing ranges", () => {
    expect(textSnippet("", undefined)).toEqual({
      text: "",
      ranges: [],
      truncated: false,
    });
    expect(textSnippet(undefined as unknown as string, null).text).toBe("");
  });

  it("never exceeds maxLength, over many texts, queries and sizes", () => {
    const words = [
      "alpha",
      "beta",
      "gamma",
      "délta",
      "ε",
      "ß",
      "😀",
      "東京",
      "x",
    ];
    let seed = 5;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let n = 0; n < 300; n++) {
      let text = "";
      const count = 5 + Math.floor(next() * 60);
      for (let i = 0; i < count; i++) {
        text +=
          words[Math.floor(next() * words.length)] + (next() < 0.8 ? " " : "");
      }
      const query = words[Math.floor(next() * words.length)];
      const maxLength = 12 + Math.floor(next() * 80);
      const context = Math.floor(next() * 30);
      const ranges = matchText(text, query);
      const result = textSnippet(text, ranges, { maxLength, context });
      const label = JSON.stringify({ text, query, maxLength, context });
      expect(result.text.length, label).toBeLessThanOrEqual(
        Math.max(maxLength, text.length <= maxLength ? text.length : 0),
      );
      // Ranges stay inside the text and cover the matched word.
      for (const r of result.ranges) {
        expect(r.end, label).toBeLessThanOrEqual(result.text.length);
        expect(r.end, label).toBeGreaterThan(r.start);
      }
      // No lone surrogates are left from a cut.
      expect(
        /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(
          result.text,
        ),
        label,
      ).toBe(false);
    }
  });
});
