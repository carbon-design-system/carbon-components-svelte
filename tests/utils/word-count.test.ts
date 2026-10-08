// @vitest-environment node
import {
  truncateWords,
  wordCount,
  wordLimitAction,
} from "../../src/utils/word-count.js";

describe("wordCount", () => {
  it("returns 0 for an empty string", () => {
    expect(wordCount("")).toBe(0);
  });

  it("ignores leading, trailing, and repeated whitespace", () => {
    expect(wordCount("  a  b ")).toBe(2);
  });

  it("counts apostrophe words as one", () => {
    expect(wordCount("don't stop")).toBe(2);
  });

  it("counts hyphenated words consistently", () => {
    expect(wordCount("well-known")).toBeGreaterThanOrEqual(1);
    expect(wordCount("well-known")).toBeLessThanOrEqual(2);
  });

  it("counts digits-only tokens", () => {
    expect(wordCount("call 911 now")).toBe(3);
  });

  it("does not count punctuation or whitespace-only input", () => {
    expect(wordCount(" \n\t ")).toBe(0);
    expect(wordCount("...")).toBe(0);
  });
});

describe("truncateWords", () => {
  it("keeps the whitespace after the last kept word", () => {
    expect(truncateWords("one two three", 2)).toBe("one two ");
  });

  it("returns the value when it is within the limit", () => {
    expect(truncateWords("one two", 5)).toBe("one two");
  });

  it("returns an empty prefix for 0", () => {
    expect(truncateWords("one two", 0)).toBe("");
  });

  it("returns the value unchanged for an invalid max", () => {
    expect(truncateWords("x", -1)).toBe("x");
    expect(truncateWords("x", Number.NaN)).toBe("x");
    expect(truncateWords("x", Number.POSITIVE_INFINITY)).toBe("x");
  });
});

describe("wordLimitAction", () => {
  it("allows an insert that stays within the limit", () => {
    expect(wordLimitAction("one two", 7, 7, " three", 3)).toBe("allow");
  });

  it("blocks a new word at the cap", () => {
    expect(wordLimitAction("one two three", 13, 13, " four", 3)).toBe("block");
  });

  it("allows whitespace at the cap", () => {
    expect(wordLimitAction("one two three", 13, 13, " ", 3)).toBe("allow");
  });

  it("blocks whitespace that would split a word past the cap", () => {
    expect(wordLimitAction("one two three", 11, 11, " ", 3)).toBe("block");
  });

  it("allows extending the last word at the cap", () => {
    expect(wordLimitAction("one two thr", 11, 11, "ee", 3)).toBe("allow");
  });

  it("truncates a paste to the remaining room", () => {
    expect(wordLimitAction("", 0, 0, "a b c d e", 2)).toEqual({
      insert: "a b ",
    });
  });

  it("accounts for the replaced selection", () => {
    expect(wordLimitAction("one two three", 4, 13, "x y z", 3)).toEqual({
      insert: "x y ",
    });
  });

  it("blocks a paste when there is no room", () => {
    expect(wordLimitAction("one two", 7, 7, " three four", 2)).toBe("block");
  });

  it("allows edits that add no words to a value over the limit", () => {
    expect(wordLimitAction("a b c d", 7, 7, " ", 2)).toBe("allow");
    expect(wordLimitAction("a b c d", 7, 7, " e", 2)).toBe("block");
  });
});
