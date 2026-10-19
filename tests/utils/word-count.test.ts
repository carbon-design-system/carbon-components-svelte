// @vitest-environment node
import { wordCount, wordLimitAction } from "../../src/utils/word-count.js";

describe("wordCount", () => {
  it("returns 0 for an empty string", () => {
    expect(wordCount("")).toBe(0);
  });

  it("ignores leading, trailing, and repeated whitespace", () => {
    expect(wordCount("  a  b ")).toBe(2);
  });

  it("does not count punctuation or whitespace-only input", () => {
    expect(wordCount(" \n\t ")).toBe(0);
    expect(wordCount("...")).toBe(0);
  });
});

describe("wordLimitAction", () => {
  it("allows an insert that stays within the limit", () => {
    expect(wordLimitAction("one two", 7, 7, " three", 3)).toBe("allow");
  });

  it("blocks a new word at the cap", () => {
    expect(wordLimitAction("one two three", 13, 13, " four", 3)).toBe("block");
  });

  it("blocks whitespace that would split a word past the cap", () => {
    expect(wordLimitAction("one two three", 11, 11, " ", 3)).toBe("block");
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

  it("allows edits that add no words to a value over the limit", () => {
    expect(wordLimitAction("a b c d", 7, 7, " ", 2)).toBe("allow");
    expect(wordLimitAction("a b c d", 7, 7, " e", 2)).toBe("block");
  });
});
