import {
  formatCompact,
  formatDuration,
  formatPercent,
  resolveFormat,
} from "../../../src/viz/utils/format-compact.js";

describe("formatCompact", () => {
  test("stable en-US cases", () => {
    expect(formatCompact(10000)).toBe("10K");
    expect(formatCompact(1234567)).toBe("1.2M");
  });

  test("1,000 calls complete and return identical strings", () => {
    const results = new Set<string>();
    for (let i = 0; i < 1000; i++) results.add(formatCompact(1234567));
    expect(results.size).toBe(1);
    expect(results.has("1.2M")).toBe(true);
  });
});

describe("formatPercent", () => {
  test("stable en-US cases", () => {
    expect(formatPercent(0.084)).toBe("8.4%");
    expect(formatPercent(0.084, { signed: true })).toBe("+8.4%");
  });
});

describe("formatDuration", () => {
  test.each([
    [0, "0ms"],
    [250, "250ms"],
    [1000, "1s"],
    [90_000, "1m 30s"],
    [36 * 3_600_000, "1d 12h"],
    [4 * 86_400_000, "4d"],
    [-90_000, "-1m 30s"],
  ])("formatDuration(%p) === %p", (ms, expected) => {
    expect(formatDuration(ms as number)).toBe(expected);
  });

  test("largest: 3 shows three units", () => {
    expect(formatDuration(3_723_000, { largest: 3 })).toBe("1h 2m 3s");
  });

  test("non-finite values return an empty string", () => {
    expect(formatDuration(Number.NaN)).toBe("");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("");
  });

  test("style: 'long' spells out units", () => {
    expect(formatDuration(8_100_000, { style: "long" })).toMatch(
      /2 hours? 15 minutes?/,
    );
  });
});

describe("resolveFormat", () => {
  test("undefined resolves to compact notation", () => {
    expect(resolveFormat(undefined)(1234567)).toBe("1.2M");
  });

  test("an options object resolves to Intl formatting", () => {
    expect(resolveFormat({ style: "currency", currency: "USD" })(12.5)).toBe(
      "$12.50",
    );
  });

  test("a function passes through untouched", () => {
    const fn = (value: number) => `${value}!`;
    expect(resolveFormat(fn)).toBe(fn);
  });
});
