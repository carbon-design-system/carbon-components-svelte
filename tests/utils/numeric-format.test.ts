// @vitest-environment node
import {
  clamp,
  getDefaultValue,
  parse,
  parseLocaleValue,
  roundToStep,
  validateNumberSeparators,
} from "../../src/utils/numeric-format.js";

describe("parse", () => {
  it("returns null for empty input", () => {
    expect(parse("")).toBe(null);
  });

  it("treats comma and ٫ as a decimal separator while typing", () => {
    expect(parse("1,5")).toBe(1.5);
    expect(parse("1٫5")).toBe(1.5);
  });

  it("disambiguates thousands and decimal separators on blur", () => {
    expect(parse("1.000,5", true)).toBe(1000.5);
    expect(parse("1,000.5", true)).toBe(1000.5);
  });

  it("falls back to simple separator rules with one separator type", () => {
    expect(parse("1,5", true)).toBe(1.5);
    expect(parse("1.5", true)).toBe(1.5);
  });

  it("returns null for non-numeric input", () => {
    expect(parse("abc")).toBe(null);
  });
});

describe("parseLocaleValue", () => {
  it("strips the group separator and rewrites the decimal separator", () => {
    expect(parseLocaleValue("1.234,5", ".", ",")).toBe(1234.5);
    expect(parseLocaleValue("1,234.5", ",", ".")).toBe(1234.5);
  });

  it("handles an empty group separator", () => {
    expect(parseLocaleValue("1234.5", "", ".")).toBe(1234.5);
  });

  it("returns null for empty input", () => {
    expect(parseLocaleValue("", ".", ",")).toBe(null);
  });

  // Each locale's Intl.NumberFormat renders digits in its own glyphs, with its
  // own separators: ar-EG (Arabic-Indic), fa-IR (Extended Arabic-Indic),
  // bn-BD (Bengali), and fullwidth forms.
  it.each([
    ["Arabic-Indic", "١٬٢٣٤٫٥", "٬", "٫"],
    ["Extended Arabic-Indic (Persian)", "۱٬۲۳۴٫۵", "٬", "٫"],
    ["Bengali", "১,২৩৪.৫", ",", "."],
    ["fullwidth", "１，２３４．５", "，", "．"],
  ])(
    "normalizes %s digits to ASCII before parsing",
    (_, raw, group, decimal) => {
      expect(parseLocaleValue(raw, group, decimal)).toBe(1234.5);
    },
  );
});

describe("getDefaultValue", () => {
  it("prefers stepStartValue, then min, then 0", () => {
    expect(getDefaultValue(5, 0)).toBe(5);
    expect(getDefaultValue(undefined, 2)).toBe(2);
    expect(getDefaultValue(undefined, undefined)).toBe(0);
  });

  it("treats a stepStartValue of 0 as set", () => {
    expect(getDefaultValue(0, 10)).toBe(0);
  });
});

describe("clamp", () => {
  it("enforces each defined bound", () => {
    expect(clamp(5, undefined, 3)).toBe(3);
    expect(clamp(1, 2, undefined)).toBe(2);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("ignores undefined bounds", () => {
    expect(clamp(5, undefined, undefined)).toBe(5);
  });
});

describe("validateNumberSeparators", () => {
  it("allows an empty string", () => {
    expect(validateNumberSeparators("", "de-DE")).toBe(true);
  });

  it("validates plain digits without a locale", () => {
    expect(validateNumberSeparators("1234", undefined)).toBe(true);
    expect(validateNumberSeparators("12a4", undefined)).toBe(false);
  });

  it("accepts correctly-separated input for the given locale", () => {
    expect(validateNumberSeparators("1.234,5", "de-DE")).toBe(true);
    expect(validateNumberSeparators("1,234.5", "en-US")).toBe(true);
  });

  it("rejects input using the wrong locale's separators", () => {
    // "de-DE" expects "." as the group separator and "," as decimal;
    // this string mixes both incorrectly (two decimal-style separators).
    expect(validateNumberSeparators("1,234,5", "de-DE")).toBe(false);
  });
});

describe("roundToStep", () => {
  it("rounds to the decimal places implied by step", () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(1.23456, 1)).toBe(1);
    expect(roundToStep(1.23456, 0.01)).toBe(1.23);
  });
});
