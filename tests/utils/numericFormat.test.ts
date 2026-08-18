import {
  clamp,
  getDefaultValue,
  parse,
  parseLocaleValue,
  roundToStep,
} from "../../src/utils/numericFormat.js";

describe("parse", () => {
  test("returns null for empty or partial input", () => {
    expect(parse("")).toBe(null);
    expect(parse("-")).toBe(null);
  });

  test("treats comma and ٫ as a decimal separator while typing", () => {
    expect(parse("1,5")).toBe(1.5);
    expect(parse("1٫5")).toBe(1.5);
    expect(parse("1.5")).toBe(1.5);
    expect(parse("42")).toBe(42);
  });

  test("disambiguates thousands and decimal separators on blur", () => {
    expect(parse("1.000,5", true)).toBe(1000.5);
    expect(parse("1,000.5", true)).toBe(1000.5);
  });

  test("falls back to simple separator rules with one separator type", () => {
    expect(parse("1,5", true)).toBe(1.5);
    expect(parse("1.5", true)).toBe(1.5);
  });

  test("returns null for non-numeric input", () => {
    expect(parse("abc")).toBe(null);
  });
});

describe("parseLocaleValue", () => {
  test("strips the group separator and rewrites the decimal separator", () => {
    expect(parseLocaleValue("1.234,5", ".", ",")).toBe(1234.5);
    expect(parseLocaleValue("1,234.5", ",", ".")).toBe(1234.5);
  });

  test("handles an empty group separator", () => {
    expect(parseLocaleValue("1234.5", "", ".")).toBe(1234.5);
  });

  test("returns null for empty or partial input", () => {
    expect(parseLocaleValue("", ".", ",")).toBe(null);
    expect(parseLocaleValue("-", ".", ",")).toBe(null);
  });

  test("normalizes Arabic-Indic digits to ASCII before parsing", () => {
    // new Intl.NumberFormat("ar-EG").formatToParts(12345.6) yields these separators,
    // and format() renders digits using Arabic-Indic glyphs (١٢٣٤٥ etc).
    expect(parseLocaleValue("١٬٢٣٤٫٥", "٬", "٫")).toBe(1234.5);
  });

  test("normalizes Extended Arabic-Indic (Persian) digits to ASCII before parsing", () => {
    // new Intl.NumberFormat("fa-IR") renders digits using Extended Arabic-Indic glyphs (۱۲۳۴۵ etc).
    expect(parseLocaleValue("۱٬۲۳۴٫۵", "٬", "٫")).toBe(1234.5);
  });

  test("normalizes Bengali digits to ASCII before parsing", () => {
    // new Intl.NumberFormat("bn-BD") renders digits using Bengali glyphs (১২৩৪৫ etc).
    expect(parseLocaleValue("১,২৩৪.৫", ",", ".")).toBe(1234.5);
  });

  test("normalizes fullwidth digits to ASCII before parsing", () => {
    expect(parseLocaleValue("１，２３４．５", "，", "．")).toBe(1234.5);
  });
});

describe("getDefaultValue", () => {
  test("prefers stepStartValue, then min, then 0", () => {
    expect(getDefaultValue(5, 0)).toBe(5);
    expect(getDefaultValue(undefined, 2)).toBe(2);
    expect(getDefaultValue(undefined, undefined)).toBe(0);
  });

  test("treats a stepStartValue of 0 as set", () => {
    expect(getDefaultValue(0, 10)).toBe(0);
  });
});

describe("clamp", () => {
  test("enforces each defined bound", () => {
    expect(clamp(5, undefined, 3)).toBe(3);
    expect(clamp(1, 2, undefined)).toBe(2);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test("ignores undefined bounds", () => {
    expect(clamp(5, undefined, undefined)).toBe(5);
  });
});

describe("roundToStep", () => {
  test("rounds to the decimal places implied by step", () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(1.23456, 1)).toBe(1);
    expect(roundToStep(1.23456, 0.01)).toBe(1.23);
  });
});
