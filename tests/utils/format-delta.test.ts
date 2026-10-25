// @vitest-environment node
import { formatDelta } from "../../src/utils/format-delta.js";

describe("formatDelta", () => {
  it("undefined for a missing or NaN value", () => {
    expect(formatDelta(undefined)).toBeUndefined();
    expect(formatDelta(null)).toBeUndefined();
    expect(formatDelta(Number.NaN)).toBeUndefined();
  });

  it("adds an explicit sign on non-zero values, none on zero", () => {
    expect(formatDelta(5)).toBe("+5");
    expect(formatDelta(-5)).toBe("-5");
    expect(formatDelta(0)).toBe("0");
  });

  it("compact notation", () => {
    expect(formatDelta(1500, { compact: true, digits: 1 })).toBe("+1.5K");
  });

  it("percent: 'literal' reads the number as percent", () => {
    expect(formatDelta(12, { percent: "literal" })).toBe("+12%");
  });

  it.each([
    ["en-US", "+12%", "-0.3%"],
    ["tr", "+%12", "-%0,3"],
    ["fr", "+12\u00a0%", "-0,3\u00a0%"],
    ["ar-EG", "\u061c+١٢٪\u061c", "\u061c-٠٫٣٪\u061c"],
  ])(
    "percent: 'literal' follows the %s percent pattern",
    (locale, up, down) => {
      expect(formatDelta(12, { locale, percent: "literal" })).toBe(up);
      expect(formatDelta(-0.3, { locale, percent: "literal" })).toBe(down);
      expect(formatDelta(0.12, { locale, percent: "ratio" })).toBe(up);
    },
  );

  it("does not abbreviate a percentage", () => {
    expect(formatDelta(1500, { compact: true, percent: "literal" })).toBe(
      "+1,500%",
    );
    expect(formatDelta(15, { compact: true, percent: "ratio" })).toBe(
      "+1,500%",
    );
  });

  it("percent: 'literal' prints no float noise", () => {
    expect(formatDelta(12.3, { percent: "literal", digits: 20 })).toBe(
      "+12.3%",
    );
  });

  it("percent: 'ratio' treats the value as a fraction", () => {
    expect(formatDelta(0.12, { percent: "ratio" })).toBe("+12%");
  });

  it("formatOptions merges in extra Intl.NumberFormat options, such as currency", () => {
    expect(
      formatDelta(5, { formatOptions: { style: "currency", currency: "USD" } }),
    ).toBe("+$5.00");
  });

  it("a custom format fn gets a '+' prepended only for positive values", () => {
    const format = (value: number) => `${value}!`;
    expect(formatDelta(5, { format })).toBe("+5!");
    expect(formatDelta(-5, { format })).toBe("-5!");
    expect(formatDelta(0, { format })).toBe("0!");
  });

  it("locale de-DE uses a comma decimal separator", () => {
    const result = formatDelta(1234.5, { locale: "de-DE", digits: 1 });
    expect(result).toMatch(/^\+[\d.]+,5$/);
  });
});
