import { formatDelta } from "../../src/utils/format-delta.js";

describe("formatDelta", () => {
  test("undefined for a missing or NaN value", () => {
    expect(formatDelta(undefined)).toBeUndefined();
    expect(formatDelta(null)).toBeUndefined();
    expect(formatDelta(Number.NaN)).toBeUndefined();
  });

  test("adds an explicit sign on non-zero values, none on zero", () => {
    expect(formatDelta(5)).toBe("+5");
    expect(formatDelta(-5)).toBe("-5");
    expect(formatDelta(0)).toBe("0");
  });

  test("compact notation", () => {
    expect(formatDelta(1500, { compact: true, digits: 1 })).toBe("+1.5K");
    expect(formatDelta(-1500, { compact: true, digits: 1 })).toBe("-1.5K");
  });

  test("percent: 'literal' appends % to the number as given", () => {
    expect(formatDelta(12, { percent: "literal" })).toBe("+12%");
    expect(formatDelta(-12, { percent: "literal" })).toBe("-12%");
  });

  test("percent: 'ratio' treats the value as a fraction", () => {
    expect(formatDelta(0.12, { percent: "ratio" })).toBe("+12%");
    expect(formatDelta(-0.12, { percent: "ratio" })).toBe("-12%");
  });

  test("formatOptions merges in extra Intl.NumberFormat options, such as currency", () => {
    expect(
      formatDelta(5, { formatOptions: { style: "currency", currency: "USD" } }),
    ).toBe("+$5.00");
  });

  test("a custom format fn gets a '+' prepended only for positive values", () => {
    const format = (value: number) => `${value}!`;
    expect(formatDelta(5, { format })).toBe("+5!");
    expect(formatDelta(-5, { format })).toBe("-5!");
    expect(formatDelta(0, { format })).toBe("0!");
  });

  test("locale de-DE uses a comma decimal separator", () => {
    const result = formatDelta(1234.5, { locale: "de-DE", digits: 1 });
    expect(result).toMatch(/^\+[\d.]+,5$/);
  });
});
