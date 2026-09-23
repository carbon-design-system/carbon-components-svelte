import {
  graphemeCount,
  truncateGraphemes,
} from "../../src/utils/grapheme-count.js";

describe("graphemeCount", () => {
  test("counts plain ASCII characters", () => {
    expect(graphemeCount("hello")).toBe(5);
    expect(graphemeCount("")).toBe(0);
  });

  test("counts a family emoji (ZWJ sequence) as one character", () => {
    expect(graphemeCount("👨‍👩‍👧")).toBe(1);
  });

  test("counts a single-codepoint emoji as one character", () => {
    expect(graphemeCount("😀")).toBe(1);
  });
});

describe("truncateGraphemes", () => {
  test("truncates plain ASCII to the given number of graphemes", () => {
    expect(truncateGraphemes("hello", 3)).toBe("hel");
  });

  test("truncates by whole grapheme, not UTF-16 code unit", () => {
    expect(truncateGraphemes("😀😀😀", 2)).toBe("😀😀");
  });

  test("does not split a surrogate pair", () => {
    const truncated = truncateGraphemes("😀😀", 1);
    expect(truncated).toBe("😀");
    expect(truncated.length).toBe(2);
  });

  test("returns the value unchanged when max is negative or non-finite", () => {
    expect(truncateGraphemes("hello", -1)).toBe("hello");
    expect(truncateGraphemes("hello", Number.NaN)).toBe("hello");
    expect(truncateGraphemes("hello", Number.POSITIVE_INFINITY)).toBe("hello");
  });
});
