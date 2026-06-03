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
