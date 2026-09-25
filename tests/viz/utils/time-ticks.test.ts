import {
  niceTimeDomain,
  timeTickFormat,
  timeTicks,
} from "../../../src/viz/utils/time-ticks.js";

describe("timeTicks", () => {
  test("a year span gives month ticks on the 1st", () => {
    const start = Date.UTC(2023, 0, 1);
    const end = Date.UTC(2024, 0, 1);
    const result = timeTicks(start, end, 6, { utc: true });
    expect(result.interval).toBe("month");
    for (const value of result.values) {
      expect(new Date(value).getUTCDate()).toBe(1);
    }
  });

  test("an ~8 hour span gives hourly-ish ticks within 50% of the requested count", () => {
    const start = Date.UTC(2024, 0, 1, 0, 0, 0);
    const end = Date.UTC(2024, 0, 1, 8, 0, 0);
    const result = timeTicks(start, end, 6, { utc: true });
    expect(result.interval).toBe("hour");
    expect(Math.abs(result.values.length - 6)).toBeLessThanOrEqual(3);
  });

  test("spans from 10 seconds to 50 years always produce 2-12 ascending ticks within bounds", () => {
    const start = Date.UTC(2020, 0, 1);
    const maxSpan = 50 * 365 * 24 * 3600 * 1000;
    let span = 10 * 1000;
    let iterations = 0;
    while (span <= maxSpan) {
      const end = start + span;
      const result = timeTicks(start, end, 6, { utc: true });
      expect(result.values.length).toBeGreaterThanOrEqual(2);
      expect(result.values.length).toBeLessThanOrEqual(12);
      for (let i = 1; i < result.values.length; i++) {
        expect(result.values[i]).toBeGreaterThan(result.values[i - 1]);
      }
      for (const value of result.values) {
        expect(value).toBeGreaterThanOrEqual(start);
        expect(value).toBeLessThanOrEqual(end);
      }
      span *= 3;
      iterations++;
    }
    expect(iterations).toBeGreaterThan(10);
  });

  test("multi-year spans use 1/2/5/10-year steps landing on Jan 1", () => {
    const start = Date.UTC(2000, 0, 1);
    const end = Date.UTC(2050, 0, 1);
    const result = timeTicks(start, end, 6, { utc: true });
    expect(result.interval).toBe("year");
    expect([1, 2, 5, 10]).toContain(result.step);
    for (const value of result.values) {
      const date = new Date(value);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
    }
  });

  test("a 2-day step restarts at the 1st of a new month", () => {
    const start = Date.UTC(2024, 0, 25);
    const end = start + 900_000_000;
    const result = timeTicks(start, end, 6, { utc: true });
    expect(result.interval).toBe("day");
    expect(result.step).toBeGreaterThan(1);
    let previousMonth = new Date(result.values[0]).getUTCMonth();
    for (let i = 1; i < result.values.length; i++) {
      const date = new Date(result.values[i]);
      const month = date.getUTCMonth();
      if (month !== previousMonth) expect(date.getUTCDate()).toBe(1);
      previousMonth = month;
    }
  });

  test("reversed bounds give the same result as ascending bounds", () => {
    const start = Date.UTC(2024, 0, 1);
    const end = Date.UTC(2024, 0, 10);
    expect(timeTicks(end, start, 6, { utc: true })).toEqual(
      timeTicks(start, end, 6, { utc: true }),
    );
  });

  test("start === end returns that one value", () => {
    const t = Date.UTC(2024, 0, 1);
    expect(timeTicks(t, t, 6, { utc: true }).values).toEqual([t]);
  });

  test("non-finite bounds return an empty values array", () => {
    expect(timeTicks(Number.NaN, Date.UTC(2024, 0, 1)).values).toEqual([]);
  });

  test("local time: a 5-day span puts every daily tick at local midnight", () => {
    const start = new Date(2024, 0, 1).getTime();
    const end = new Date(2024, 0, 6).getTime();
    const result = timeTicks(start, end, 6);
    expect(result.values.length).toBeGreaterThan(0);
    for (const value of result.values) {
      const date = new Date(value);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    }
  });
});

describe("niceTimeDomain", () => {
  test("the result contains the input and lands on calendar boundaries", () => {
    const start = Date.UTC(2024, 0, 13);
    const end = Date.UTC(2024, 10, 20);
    const [lo, hi] = niceTimeDomain(start, end, 6, { utc: true });
    expect(lo).toBeLessThanOrEqual(start);
    expect(hi).toBeGreaterThanOrEqual(end);
    expect(lo).toBe(Date.UTC(2024, 0, 1));
    expect(hi).toBe(Date.UTC(2025, 0, 1));
  });

  test("a non-ascending input is returned unchanged", () => {
    expect(niceTimeDomain(5, 1, 6)).toEqual([5, 1]);
  });

  test("a non-finite input is returned unchanged", () => {
    const result = niceTimeDomain(Number.NaN, 1, 6);
    expect(Number.isNaN(result[0])).toBe(true);
    expect(result[1]).toBe(1);
  });
});

describe("timeTickFormat", () => {
  test("returns a function producing a non-empty string", () => {
    const format = timeTickFormat("day");
    expect(format(Date.UTC(2024, 0, 1)).length).toBeGreaterThan(0);
  });

  test("formats a month-interval tick as an abbreviated month with utc + en-US", () => {
    const format = timeTickFormat("month", "en-US", { utc: true });
    expect(format(Date.UTC(2026, 5, 15))).toMatch(/^Jun/);
  });

  test("formats a year-interval tick as the full year with utc + en-US", () => {
    const format = timeTickFormat("year", "en-US", { utc: true });
    expect(format(Date.UTC(2026, 5, 15))).toBe("2026");
  });
});
