// @vitest-environment node
import {
  graphemeCount,
  truncateGraphemes,
} from "../../src/utils/grapheme-count.js";

describe("graphemeCount", () => {
  it("counts a family emoji (ZWJ sequence) as one character", () => {
    expect(graphemeCount("👨‍👩‍👧")).toBe(1);
  });
});

describe("truncateGraphemes", () => {
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

describe("segmenter use", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function importFresh() {
    vi.resetModules();
    return import("../../src/utils/grapheme-count.js");
  }

  it("builds no segmenter on import or for text below U+0300", async () => {
    const constructorSpy = vi.spyOn(Intl, "Segmenter");
    const fresh = await importFresh();

    expect(fresh.graphemeCount("")).toBe(0);
    expect(fresh.graphemeCount("Hello, world\n")).toBe(13);
    expect(fresh.graphemeCount("café naïve")).toBe(10);
    expect(fresh.truncateGraphemes("hello", 2)).toBe("he");
    expect(constructorSpy).not.toHaveBeenCalled();
  });

  it("segments combining marks and CRLF, building one segmenter", async () => {
    const constructorSpy = vi.spyOn(Intl, "Segmenter");
    const fresh = await importFresh();

    expect(fresh.graphemeCount("é")).toBe(1);
    expect(fresh.graphemeCount("a\r\nb")).toBe(3);
    expect(fresh.truncateGraphemes("a\r\nb", 2)).toBe("a\r\n");
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to code points without Intl.Segmenter", async () => {
    vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
    const fresh = await importFresh();

    expect(fresh.graphemeCount("😀😀")).toBe(2);
    expect(fresh.truncateGraphemes("😀😀", 1)).toBe("😀");
  });
});
