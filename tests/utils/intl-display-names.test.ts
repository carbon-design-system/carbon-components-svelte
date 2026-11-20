// @vitest-environment node
import {
  canRenderFlags,
  languageEndonym,
  languageName,
  listLanguages,
  listLanguageVariants,
  listRegions,
  localeRegion,
  matchLanguage,
  regionFlag,
  regionName,
  regionNativeName,
} from "../../src/utils/intl-display-names.js";

describe("listRegions", () => {
  const regions = listRegions();

  it("lists the countries and territories", () => {
    expect(regions.length).toBeGreaterThan(240);
    expect(regions).toEqual(
      expect.arrayContaining(["US", "CH", "JP", "XK", "HK", "AQ"]),
    );
  });

  it("leaves out reserved and pseudo codes", () => {
    for (const code of ["EU", "UN", "ZZ", "XA", "XB", "EZ", "AC", "QO"]) {
      expect(regions).not.toContain(code);
    }
  });

  it("leaves out deprecated codes, which Intl names like their successors", () => {
    for (const code of ["DD", "SU", "YU", "ZR", "TP", "AN", "FX", "BU"]) {
      expect(regions).not.toContain(code);
    }
  });

  it("is two letters each", () => {
    expect(regions.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
  });
});

describe("listLanguages", () => {
  it("lists two-letter languages, a few with none, and not the deprecated ones", () => {
    const languages = listLanguages();

    expect(languages).toEqual(
      expect.arrayContaining(["en", "fr", "ar", "he", "zh", "fil", "yue"]),
    );
    for (const code of ["iw", "in", "ji", "jw", "mo", "sh", "tw", "tl"]) {
      expect(languages).not.toContain(code);
    }
  });

  it("lists variants that the engine can name", () => {
    expect(listLanguageVariants()).toEqual(
      expect.arrayContaining(["pt-BR", "es-419", "zh-Hant", "sr-Latn"]),
    );
  });
});

describe("names", () => {
  it("names a region in a locale", () => {
    expect(regionName("en", "DE")).toBe("Germany");
    expect(regionName("de", "DE")).toBe("Deutschland");
    expect(regionName("ar", "EG")).toBe("مصر");
    expect(regionName("en", "150")).toBe("Europe");
  });

  it("names a region in its own language", () => {
    expect(regionNativeName("CH")).toBe("Schweiz");
    expect(regionNativeName("JP")).toBe("日本");
    expect(regionNativeName("HK")).toBe("中國香港特別行政區");
    expect(regionNativeName("150")).toBeUndefined();
  });

  it("names a language in a locale, in both display styles", () => {
    expect(languageName("en", "pt-BR", "standard")).toBe("Portuguese (Brazil)");
    expect(languageName("en", "pt-BR", "dialect")).toBe("Brazilian Portuguese");
    expect(languageName("fr", "en")).toBe("anglais");
  });

  it("names a language in itself", () => {
    expect(languageEndonym("fr")).toBe("français");
    expect(languageEndonym("ar")).toBe("العربية");
    expect(languageEndonym("zh-Hant")).toBe("中文（繁體）");
    expect(languageEndonym("zh-Hant", "dialect")).toBe("繁體中文");
  });

  it("does not offer the engine's fallback as a language's own name", () => {
    // An engine without Icelandic data answers in its default locale.
    const real = Intl.DisplayNames;
    class Fallback extends real {
      resolvedOptions() {
        return { ...super.resolvedOptions(), locale: "en" };
      }
    }
    Object.defineProperty(Intl, "DisplayNames", { value: Fallback });
    try {
      expect(languageEndonym("is-IS")).toBeUndefined();
      expect(regionNativeName("AM")).toBeUndefined();
    } finally {
      Object.defineProperty(Intl, "DisplayNames", { value: real });
    }
  });

  it("makes a flag from a code's two letters", () => {
    expect(regionFlag("US")).toBe("\u{1F1FA}\u{1F1F8}");
    expect(regionFlag("150")).toBe("");
    expect(regionFlag("us")).toBe("");
  });

  it("guesses the region of a locale", () => {
    expect(localeRegion("en")).toBe("US");
    expect(localeRegion("de")).toBe("DE");
    expect(localeRegion("pt-PT")).toBe("PT");
    expect(localeRegion("!!")).toBe("");
  });

  it("matches the browser's languages to a list, tag first and then language", () => {
    expect(matchLanguage(["pt-BR", "en"], ["pt-BR", "en"])).toBe("pt-BR");
    expect(matchLanguage(["pt-BR", "en"], ["pt", "en"])).toBe("pt");
    expect(matchLanguage(["xx", "en-GB"], ["en"])).toBe("en");
    expect(matchLanguage(["xx"], ["en"])).toBe("");
  });
});

describe("canRenderFlags", () => {
  const paint = (pixels: number[]) => () =>
    ({
      canvas: { width: 0, height: 0 },
      fillText() {},
      getImageData: () => ({ data: new Uint8ClampedArray(pixels) }),
    }) as unknown as CanvasRenderingContext2D;

  it("sees a flag in a pixel with red and blue", () => {
    expect(canRenderFlags(paint([200, 20, 20, 255, 20, 20, 200, 255]))).toBe(
      true,
    );
  });

  it("sees letters in gray pixels, as Windows draws them", () => {
    expect(canRenderFlags(paint([90, 90, 90, 255, 0, 0, 0, 0]))).toBe(false);
  });

  it("is false with no canvas", () => {
    expect(canRenderFlags(() => null)).toBe(false);
    expect(
      canRenderFlags(() => {
        throw new Error("no canvas");
      }),
    ).toBe(false);
  });
});
