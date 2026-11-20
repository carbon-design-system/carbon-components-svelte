import {
  firstStrong,
  inputTextOffset,
  paragraphIsRtl,
  startsRtl,
} from "../../src/utils/input-bidi.js";

const HEBREW = "שלום";
const ARABIC = "مرحبا";

describe("firstStrong", () => {
  it.each([
    ["hello", "ltr"],
    [HEBREW, "rtl"],
    [ARABIC, "rtl"],
    // Digits, spaces and punctuation are not strong: the first letter is.
    ["12 -- (שלום)", "rtl"],
    ["12 -- (hello)", "ltr"],
    ["日本語", "ltr"],
    [`${HEBREW} hello`, "rtl"],
    [`hello ${HEBREW}`, "ltr"],
    // A letter outside the BMP.
    [String.fromCodePoint(0x10800), "rtl"],
  ] as const)("reads %j as %s", (text, direction) => {
    expect(firstStrong(text)).toBe(direction);
  });

  it("finds nothing strong in a line with no letter", () => {
    expect(firstStrong("")).toBeNull();
    expect(firstStrong("123 + 4")).toBeNull();
    expect(startsRtl("123")).toBe(false);
  });
});

describe("paragraphIsRtl", () => {
  it("follows the field's direction unless the line decides", () => {
    expect(paragraphIsRtl(HEBREW, false, false)).toBe(false);
    expect(paragraphIsRtl("hello", true, false)).toBe(true);
  });

  it("follows the first strong character of a plaintext line", () => {
    expect(paragraphIsRtl(HEBREW, false, true)).toBe(true);
    expect(paragraphIsRtl("hello", true, true)).toBe(false);
  });

  it("takes the field's direction for a line with no strong character", () => {
    expect(paragraphIsRtl("123", true, true)).toBe(true);
    expect(paragraphIsRtl("123", false, true)).toBe(false);
  });
});

describe("inputTextOffset", () => {
  const base = {
    boxWidth: 300,
    textWidth: 100,
    scrollLeft: 0,
    fieldRtl: false,
    textRtl: false,
  };

  describe("text that fits is aligned by the field", () => {
    it("at the left of an LTR field, whatever the text's own direction", () => {
      expect(inputTextOffset(base)).toBe(0);
      expect(inputTextOffset({ ...base, textRtl: true })).toBe(0);
    });

    it("at the right of an RTL field, whatever the text's own direction", () => {
      expect(inputTextOffset({ ...base, fieldRtl: true })).toBe(200);
      expect(inputTextOffset({ ...base, fieldRtl: true, textRtl: false })).toBe(
        200,
      );
    });

    it.each([
      ["left", false, 0],
      ["left", true, 0],
      ["right", false, 200],
      ["right", true, 200],
      ["center", false, 100],
      ["end", false, 200],
      ["end", true, 0],
      ["start", false, 0],
      ["start", true, 200],
      ["justify", true, 200],
    ])("text-align %s in an rtl=%s field", (textAlign, fieldRtl, offset) => {
      expect(inputTextOffset({ ...base, textAlign, fieldRtl })).toBe(offset);
    });
  });

  describe("text that overflows is anchored by the line's direction", () => {
    const long = { ...base, textWidth: 1000 };

    it("at the left for a line that reads left to right, less the scroll", () => {
      expect(inputTextOffset(long)).toBe(0);
      expect(inputTextOffset({ ...long, scrollLeft: 250 })).toBe(-250);
    });

    it("at the right for a line that reads right to left", () => {
      expect(inputTextOffset({ ...long, textRtl: true })).toBe(-700);
      // scrollLeft is negative there: scrolled towards the line's start.
      expect(
        inputTextOffset({ ...long, textRtl: true, scrollLeft: -300 }),
      ).toBe(-400);
    });

    it("by the line, not the field: Hebrew in an LTR plaintext field", () => {
      expect(inputTextOffset({ ...long, fieldRtl: false, textRtl: true })).toBe(
        -700,
      );
    });

    it("ignores text-align", () => {
      expect(inputTextOffset({ ...long, textAlign: "right" })).toBe(0);
    });
  });

  it("treats a line exactly as wide as the box as fitting", () => {
    expect(inputTextOffset({ ...base, textWidth: 300, fieldRtl: true })).toBe(
      0,
    );
  });
});
