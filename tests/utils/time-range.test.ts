// @vitest-environment node
import {
  calendarRange,
  defaultTimeRanges,
  describeTimeRange,
  formatAbsoluteRange,
  formatTimeRange,
  formatUtcOffset,
  instantFromWall,
  isTimeBound,
  isTimeZone,
  lastRange,
  parseDuration,
  parseTimeBound,
  parseTimeRange,
  parseTimeRangeText,
  relativeRangeLabel,
  resolveRange,
  resolveWeekStart,
  sameTimeRange,
  serializeTimeRange,
  stepRange,
  timeRangeFromSearchParams,
  timeRangeToSearchParams,
  timeZoneOffset,
  validateRange,
  wallTime,
  zoomRange,
} from "../../src/utils/time-range.js";

const NY = "America/New_York";
const BERLIN = "Europe/Berlin";

/** Resolve and print both ends as UTC. */
function resolved(
  value: { from: string; to: string },
  now: string,
  timeZone = "UTC",
  extra: { weekStart?: number } = {},
) {
  const { start, end } = resolveRange(value, { now, timeZone, ...extra });
  return [start.toISOString(), end.toISOString()];
}

describe("time zone arithmetic", () => {
  it("reads offsets from Intl, including half and quarter hours", () => {
    expect(timeZoneOffset(new Date("2026-01-15T12:00:00Z"), NY)).toBe(-300);
    expect(timeZoneOffset(new Date("2026-07-01T12:00:00Z"), NY)).toBe(-240);
    expect(timeZoneOffset(new Date("2026-07-01T12:00:00Z"), BERLIN)).toBe(120);
    expect(
      timeZoneOffset(new Date("2026-07-01T12:00:00Z"), "Asia/Kolkata"),
    ).toBe(330);
    expect(
      timeZoneOffset(new Date("2026-07-01T12:00:00Z"), "Asia/Kathmandu"),
    ).toBe(345);
  });

  it("formats an offset with a true minus", () => {
    expect(formatUtcOffset(0)).toBe("UTC");
    expect(formatUtcOffset(-300)).toBe("UTC−5");
    expect(formatUtcOffset(330)).toBe("UTC+5:30");
    expect(formatUtcOffset(345)).toBe("UTC+5:45");
  });

  it("knows which names are zones", () => {
    expect(isTimeZone(NY)).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
  });

  it.each([
    // Clocks go forward: 02:30 never happens and reads as 03:30.
    [NY, { month: 3, day: 8, hour: 2, minute: 30 }, "2026-03-08T07:30:00.000Z"],
    [
      BERLIN,
      { month: 3, day: 29, hour: 2, minute: 30 },
      "2026-03-29T01:30:00.000Z",
    ],
    // Clocks go back: 01:30 happens twice, the first one wins.
    [
      NY,
      { month: 11, day: 1, hour: 1, minute: 30 },
      "2026-11-01T05:30:00.000Z",
    ],
    [
      BERLIN,
      { month: 10, day: 25, hour: 2, minute: 30 },
      "2026-10-25T00:30:00.000Z",
    ],
    // Around the change, the ordinary hours keep their offset.
    [NY, { month: 3, day: 8, hour: 1, minute: 59 }, "2026-03-08T06:59:00.000Z"],
    [NY, { month: 3, day: 8, hour: 3, minute: 0 }, "2026-03-08T07:00:00.000Z"],
    [NY, { month: 11, day: 1, hour: 2, minute: 0 }, "2026-11-01T07:00:00.000Z"],
  ])("maps a wall time in %s on a clock change", (zone, parts, expected) => {
    const wall = { year: 2026, second: 0, ms: 0, ...parts };
    expect(new Date(instantFromWall(wall, zone)).toISOString()).toBe(expected);
  });

  it("round-trips every instant across both zones' clock changes", () => {
    const failures: string[] = [];
    for (const [zone, from] of [
      [NY, "2026-03-07T00:00:00Z"],
      [NY, "2026-10-31T00:00:00Z"],
      [BERLIN, "2026-03-28T00:00:00Z"],
      [BERLIN, "2026-10-24T00:00:00Z"],
    ]) {
      for (
        let t = +new Date(from);
        t < +new Date(from) + 4 * 86400000;
        t += 15 * 60000
      ) {
        const back = instantFromWall(wallTime(t, zone), zone);
        // The second pass through a repeated hour reads as the first.
        if (back !== t && !(back < t && t - back === 3600000)) {
          failures.push(`${zone} ${new Date(t).toISOString()}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("parseTimeBound", () => {
  it.each([
    ["now", true],
    ["NOW", true],
    ["now-15m", true],
    ["now+1h", true],
    ["now-1d/d", true],
    ["now/w", true],
    ["now-1M/M", true],
    ["now/d+8h", true],
    ["now - 2h", true],
    ["now 1h", true], // a "+" that a URL turned into a space
    ["now-1y", true],
    ["2026-11-06", true],
    ["2026-11-06T09:00", true],
    ["2026-11-06 09:00:30", true],
    ["2026-11-06T14:00:00.000Z", true],
    ["2026-11-06T09:00:00-05:00", true],
    ["2026-11-06T09:00:00+0530", true],
    ["1794000000000", true],
    ["", false],
    ["yesterday", false],
    ["now-", false],
    ["now-2x", false],
    ["now-h", false],
    ["now/", false],
    ["2026-13-01", false],
    ["2026-02-30", false],
    ["2026-11-06T25:00", false],
    ["2026-11-06T09:00+25:00", false],
    ["11/06/2026", false],
  ])("reads %j: %s", (text, ok) => {
    expect(isTimeBound(text)).toBe(ok);
  });

  it("is case sensitive for units, so m and M differ", () => {
    expect(parseTimeBound("now-1m")?.ops).toEqual([
      { type: "add", n: -1, unit: "m" },
    ]);
    expect(parseTimeBound("now-1M")?.ops).toEqual([
      { type: "add", n: -1, unit: "M" },
    ]);
  });
});

describe("resolveRange", () => {
  const now = "2026-11-06T17:30:00.000Z"; // 12:30 in New York

  it("reads relative ends against now", () => {
    expect(resolved({ from: "now-15m", to: "now" }, now)).toEqual([
      "2026-11-06T17:15:00.000Z",
      now,
    ]);
    expect(resolved({ from: "now-2h", to: "now+30m" }, now)).toEqual([
      "2026-11-06T15:30:00.000Z",
      "2026-11-06T18:00:00.000Z",
    ]);
  });

  it("returns Invalid Dates, never throws, for a bound that does not read", () => {
    const { start, end } = resolveRange({ from: "soon", to: "now" }, { now });
    expect(Number.isNaN(+start)).toBe(true);
    expect(Number.isNaN(+end)).toBe(false);
  });

  it("keeps absolute ends as they are and reads a wall time in the zone", () => {
    const value = { from: "2026-11-06T09:00", to: "2026-11-06T12:30" };
    expect(resolved(value, now, NY)).toEqual([
      "2026-11-06T14:00:00.000Z",
      "2026-11-06T17:30:00.000Z",
    ]);
    expect(resolved(value, now, BERLIN)).toEqual([
      "2026-11-06T08:00:00.000Z",
      "2026-11-06T11:30:00.000Z",
    ]);
    // An offset in the text wins over the zone.
    expect(
      resolved(
        { from: "2026-11-06T09:00:00-05:00", to: "2026-11-06T14:00:00Z" },
        now,
        BERLIN,
      ),
    ).toEqual(["2026-11-06T14:00:00.000Z", "2026-11-06T14:00:00.000Z"]);
  });

  it("reads a date alone as the whole day", () => {
    expect(resolved({ from: "2026-11-06", to: "2026-11-06" }, now, NY)).toEqual(
      ["2026-11-06T05:00:00.000Z", "2026-11-07T04:59:59.999Z"],
    );
  });

  describe("rounding", () => {
    it("rounds from down and to up, in the zone", () => {
      expect(resolved({ from: "now/d", to: "now/d" }, now, NY)).toEqual([
        "2026-11-06T05:00:00.000Z",
        "2026-11-07T04:59:59.999Z",
      ]);
      expect(resolved({ from: "now/d", to: "now/d" }, now, "UTC")).toEqual([
        "2026-11-06T00:00:00.000Z",
        "2026-11-06T23:59:59.999Z",
      ]);
      expect(resolved({ from: "now/h", to: "now/h" }, now)).toEqual([
        "2026-11-06T17:00:00.000Z",
        "2026-11-06T17:59:59.999Z",
      ]);
      expect(resolved({ from: "now/d", to: "now" }, now, NY)[0]).toBe(
        "2026-11-06T05:00:00.000Z",
      );
    });

    it("rounds mid-chain bounds down, and only the last rounding up", () => {
      expect(resolved({ from: "now/d+8h", to: "now/d+17h" }, now, NY)).toEqual([
        "2026-11-06T13:00:00.000Z",
        "2026-11-06T22:00:00.000Z",
      ]);
      expect(resolved({ from: "now-1d/d", to: "now-1d/d" }, now, NY)).toEqual([
        "2026-11-05T05:00:00.000Z",
        "2026-11-06T04:59:59.999Z",
      ]);
    });

    it("starts the week on the day the zone's locale does", () => {
      // Friday, November 6, 2026.
      const week = { from: "now/w", to: "now/w" };
      expect(resolved(week, now, NY, { weekStart: 1 })).toEqual([
        "2026-11-02T05:00:00.000Z",
        "2026-11-09T04:59:59.999Z",
      ]);
      expect(resolved(week, now, NY, { weekStart: 0 })).toEqual([
        "2026-11-01T04:00:00.000Z",
        "2026-11-08T04:59:59.999Z",
      ]);
      expect(resolved(week, now, NY, { weekStart: 6 })).toEqual([
        "2026-10-31T04:00:00.000Z",
        "2026-11-07T04:59:59.999Z",
      ]);
      expect(resolved(week, now, "UTC", { weekStart: 5 })[0]).toBe(
        "2026-11-06T00:00:00.000Z",
      );
    });

    it("takes the week start from the locale option", () => {
      const week = { from: "now/w", to: "now/w" };
      const us = resolveRange(week, {
        now,
        timeZone: "UTC",
        locale: "en-US",
      }).start;
      const de = resolveRange(week, {
        now,
        timeZone: "UTC",
        locale: "de-DE",
      }).start;
      expect(us.toISOString()).toBe("2026-11-01T00:00:00.000Z");
      expect(de.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    });

    it("rounds months and years, with a leap February", () => {
      expect(
        resolved({ from: "now/M", to: "now/M" }, "2028-02-10T12:00:00Z"),
      ).toEqual(["2028-02-01T00:00:00.000Z", "2028-02-29T23:59:59.999Z"]);
      expect(
        resolved({ from: "now/y", to: "now/y" }, "2026-11-06T12:00:00Z", NY),
      ).toEqual(["2026-01-01T05:00:00.000Z", "2027-01-01T04:59:59.999Z"]);
      expect(
        resolved({ from: "now-1M/M", to: "now-1M/M" }, "2026-01-15T12:00:00Z"),
      ).toEqual(["2025-12-01T00:00:00.000Z", "2025-12-31T23:59:59.999Z"]);
    });
  });

  describe("calendar units across a clock change", () => {
    it("counts d, w, M and y on the wall clock and s, m, h as elapsed time", () => {
      // Sunday March 8, 2026 08:00 in New York, five hours after clocks went forward.
      const spring = "2026-03-08T12:00:00.000Z";
      expect(resolved({ from: "now-1d", to: "now" }, spring, NY)[0]).toBe(
        "2026-03-07T13:00:00.000Z", // 08:00 on Saturday, 23 hours earlier
      );
      expect(resolved({ from: "now-24h", to: "now" }, spring, NY)[0]).toBe(
        "2026-03-07T12:00:00.000Z", // 07:00 on Saturday, exactly 24 hours earlier
      );
      expect(resolved({ from: "now-1w", to: "now" }, spring, NY)[0]).toBe(
        "2026-03-01T13:00:00.000Z",
      );
      expect(resolved({ from: "now-168h", to: "now" }, spring, NY)[0]).toBe(
        "2026-03-01T12:00:00.000Z",
      );
    });

    it("keeps Yesterday on yesterday just after midnight on a clock change", () => {
      // Monday March 9 at 00:30 in New York, a day after the 23 hour day.
      const after = "2026-03-09T04:30:00.000Z";
      expect(resolved({ from: "now-1d/d", to: "now-1d/d" }, after, NY)).toEqual(
        ["2026-03-08T05:00:00.000Z", "2026-03-09T03:59:59.999Z"],
      );
    });

    it.each([
      [
        "New York spring forward, 23 hours",
        NY,
        "2026-03-08T15:00:00Z",
        "2026-03-08T05:00:00.000Z",
        "2026-03-09T03:59:59.999Z",
      ],
      [
        "New York fall back, 25 hours",
        NY,
        "2026-11-01T15:00:00Z",
        "2026-11-01T04:00:00.000Z",
        "2026-11-02T04:59:59.999Z",
      ],
      [
        "Berlin spring forward, 23 hours",
        BERLIN,
        "2026-03-29T12:00:00Z",
        "2026-03-28T23:00:00.000Z",
        "2026-03-29T21:59:59.999Z",
      ],
      [
        "Berlin fall back, 25 hours",
        BERLIN,
        "2026-10-25T12:00:00Z",
        "2026-10-24T22:00:00.000Z",
        "2026-10-25T22:59:59.999Z",
      ],
    ])("Today on %s", (_label, zone, now, start, end) => {
      expect(resolved({ from: "now/d", to: "now/d" }, now, zone)).toEqual([
        start,
        end,
      ]);
    });

    it("starts a day at 01:00 where clocks skip midnight, and ends it at the next midnight", () => {
      // Cuba: at 00:00 on Sunday March 8, 2026 clocks go to 01:00.
      const havana = "America/Havana";
      expect(
        resolved(
          { from: "now/d", to: "now/d" },
          "2026-03-08T12:00:00Z",
          havana,
        ),
      ).toEqual(["2026-03-08T05:00:00.000Z", "2026-03-09T03:59:59.999Z"]);
      expect(
        resolved(
          { from: "now/d", to: "now/d" },
          "2026-03-09T12:00:00Z",
          havana,
        ),
      ).toEqual(["2026-03-09T04:00:00.000Z", "2026-03-10T03:59:59.999Z"]);
      // The week and the month that hold that day start at the true midnight.
      expect(
        resolved(
          { from: "now/M", to: "now/M" },
          "2026-03-08T12:00:00Z",
          havana,
        ),
      ).toEqual(["2026-03-01T05:00:00.000Z", "2026-04-01T03:59:59.999Z"]);
    });

    it("steps across a day that started at 01:00 without drifting an hour", () => {
      const options = {
        now: "2026-03-09T12:00:00Z",
        timeZone: "America/Havana",
      };
      expect(stepRange({ from: "now/d", to: "now/d" }, -1, options)).toEqual({
        from: "2026-03-08T05:00:00.000Z",
        to: "2026-03-09T03:59:59.999Z",
      });
      expect(
        stepRange(
          { from: "2026-03-08T05:00:00.000Z", to: "2026-03-09T03:59:59.999Z" },
          1,
          options,
        ),
      ).toEqual({
        from: "2026-03-09T04:00:00.000Z",
        to: "2026-03-10T03:59:59.999Z",
      });
    });

    it.each([
      [
        "Lord Howe, 30 minute change forward",
        "Australia/Lord_Howe",
        "2026-10-04T12:00:00Z",
        23.5,
      ],
      [
        "Lord Howe, 30 minute change back",
        "Australia/Lord_Howe",
        "2026-04-05T12:00:00Z",
        24.5,
      ],
      [
        "Kathmandu, no change, a 45 minute offset",
        "Asia/Kathmandu",
        "2026-11-06T12:00:00Z",
        24,
      ],
    ])("makes Today %s", (_label, zone, now, hours) => {
      const [start, end] = resolved({ from: "now/d", to: "now/d" }, now, zone);
      expect((+new Date(end) + 1 - +new Date(start)) / 3600000).toBe(hours);
    });

    it("rounds the hour inside the repeated hour to the second pass", () => {
      // 01:30 EST, the second time that wall time happens in New York.
      const second = "2026-11-01T06:30:00.000Z";
      expect(resolved({ from: "now/h", to: "now/h" }, second, NY)).toEqual([
        "2026-11-01T06:00:00.000Z",
        "2026-11-01T06:59:59.999Z",
      ]);
    });

    it("moves a month or a year to the last day it has", () => {
      expect(
        resolved({ from: "now-1M", to: "now" }, "2026-03-31T12:00:00Z")[0],
      ).toBe("2026-02-28T12:00:00.000Z");
      expect(
        resolved({ from: "now-1y", to: "now" }, "2028-02-29T12:00:00Z")[0],
      ).toBe("2027-02-28T12:00:00.000Z");
      expect(
        resolved({ from: "now+1M", to: "now" }, "2026-01-31T12:00:00Z")[0],
      ).toBe("2026-02-28T12:00:00.000Z");
    });

    it("lands a time that falls in the gap after it", () => {
      // 02:30 on March 8 in New York never happens.
      expect(
        resolved(
          { from: "2026-03-08T02:30", to: "2026-03-08T04:00" },
          "2026-03-08T12:00:00Z",
          NY,
        ),
      ).toEqual(["2026-03-08T07:30:00.000Z", "2026-03-08T08:00:00.000Z"]);
    });
  });

  describe("the clock", () => {
    afterEach(() => vi.useRealTimers());

    it("reads now from the clock when it is not given, so a relative value moves", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-06T12:00:00Z"));
      const value = { from: "now-15m", to: "now" };
      expect(resolveRange(value).end.toISOString()).toBe(
        "2026-11-06T12:00:00.000Z",
      );
      vi.advanceTimersByTime(5 * 60000);
      const later = resolveRange(value);
      expect(later.start.toISOString()).toBe("2026-11-06T11:50:00.000Z");
      expect(later.end.toISOString()).toBe("2026-11-06T12:05:00.000Z");
      expect(value).toEqual({ from: "now-15m", to: "now" });
    });

    it("moves Today to the next day at midnight in the zone, not in UTC", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-07T04:59:00Z")); // 23:59 in New York
      const today = { from: "now/d", to: "now/d" };
      expect(resolveRange(today, { timeZone: NY }).start.toISOString()).toBe(
        "2026-11-06T05:00:00.000Z",
      );
      vi.advanceTimersByTime(2 * 60000);
      expect(resolveRange(today, { timeZone: NY }).start.toISOString()).toBe(
        "2026-11-07T05:00:00.000Z",
      );
    });
  });
});

describe("resolveWeekStart", () => {
  it.each([
    ["en-US", 0],
    ["en", 0],
    ["de-DE", 1],
    ["en-GB", 1],
    ["fr", 1],
    ["ar-EG", 6],
    ["he-IL", 0],
    ["pt-BR", 0],
    ["ja-JP", 0],
  ])("%s starts on %i", (locale, day) => {
    expect(resolveWeekStart(locale)).toBe(day);
  });

  it("falls back to the DatePicker's table where Intl has no week info", () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const getWeekInfo = Object.getOwnPropertyDescriptor(proto, "getWeekInfo");
    const weekInfo = Object.getOwnPropertyDescriptor(proto, "weekInfo");
    Object.defineProperty(proto, "getWeekInfo", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(proto, "weekInfo", {
      value: undefined,
      configurable: true,
    });
    try {
      // Locales this file has not asked about, so nothing is cached.
      expect(resolveWeekStart("en-CA")).toBe(0);
      expect(resolveWeekStart("fr-CH")).toBe(1);
      expect(resolveWeekStart("ar-SA")).toBe(0);
      expect(resolveWeekStart("ar-DZ")).toBe(6);
    } finally {
      if (getWeekInfo) Object.defineProperty(proto, "getWeekInfo", getWeekInfo);
      else Reflect.deleteProperty(proto, "getWeekInfo");
      if (weekInfo) Object.defineProperty(proto, "weekInfo", weekInfo);
      else Reflect.deleteProperty(proto, "weekInfo");
    }
  });

  it("does not throw on a tag that is not a locale", () => {
    expect(resolveWeekStart("not a locale")).toBe(1);
  });
});

describe("parseTimeRangeText", () => {
  it.each([
    ["last 90 minutes", { from: "now-90m", to: "now" }],
    ["Last 90 Minutes", { from: "now-90m", to: "now" }],
    ["past 2 hrs", { from: "now-2h", to: "now" }],
    ["last 30d", { from: "now-30d", to: "now" }],
    ["last 1 week", { from: "now-1w", to: "now" }],
    ["last 3 months", { from: "now-3M", to: "now" }],
    ["today", { from: "now/d", to: "now/d" }],
    ["yesterday", { from: "now-1d/d", to: "now-1d/d" }],
    ["this week", { from: "now/w", to: "now/w" }],
    ["last week", { from: "now-1w/w", to: "now-1w/w" }],
    ["previous month", { from: "now-1M/M", to: "now-1M/M" }],
    ["now-2h to now", { from: "now-2h", to: "now" }],
    ["now-2h..now", { from: "now-2h", to: "now" }],
    ["now-6h - now-1h", { from: "now-6h", to: "now-1h" }],
    [
      "2026-11-06 09:00 to 2026-11-06 12:30",
      { from: "2026-11-06 09:00", to: "2026-11-06 12:30" },
    ],
  ])("reads %j", (text, expected) => {
    expect(parseTimeRangeText(text)).toEqual(expected);
  });

  it.each([
    "",
    "last",
    "last 0 minutes",
    "last 5 fortnights",
    "now-2h",
    "soon to now",
    "last 5",
  ])("rejects %j", (text) => {
    expect(parseTimeRangeText(text)).toBeNull();
  });
});

describe("a range typed with long runs of spaces", () => {
  it.each([
    ["spaces", " ".repeat(200_000) + "x"],
    ["spaces and a separator word", `now${" ".repeat(100_000)}to`],
    ["spaces around a dash", `now${" ".repeat(100_000)}-x`],
  ])("is refused in linear time: %s", (_label, text) => {
    const start = performance.now();
    expect(parseTimeRangeText(text)).toBeNull();
    expect(parseTimeRange(text)).toBeNull();
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("still reads one with extra spaces", () => {
    expect(parseTimeRangeText("now-2h    to     now")).toEqual({
      from: "now-2h",
      to: "now",
    });
  });
});

describe("validateRange", () => {
  const now = "2026-11-06T17:30:00.000Z";
  const check = (value: { from: string; to: string }, extra = {}) =>
    validateRange(value, { now, timeZone: NY, ...extra });

  it("accepts a range whose end follows its start", () => {
    expect(check({ from: "now-15m", to: "now" })).toEqual({ valid: true });
  });

  it("names the end that does not read", () => {
    expect(check({ from: "soon", to: "now" })).toEqual({
      valid: false,
      problem: "invalid-from",
    });
    expect(check({ from: "now-1h", to: "later" })).toEqual({
      valid: false,
      problem: "invalid-to",
    });
  });

  it("needs the end after the start", () => {
    expect(check({ from: "now", to: "now" })).toEqual({
      valid: false,
      problem: "order",
    });
    expect(check({ from: "now", to: "now-1h" })).toEqual({
      valid: false,
      problem: "order",
    });
    expect(check({ from: "2026-11-06T12:00", to: "2026-11-06T09:00" })).toEqual(
      { valid: false, problem: "order" },
    );
  });

  it("holds a range inside min and max, which can be bounds", () => {
    expect(check({ from: "now-45d", to: "now" }, { min: "now-30d" })).toEqual({
      valid: false,
      problem: "before-min",
    });
    expect(check({ from: "now-1h", to: "now+1h" }, { max: "now" })).toEqual({
      valid: false,
      problem: "after-max",
    });
    expect(
      check(
        { from: "now-1h", to: "now" },
        { max: "now", min: new Date("2026-01-01") },
      ),
    ).toEqual({
      valid: true,
    });
    // `max: "now"` ends the range at the same instant as `to: "now"`.
    expect(check({ from: "now-1h", to: "now/d" }, { max: "now" })).toEqual({
      valid: false,
      problem: "after-max",
    });
  });

  it("limits the length", () => {
    expect(check({ from: "now-8d", to: "now" }, { maxRange: "7d" })).toEqual({
      valid: false,
      problem: "too-long",
    });
    expect(check({ from: "now-7d", to: "now" }, { maxRange: "7d" })).toEqual({
      valid: true,
    });
    expect(check({ from: "now-30s", to: "now" }, { minRange: "1m" })).toEqual({
      valid: false,
      problem: "too-short",
    });
  });

  it("reads durations", () => {
    expect(parseDuration("90m")).toBe(90 * 60000);
    expect(parseDuration("2w")).toBe(14 * 86400000);
    expect(parseDuration(500)).toBe(500);
    expect(parseDuration("1M")).toBeNaN();
  });
});

describe("stepRange", () => {
  const now = "2026-11-06T17:30:00.000Z";

  it("moves a rolling range by its own length, back to back", () => {
    const back = stepRange({ from: "now-15m", to: "now" }, -1, { now });
    expect(back).toEqual({
      from: "2026-11-06T17:00:00.000Z",
      to: "2026-11-06T17:15:00.000Z",
    });
    // Stepping back again leaves no gap and no overlap.
    expect(stepRange(back!, -1, { now })).toEqual({
      from: "2026-11-06T16:45:00.000Z",
      to: "2026-11-06T17:00:00.000Z",
    });
  });

  it("moves forward and stops at max", () => {
    const value = {
      from: "2026-11-06T16:45:00.000Z",
      to: "2026-11-06T17:00:00.000Z",
    };
    expect(stepRange(value, 1, { now, max: "now" })).toEqual({
      from: "2026-11-06T17:00:00.000Z",
      to: "2026-11-06T17:15:00.000Z",
    });
    const near = {
      from: "2026-11-06T17:10:00.000Z",
      to: "2026-11-06T17:25:00.000Z",
    };
    // Moved back so it ends at max, keeping its length.
    expect(stepRange(near, 1, { now, max: "now" })).toEqual({
      from: "2026-11-06T17:15:00.000Z",
      to: now,
    });
    expect(
      stepRange({ from: "now-15m", to: "now" }, 1, { now, max: "now" }),
    ).toBeNull();
  });

  it("moves whole days by the calendar, so Today steps to Yesterday on a 23 hour day", () => {
    // Monday March 9, 2026 in New York.
    const today = stepRange({ from: "now/d", to: "now/d" }, -1, {
      now: "2026-03-09T16:00:00Z",
      timeZone: NY,
    });
    expect(today).toEqual({
      from: "2026-03-08T05:00:00.000Z",
      to: "2026-03-09T03:59:59.999Z",
    });
    // And again, onto the 23 hour day's Saturday.
    expect(stepRange(today!, -1, { timeZone: NY, now })).toEqual({
      from: "2026-03-07T05:00:00.000Z",
      to: "2026-03-08T04:59:59.999Z",
    });
    // Forward from Saturday lands on the short day.
    expect(
      stepRange(
        { from: "2026-03-07T05:00:00.000Z", to: "2026-03-08T04:59:59.999Z" },
        1,
        {
          timeZone: NY,
          now,
        },
      ),
    ).toEqual({
      from: "2026-03-08T05:00:00.000Z",
      to: "2026-03-09T03:59:59.999Z",
    });
  });

  it("moves This week to the previous week and This month to the previous month", () => {
    expect(
      stepRange({ from: "now/w", to: "now/w" }, -1, {
        now,
        timeZone: BERLIN,
        weekStart: 1,
      }),
    ).toEqual({
      from: "2026-10-25T23:00:00.000Z",
      to: "2026-11-01T22:59:59.999Z",
    });
    // October 26 to November 1 in Berlin spans the clock change on the 25th.
    expect(
      stepRange({ from: "now/M", to: "now/M" }, -1, { now, timeZone: BERLIN }),
    ).toEqual({
      from: "2026-09-30T22:00:00.000Z",
      to: "2026-10-31T22:59:59.999Z",
    });
  });

  it("treats a month as one step even when it is not 30 days", () => {
    const february = {
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-02-28T23:59:59.999Z",
    };
    expect(stepRange(february, 1, { now })).toEqual({
      from: "2026-03-01T00:00:00.000Z",
      to: "2026-03-31T23:59:59.999Z",
    });
  });

  it("returns null for a range that does not read or is empty", () => {
    expect(stepRange({ from: "nope", to: "now" }, -1, { now })).toBeNull();
    expect(stepRange({ from: "now", to: "now" }, -1, { now })).toBeNull();
  });
});

describe("zoomRange", () => {
  const now = "2026-11-06T17:30:00.000Z";

  it("doubles a trailing range and keeps it following the clock", () => {
    expect(zoomRange({ from: "now-15m", to: "now" }, 2, { now })).toEqual({
      from: "now-30m",
      to: "now",
    });
    expect(zoomRange({ from: "now-1d", to: "now" }, 2, { now })).toEqual({
      from: "now-2d",
      to: "now",
    });
  });

  it("doubles an absolute range around its middle", () => {
    expect(
      zoomRange(
        { from: "2026-11-06T10:00:00.000Z", to: "2026-11-06T11:00:00.000Z" },
        2,
        { now },
      ),
    ).toEqual({
      from: "2026-11-06T09:30:00.000Z",
      to: "2026-11-06T11:30:00.000Z",
    });
  });

  it("zooms in", () => {
    const zoomed = zoomRange(
      { from: "2026-11-06T10:00:00.000Z", to: "2026-11-06T12:00:00.000Z" },
      0.5,
      { now },
    );
    expect(zoomed).toEqual({
      from: "2026-11-06T10:30:00.000Z",
      to: "2026-11-06T11:30:00.000Z",
    });
  });

  it("keeps an absolute zoom from ending after max", () => {
    expect(
      zoomRange(
        { from: "2026-11-06T17:00:00.000Z", to: "2026-11-06T17:30:00.000Z" },
        2,
        {
          now,
          max: "now",
        },
      ),
    ).toEqual({ from: "2026-11-06T16:30:00.000Z", to: now });
  });

  it("returns null when it cannot", () => {
    expect(zoomRange({ from: "x", to: "now" }, 2, { now })).toBeNull();
    expect(zoomRange({ from: "now-1h", to: "now" }, 0, { now })).toBeNull();
  });
});

describe("serializing", () => {
  it("writes and reads the string form, relative ends staying relative", () => {
    const value = { from: "now-15m", to: "now" };
    expect(serializeTimeRange(value)).toBe("now-15m..now");
    expect(parseTimeRange("now-15m..now")).toEqual(value);
    const absolute = {
      from: "2026-11-06T14:00:00.000Z",
      to: "2026-11-06T17:30:00.000Z",
    };
    expect(parseTimeRange(serializeTimeRange(absolute))).toEqual(absolute);
    expect(parseTimeRange("now/d..now/d")).toEqual({
      from: "now/d",
      to: "now/d",
    });
  });

  it("reads hand-written text and refuses junk", () => {
    expect(parseTimeRange("last 90 minutes")).toEqual({
      from: "now-90m",
      to: "now",
    });
    expect(parseTimeRange("now-1h..")).toBeNull();
    expect(parseTimeRange("a..b..c")).toBeNull();
    expect(parseTimeRange(null)).toBeNull();
    expect(parseTimeRange(undefined)).toBeNull();
  });

  it("writes from, to and tz parameters and keeps a plus sign", () => {
    const params = timeRangeToSearchParams(
      { from: "now+1h", to: "now+2h" },
      { timeZone: BERLIN },
    );
    expect(params.toString()).toBe(
      "from=now%2B1h&to=now%2B2h&tz=Europe%2FBerlin",
    );
    expect(timeRangeFromSearchParams(params.toString())).toEqual({
      value: { from: "now+1h", to: "now+2h" },
      timeZone: BERLIN,
    });
  });

  it("reads a plus that a hand-written URL left unencoded", () => {
    expect(timeRangeFromSearchParams("from=now+1h&to=now+2h")?.value).toEqual({
      from: "now+1h",
      to: "now+2h",
    });
  });

  it("keeps the other parameters and removes a stale tz", () => {
    const params = new URLSearchParams("q=error&tz=UTC");
    timeRangeToSearchParams({ from: "now-1h", to: "now" }, { params });
    expect(params.toString()).toBe("q=error&from=now-1h&to=now");
  });

  it("reads other names, ignores an unknown zone and refuses a missing end", () => {
    expect(
      timeRangeFromSearchParams("start=now-1h&end=now&zone=Mars/Olympus", {
        names: { from: "start", to: "end", timeZone: "zone" },
      }),
    ).toEqual({ value: { from: "now-1h", to: "now" } });
    expect(timeRangeFromSearchParams("from=now-1h")).toBeNull();
    expect(timeRangeFromSearchParams("from=oops&to=now")).toBeNull();
  });
});

describe("describing and formatting", () => {
  it.each([
    [{ from: "now-5m", to: "now" }, "Last 5 minutes"],
    [{ from: "now-1h", to: "now" }, "Last 1 hour"],
    [{ from: "now-90m", to: "now" }, "Last 90 minutes"],
    [{ from: "now-7d", to: "now" }, "Last 7 days"],
    [{ from: "now/d", to: "now/d" }, "Today"],
    [{ from: "now-1d/d", to: "now-1d/d" }, "Yesterday"],
    [{ from: "now/w", to: "now/w" }, "This week"],
    [{ from: "now-1w/w", to: "now-1w/w" }, "Previous week"],
    [{ from: "now/M", to: "now/M" }, "This month"],
    [{ from: "now/d", to: "now" }, "Today so far"],
    [{ from: "now-3d/d", to: "now-3d/d" }, "3 days ago"],
  ])("names %j %s", (value, label) => {
    expect(relativeRangeLabel(value)).toBe(label);
  });

  it("describes the shape", () => {
    expect(describeTimeRange({ from: "now-15m", to: "now" })).toEqual({
      kind: "rolling",
      amount: 15,
      unit: "m",
    });
    expect(describeTimeRange({ from: "now-6h", to: "now-1h" })).toEqual({
      kind: "custom",
    });
    expect(describeTimeRange({ from: "now-1d/w", to: "now-1d/w" })).toEqual({
      kind: "custom",
    });
  });

  it("formats absolute ranges with the zone's offset", () => {
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:00Z"),
        new Date("2026-11-06T17:30:00Z"),
        {
          timeZone: NY,
        },
      ),
    ).toBe("Nov 6, 09:00 – 12:30 (UTC−5)");
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:00Z"),
        new Date("2026-11-07T17:30:00Z"),
        {
          timeZone: BERLIN,
        },
      ),
    ).toBe("Nov 6, 15:00 – Nov 7, 18:30 (UTC+1)");
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:00Z"),
        new Date("2026-11-06T17:30:00Z"),
      ),
    ).toBe("Nov 6, 14:00 – 17:30 (UTC)");
  });

  it("shows the year when the ends differ or it is not this year", () => {
    const options = { timeZone: "UTC" };
    expect(
      formatAbsoluteRange(
        new Date("2025-12-31T23:00:00Z"),
        new Date("2026-01-01T01:00:00Z"),
        options,
      ),
    ).toBe("Dec 31, 2025, 23:00 – Jan 1, 2026, 01:00 (UTC)");
    expect(
      formatAbsoluteRange(
        new Date("2025-03-01T10:00:00Z"),
        new Date("2025-03-01T11:00:00Z"),
        {
          ...options,
          now: "2026-11-06T00:00:00Z",
        },
      ),
    ).toBe("Mar 1, 2025, 10:00 – 11:00 (UTC)");
  });

  it("shows both offsets across a clock change, and seconds only when set", () => {
    expect(
      formatAbsoluteRange(
        new Date("2026-10-31T12:00:00Z"),
        new Date("2026-11-01T12:00:00Z"),
        {
          timeZone: NY,
        },
      ),
    ).toBe("Oct 31, 08:00 – Nov 1, 07:00 (UTC−4/UTC−5)");
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:05Z"),
        new Date("2026-11-06T14:00:10Z"),
      ),
    ).toBe("Nov 6, 14:00:05 – 14:00:10 (UTC)");
  });

  it("formats in the 12 hour clock and in another locale", () => {
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:00Z"),
        new Date("2026-11-06T17:30:00Z"),
        {
          timeZone: NY,
          hourCycle: "h12",
        },
      ),
    ).toMatch(/^Nov 6, 9:00\s?AM – 12:30\s?PM \(UTC−5\)$/);
    expect(
      formatAbsoluteRange(
        new Date("2026-11-06T14:00:00Z"),
        new Date("2026-11-06T17:30:00Z"),
        {
          timeZone: BERLIN,
          locale: "de",
        },
      ),
    ).toContain("15:00");
  });

  it("formats a value: a name, two absolute ends, or the bounds as typed", () => {
    const options = { timeZone: NY, now: "2026-11-06T17:30:00Z" };
    expect(formatTimeRange({ from: "now-15m", to: "now" }, options)).toBe(
      "Last 15 minutes",
    );
    expect(
      formatTimeRange(
        { from: "2026-11-06T14:00:00.000Z", to: "2026-11-06T17:30:00.000Z" },
        options,
      ),
    ).toBe("Nov 6, 09:00 – 12:30 (UTC−5)");
    expect(formatTimeRange({ from: "now-6h", to: "now-1h" }, options)).toBe(
      "now-6h – now-1h",
    );
    expect(
      formatTimeRange({ from: "2026-11-06T14:00:00.000Z", to: "now" }, options),
    ).toBe("Nov 6, 09:00 – now");
  });

  it("builds the helper values", () => {
    expect(lastRange(90, "m")).toEqual({ from: "now-90m", to: "now" });
    // Seven calendar days, today included: six days back, not seven.
    expect(calendarRange(7, "d")).toEqual({ from: "now-6d/d", to: "now/d" });
    expect(resolved(calendarRange(7, "d"), "2026-11-06T17:30:00Z", NY)).toEqual(
      ["2026-10-31T04:00:00.000Z", "2026-11-07T04:59:59.999Z"],
    );
    expect(resolved(lastRange(7, "d"), "2026-11-06T17:30:00Z", NY)[0]).toBe(
      "2026-10-30T16:30:00.000Z",
    );
  });

  it("compares values as text", () => {
    expect(
      sameTimeRange(
        { from: "now-1h", to: "now" },
        { from: " now-1h", to: "now " },
      ),
    ).toBe(true);
    expect(
      sameTimeRange(
        { from: "now-1h", to: "now" },
        { from: "now-2h", to: "now" },
      ),
    ).toBe(false);
    expect(sameTimeRange(null, undefined)).toBe(false);
  });

  it("has defaults that all read and are valid", () => {
    for (const preset of defaultTimeRanges) {
      expect(isTimeBound(preset.from)).toBe(true);
      expect(isTimeBound(preset.to)).toBe(true);
      expect(relativeRangeLabel(preset)).toBe(preset.text);
      expect(validateRange(preset, { now: "2026-11-06T17:30:00Z" })).toEqual({
        valid: true,
      });
    }
  });
});
