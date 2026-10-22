import { describeSeries } from "../../../src/viz/utils/describe-series.js";

describe("describeSeries", () => {
  test("an increase reports an 'up' trend", () => {
    const result = describeSeries([100, 150]);
    expect(result.trend).toBe("up");
    expect(result.changeRatio).toBeCloseTo(0.5);
  });

  test("a decrease reports a 'down' trend", () => {
    const result = describeSeries([150, 100]);
    expect(result.trend).toBe("down");
    expect(result.changeRatio).toBeCloseTo(-1 / 3);
  });

  test("a change within 1% of the first value counts as flat", () => {
    expect(describeSeries([100, 100.5]).trend).toBe("flat");
    expect(describeSeries([100, 102]).trend).toBe("up");
  });

  test("first === 0 gives a direction without a percentage", () => {
    const result = describeSeries([0, 50]);
    expect(result.trend).toBe("up");
    expect(result.changeRatio).toBeNull();
    expect(result.text.startsWith("Trending up.")).toBe(true);
  });

  test("the trend sentence includes a percent computed the same way Intl would", () => {
    const result = describeSeries([150, 100]);
    const expectedPercent = new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(50 / 150);
    expect(result.text).toContain(`Trending down ${expectedPercent}.`);
  });

  test("empty input returns count 0 and 'No data.'", () => {
    const result = describeSeries([]);
    expect(result.count).toBe(0);
    expect(result.text).toBe("No data.");
  });

  test("ignores null, undefined, and NaN entries", () => {
    const result = describeSeries([null, 10, Number.NaN, 20, undefined]);
    expect(result.count).toBe(2);
    expect(result.first).toBe(10);
    expect(result.last).toBe(20);
  });

  test("custom messages override the sentence builders", () => {
    const result = describeSeries([1, 2], {
      messages: {
        trend: () => "custom trend.",
        range: () => "custom range.",
      },
    });
    expect(result.text).toBe("custom trend. custom range.");
  });

  test("a custom format is used for min, max, and last", () => {
    const result = describeSeries([1000, 2000], {
      format: (value) => `#${value}`,
    });
    expect(result.text).toContain(
      "Minimum #1000, maximum #2000, latest #2000.",
    );
  });

  test("stats fields are computed correctly", () => {
    const result = describeSeries([5, 1, 9, 3]);
    expect(result.count).toBe(4);
    expect(result.min).toBe(1);
    expect(result.max).toBe(9);
    expect(result.first).toBe(5);
    expect(result.last).toBe(3);
    expect(result.mean).toBe(4.5);
    expect(result.changeRatio).toBeCloseTo(-0.4);
  });
});
