// @vitest-environment node
import { getInitials } from "../../src/utils/initials.js";

describe("getInitials", () => {
  it("derives a single initial from a single-word name", () => {
    expect(getInitials("Eric")).toBe("E");
  });

  it("derives initials from each word, capped at two by default", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Richard J. Hendricks")).toBe("RJ");
  });

  it("respects a custom max", () => {
    expect(getInitials("Richard J. Hendricks", { max: 3 })).toBe("RJH");
    expect(getInitials("Richard J. Hendricks", { max: 1 })).toBe("R");
  });

  it("returns an empty string when max is 0 or less", () => {
    expect(getInitials("Richard J. Hendricks", { max: 0 })).toBe("");
    expect(getInitials("Richard J. Hendricks", { max: -1 })).toBe("");
  });

  it("trims and collapses surrounding and repeated whitespace", () => {
    expect(getInitials("  padded   name ")).toBe("PN");
  });

  it("returns an empty string for falsy or whitespace-only input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
    expect(getInitials(null)).toBe("");
    expect(getInitials(undefined)).toBe("");
  });

  it("keeps a ZWJ emoji sequence whole as a single initial", () => {
    expect(getInitials("👩‍🚀 Astronaut")).toBe("👩‍🚀A");
  });

  it("normalizes a decomposed combining mark before taking the initial", () => {
    // "e" + U+0301 (decomposed) must come back as the precomposed U+00C9.
    expect(getInitials("e\u0301mile zola")).toBe("\u00c9Z");
  });

  it("upper cases using locale-specific casing rules", () => {
    expect(getInitials("istanbul", { locale: "tr" })).toBe("İ");
  });

  describe("without Intl.Segmenter", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("falls back to a code point per word", async () => {
      vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
      vi.resetModules();
      const { getInitials: getInitialsFallback } =
        await import("../../src/utils/initials.js");

      expect(getInitialsFallback("John Doe")).toBe("JD");
      expect(getInitialsFallback("😀 x")).toBe("😀X");
    });
  });

  it("reuses one segmenter per locale across calls", () => {
    const constructorSpy = vi.spyOn(Intl, "Segmenter");

    getInitials("Иван Петров", { locale: "ru" });
    getInitials("Мария Иванова", { locale: "ru" });

    expect(constructorSpy).toHaveBeenCalledTimes(1);
    constructorSpy.mockRestore();
  });

  it("skips the segmenter for names that start with two Latin code units", async () => {
    vi.resetModules();
    const { getInitials: getInitialsFresh } =
      await import("../../src/utils/initials.js");
    const constructorSpy = vi.spyOn(Intl, "Segmenter");

    expect(getInitialsFresh("John Doe")).toBe("JD");
    expect(getInitialsFresh("émile zola")).toBe("ÉZ");
    expect(getInitialsFresh("X Æ")).toBe("XÆ");
    expect(constructorSpy).not.toHaveBeenCalled();

    // A leading code unit at or above U+0300 (or an astral pair) still segments.
    expect(getInitialsFresh("Иван")).toBe("И");
    expect(getInitialsFresh("👩‍🚀 Astronaut")).toBe("👩‍🚀A");
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    constructorSpy.mockRestore();
  });
});
