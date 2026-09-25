// @vitest-environment node
import {
  graphemeCount,
  truncateGraphemes,
} from "../../src/utils/grapheme-count.js";

describe("graphemeCount", () => {
  it("counts plain ASCII characters", () => {
    expect(graphemeCount("hello")).toBe(5);
    expect(graphemeCount("")).toBe(0);
  });

  it("counts a family emoji (ZWJ sequence) as one character", () => {
    expect(graphemeCount("👨‍👩‍👧")).toBe(1);
  });

  it("counts a single-codepoint emoji as one character", () => {
    expect(graphemeCount("😀")).toBe(1);
  });
});

describe("truncateGraphemes", () => {
  it("truncates plain ASCII to the given number of graphemes", () => {
    expect(truncateGraphemes("hello", 3)).toBe("hel");
  });

  it("truncates by whole grapheme, not UTF-16 code unit", () => {
    expect(truncateGraphemes("😀😀😀", 2)).toBe("😀😀");
  });

  it("does not split a surrogate pair", () => {
    const truncated = truncateGraphemes("😀😀", 1);
    expect(truncated).toBe("😀");
    expect(truncated.length).toBe(2);
  });

  it("returns the value unchanged when max is negative or non-finite", () => {
    expect(truncateGraphemes("hello", -1)).toBe("hello");
    expect(truncateGraphemes("hello", Number.NaN)).toBe("hello");
    expect(truncateGraphemes("hello", Number.POSITIVE_INFINITY)).toBe("hello");
  });
});
