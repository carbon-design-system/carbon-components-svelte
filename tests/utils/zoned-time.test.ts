import { resolveWeekInfo } from "../../src/DatePicker/week-info.js";
import type { Disambiguation } from "../../src/utils/zoned-time.js";
import {
  addZoned,
  dayKey,
  diffCalendarDays,
  endOf,
  formatUtcOffset,
  fromZoned,
  hostTimeZone,
  isTimeZone,
  listTimeZones,
  normalizeTimeZone,
  offsetOf,
  resolveWeekStart,
  startOf,
  zonedParts,
} from "../../src/utils/zoned-time.js";

const NY = "America/New_York";
const BERLIN = "Europe/Berlin";
const LORD_HOWE = "Australia/Lord_Howe";
const KATHMANDU = "Asia/Kathmandu";
const HAVANA = "America/Havana";
const APIA = "Pacific/Apia";

const ms = (iso: string) => Date.parse(iso);
const iso = (time: number) => new Date(time).toISOString();
const HOUR = 3_600_000;

/** The wall clock as `YYYY-MM-DDTHH:mm` in `zone`. */
const wall = (time: number, zone: string) => {
  const w = zonedParts(time, zone);
  const p = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${p(w.year, 4)}-${p(w.month)}-${p(w.day)}T${p(w.hour)}:${p(w.minute)}`;
};

describe("zonedParts and offsetOf", () => {
  it("reads the wall clock and the offset on both sides of a clock change", () => {
    // New York springs forward on 2026-03-08 at 07:00Z.
    expect(offsetOf(ms("2026-03-08T06:59:59Z"), NY) / HOUR).toBe(-5);
    expect(offsetOf(ms("2026-03-08T07:00:00Z"), NY) / HOUR).toBe(-4);
    expect(wall(ms("2026-03-08T06:59:00Z"), NY)).toBe("2026-03-08T01:59");
    expect(wall(ms("2026-03-08T07:00:00Z"), NY)).toBe("2026-03-08T03:00");
    // And falls back on 2026-11-01 at 06:00Z.
    expect(wall(ms("2026-11-01T05:59:00Z"), NY)).toBe("2026-11-01T01:59");
    expect(wall(ms("2026-11-01T06:00:00Z"), NY)).toBe("2026-11-01T01:00");
  });

  it("gives the milliseconds and the weekday", () => {
    const w = zonedParts(ms("2026-11-06T12:34:56.789Z"), "Asia/Tokyo");
    expect(w).toEqual({
      year: 2026,
      month: 11,
      day: 6,
      hour: 21,
      minute: 34,
      second: 56,
      millisecond: 789,
      weekday: 5,
    });
  });

  it("keeps the milliseconds of an instant before 1970", () => {
    expect(zonedParts(-1, "UTC")).toMatchObject({
      year: 1969,
      second: 59,
      millisecond: 999,
    });
  });

  it("reads a 30 minute clock change in Lord Howe Island", () => {
    expect(offsetOf(ms("2026-01-01T00:00:00Z"), LORD_HOWE) / 60_000).toBe(660);
    expect(offsetOf(ms("2026-07-01T00:00:00Z"), LORD_HOWE) / 60_000).toBe(630);
    // Clocks go from 02:00 to 02:30 on 2026-10-04 (15:30Z the day before).
    expect(wall(ms("2026-10-03T15:29:00Z"), LORD_HOWE)).toBe(
      "2026-10-04T01:59",
    );
    expect(wall(ms("2026-10-03T15:30:00Z"), LORD_HOWE)).toBe(
      "2026-10-04T02:30",
    );
  });

  it("reads a quarter hour offset in Kathmandu", () => {
    expect(offsetOf(ms("2026-06-01T00:00:00Z"), KATHMANDU) / 60_000).toBe(345);
    expect(wall(ms("2026-06-01T00:00:00Z"), KATHMANDU)).toBe(
      "2026-06-01T05:45",
    );
  });

  it("reads an offset with seconds, before standard time", () => {
    // New York kept local mean time, UTC-4:56:02, until 1883.
    const t = Date.UTC(1850, 0, 1);
    expect(offsetOf(t, NY)).toBe(-(4 * 3600 + 56 * 60 + 2) * 1000);
    const p = zonedParts(t, NY);
    expect(fromZoned(p, NY)).toBe(t);
  });

  it("counts the Gregorian calendar back past 1582, and to the ends of the range", () => {
    expect(dayKey(Date.UTC(1582, 9, 10), "UTC")).toBe("1582-10-10");
    // 1500 is a leap year in the Julian calendar and not in the Gregorian.
    expect(dayKey(Date.UTC(1500, 1, 29), "UTC")).toBe("1500-03-01");
    expect(dayKey(Date.UTC(9999, 11, 31, 12), "UTC")).toBe("9999-12-31");
  });

  it("accepts a Date", () => {
    const date = new Date("2026-06-01T00:00:00Z");
    expect(zonedParts(date, "UTC")).toEqual(zonedParts(+date, "UTC"));
    expect(offsetOf(date, KATHMANDU)).toBe(offsetOf(+date, KATHMANDU));
  });

  it("throws a RangeError for an instant that is not a time and for an unknown zone", () => {
    expect(() => zonedParts(Number.NaN, "UTC")).toThrow(RangeError);
    expect(() => zonedParts(new Date("x"), "UTC")).toThrow(RangeError);
    expect(() => zonedParts(0, "Mars/Olympus")).toThrow(RangeError);
  });
});

describe("fromZoned", () => {
  const at = (
    zone: string,
    day: string,
    time: string,
    disambiguation?: Disambiguation,
  ) => {
    const [year, month, date] = day.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return iso(
      fromZoned({ year, month, day: date, hour, minute }, zone, {
        disambiguation,
      }),
    );
  };

  it("reads a time that exists", () => {
    expect(at(NY, "2026-06-01", "09:00")).toBe("2026-06-01T13:00:00.000Z");
    expect(at(NY, "2026-01-01", "09:00")).toBe("2026-01-01T14:00:00.000Z");
    expect(at(KATHMANDU, "2026-06-01", "09:00")).toBe(
      "2026-06-01T03:15:00.000Z",
    );
  });

  it("defaults the time to midnight", () => {
    expect(iso(fromZoned({ year: 2026, month: 6, day: 1 }, NY))).toBe(
      "2026-06-01T04:00:00.000Z",
    );
  });

  describe.each([
    // zone, a skipped time, the time after the gap, then the one before it
    [
      NY,
      "2026-03-08",
      "02:30",
      "2026-03-08T07:30:00.000Z",
      "2026-03-08T06:30:00.000Z",
    ],
    [
      BERLIN,
      "2026-03-29",
      "02:30",
      "2026-03-29T01:30:00.000Z",
      "2026-03-29T00:30:00.000Z",
    ],
    // A 30 minute gap: 02:00 to 02:30 on 2026-10-04.
    [
      LORD_HOWE,
      "2026-10-04",
      "02:15",
      "2026-10-03T15:45:00.000Z",
      "2026-10-03T15:15:00.000Z",
    ],
  ])("a skipped time in %s", (zone, day, time, after, before) => {
    it("is the time after the gap, by default and for later", () => {
      expect(at(zone, day, time)).toBe(after);
      expect(at(zone, day, time, "compatible")).toBe(after);
      expect(at(zone, day, time, "later")).toBe(after);
    });
    it("is the time before the gap for earlier", () => {
      expect(at(zone, day, time, "earlier")).toBe(before);
    });
    it("throws for reject", () => {
      expect(() => at(zone, day, time, "reject")).toThrow(/skipped/);
    });
  });

  describe.each([
    [
      NY,
      "2026-11-01",
      "01:30",
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T06:30:00.000Z",
    ],
    [
      BERLIN,
      "2026-10-25",
      "02:30",
      "2026-10-25T00:30:00.000Z",
      "2026-10-25T01:30:00.000Z",
    ],
    // A 30 minute repeat: 01:30 to 02:00 on 2026-04-05.
    [
      LORD_HOWE,
      "2026-04-05",
      "01:45",
      "2026-04-04T14:45:00.000Z",
      "2026-04-04T15:15:00.000Z",
    ],
  ])("a repeated time in %s", (zone, day, time, first, second) => {
    it("is the first, by default and for earlier", () => {
      expect(at(zone, day, time)).toBe(first);
      expect(at(zone, day, time, "compatible")).toBe(first);
      expect(at(zone, day, time, "earlier")).toBe(first);
    });
    it("is the second for later", () => {
      expect(at(zone, day, time, "later")).toBe(second);
    });
    it("throws for reject", () => {
      expect(() => at(zone, day, time, "reject")).toThrow(/repeated/);
    });
  });

  it("does not throw for reject when the time is unambiguous", () => {
    expect(at(NY, "2026-11-01", "00:59", "reject")).toBe(
      "2026-11-01T04:59:00.000Z",
    );
    expect(at(NY, "2026-11-01", "02:00", "reject")).toBe(
      "2026-11-01T07:00:00.000Z",
    );
  });

  it("reads midnight as the first time that exists where the clocks skip it", () => {
    // Havana: 00:00 to 01:00 on 2026-03-08.
    expect(at(HAVANA, "2026-03-08", "00:00")).toBe("2026-03-08T05:00:00.000Z");
    expect(
      wall(fromZoned({ year: 2026, month: 3, day: 8 }, HAVANA), HAVANA),
    ).toBe("2026-03-08T01:00");
  });

  it("reads a time on the day Samoa skipped (2011-12-30)", () => {
    // Apia went from 2011-12-29 23:59:59 (UTC-10) to 2011-12-31 00:00 (UTC+14).
    expect(at(APIA, "2011-12-29", "23:30")).toBe("2011-12-30T09:30:00.000Z");
    expect(at(APIA, "2011-12-31", "00:30")).toBe("2011-12-30T10:30:00.000Z");
    // The 30th does not exist: 12:00 reads as 12:00 on the 31st, or as the
    // same moment 24 hours earlier, 12:00 on the 29th.
    expect(at(APIA, "2011-12-30", "12:00")).toBe("2011-12-30T22:00:00.000Z");
    expect(at(APIA, "2011-12-30", "12:00", "earlier")).toBe(
      "2011-12-29T22:00:00.000Z",
    );
    expect(() => at(APIA, "2011-12-30", "12:00", "reject")).toThrow(/skipped/);
  });

  it("rolls fields out of range over, as Date.UTC does", () => {
    expect(iso(fromZoned({ year: 2026, month: 1, day: 32 }, "UTC"))).toBe(
      "2026-02-01T00:00:00.000Z",
    );
    expect(iso(fromZoned({ year: 2026, month: 3, day: 0 }, "UTC"))).toBe(
      "2026-02-28T00:00:00.000Z",
    );
    expect(iso(fromZoned({ year: 2026, month: 13, day: 1 }, "UTC"))).toBe(
      "2027-01-01T00:00:00.000Z",
    );
    expect(
      iso(fromZoned({ year: 2026, month: 1, day: 1, hour: 25 }, "UTC")),
    ).toBe("2026-01-02T01:00:00.000Z");
  });

  it("keeps years 0 to 99 in those years", () => {
    expect(
      new Date(
        fromZoned({ year: 50, month: 1, day: 1 }, "UTC"),
      ).getUTCFullYear(),
    ).toBe(50);
  });

  it("throws a RangeError for fields that are not numbers", () => {
    expect(() =>
      fromZoned({ year: Number.NaN, month: 1, day: 1 }, "UTC"),
    ).toThrow(RangeError);
    expect(() =>
      fromZoned({ year: 2026, month: 1, day: 1 }, "Mars/Olympus"),
    ).toThrow(RangeError);
  });
});

describe("startOf and endOf", () => {
  it("finds the day in the zone, not in UTC", () => {
    const noonUtc = ms("2026-06-01T03:00:00Z"); // 23:00 on May 31 in New York
    expect(iso(startOf("day", noonUtc, NY))).toBe("2026-05-31T04:00:00.000Z");
    expect(iso(endOf("day", noonUtc, NY))).toBe("2026-06-01T03:59:59.999Z");
  });

  it("is 23 and 25 hours long on the days the clocks change", () => {
    const length = (zone: string, at: string) => {
      const t = ms(at);
      return (endOf("day", t, zone) + 1 - startOf("day", t, zone)) / HOUR;
    };
    expect(length(NY, "2026-03-08T12:00:00Z")).toBe(23);
    expect(length(NY, "2026-11-01T12:00:00Z")).toBe(25);
    expect(length(NY, "2026-06-01T12:00:00Z")).toBe(24);
    expect(length(BERLIN, "2026-03-29T12:00:00Z")).toBe(23);
    expect(length(BERLIN, "2026-10-25T12:00:00Z")).toBe(25);
    expect(length(LORD_HOWE, "2026-10-04T00:00:00Z")).toBe(23.5);
    expect(length(LORD_HOWE, "2026-04-05T00:00:00Z")).toBe(24.5);
    expect(length(KATHMANDU, "2026-06-01T12:00:00Z")).toBe(24);
  });

  it("starts the day at 01:00 where midnight is skipped", () => {
    const t = ms("2026-03-08T12:00:00Z");
    expect(wall(startOf("day", t, HAVANA), HAVANA)).toBe("2026-03-08T01:00");
    // The day before it ends at the last millisecond before that.
    expect(endOf("day", ms("2026-03-07T12:00:00Z"), HAVANA)).toBe(
      startOf("day", t, HAVANA) - 1,
    );
    // And the day after starts at midnight again.
    expect(
      wall(startOf("day", ms("2026-03-09T12:00:00Z"), HAVANA), HAVANA),
    ).toBe("2026-03-09T00:00");
    // Santiago: 2026-09-06.
    expect(
      wall(
        startOf("day", ms("2026-09-06T12:00:00Z"), "America/Santiago"),
        "America/Santiago",
      ),
    ).toBe("2026-09-06T01:00");
  });

  it("keeps a day that is repeated at midnight on one date", () => {
    // Havana falls back 01:00 to 00:00 on 2026-11-01: 00:00 happens twice.
    const second = ms("2026-11-01T05:30:00Z"); // 00:30 CST, after the change
    expect(wall(second, HAVANA)).toBe("2026-11-01T00:30");
    expect(wall(startOf("day", second, HAVANA), HAVANA)).toBe(
      "2026-11-01T00:00",
    );
    expect(startOf("day", second, HAVANA)).toBe(
      startOf("day", ms("2026-11-01T12:00:00Z"), HAVANA),
    );
  });

  it("starts the day after the day Samoa skipped", () => {
    expect(iso(startOf("day", ms("2011-12-30T12:00:00Z"), APIA))).toBe(
      "2011-12-30T10:00:00.000Z",
    );
    expect(iso(endOf("day", ms("2011-12-29T12:00:00Z"), APIA))).toBe(
      "2011-12-30T09:59:59.999Z",
    );
    // 2011-12-29 is 24 hours long, though the next calendar day is a day later.
    expect(
      (endOf("day", ms("2011-12-29T12:00:00Z"), APIA) +
        1 -
        startOf("day", ms("2011-12-29T12:00:00Z"), APIA)) /
        HOUR,
    ).toBe(24);
  });

  it("aligns elapsed units to the zone's offset", () => {
    // 18:35 in Kathmandu.
    const t = ms("2026-01-01T12:50:00Z");
    expect(wall(startOf("hour", t, KATHMANDU), KATHMANDU)).toBe(
      "2026-01-01T18:00",
    );
    expect(wall(startOf("minute", t, KATHMANDU), KATHMANDU)).toBe(
      "2026-01-01T18:35",
    );
    expect(startOf("second", t + 750, KATHMANDU)).toBe(t);
    expect(
      endOf("hour", t, KATHMANDU) + 1 - startOf("hour", t, KATHMANDU),
    ).toBe(HOUR);
  });

  it("gives each pass through the repeated hour its own start", () => {
    const first = ms("2026-11-01T05:40:00Z"); // 01:40 EDT
    const second = ms("2026-11-01T06:40:00Z"); // 01:40 EST
    expect(iso(startOf("hour", first, NY))).toBe("2026-11-01T05:00:00.000Z");
    expect(iso(startOf("hour", second, NY))).toBe("2026-11-01T06:00:00.000Z");
  });

  it("starts the week on weekStart, and on Monday by default", () => {
    const friday = ms("2026-11-06T12:00:00Z"); // Friday
    expect(wall(startOf("week", friday, "UTC"), "UTC")).toBe(
      "2026-11-02T00:00",
    );
    expect(wall(startOf("week", friday, "UTC", { weekStart: 1 }), "UTC")).toBe(
      "2026-11-02T00:00",
    );
    expect(wall(startOf("week", friday, "UTC", { weekStart: 0 }), "UTC")).toBe(
      "2026-11-01T00:00",
    );
    expect(wall(startOf("week", friday, "UTC", { weekStart: 6 }), "UTC")).toBe(
      "2026-10-31T00:00",
    );
    expect(wall(startOf("week", friday, "UTC", { weekStart: 5 }), "UTC")).toBe(
      "2026-11-06T00:00",
    );
  });

  it("finds a week that crosses a month, a year, and a clock change", () => {
    const week = (zone: string, at: string, weekStart = 1) => {
      const t = ms(at);
      return [
        wall(startOf("week", t, zone, { weekStart }), zone),
        (endOf("week", t, zone, { weekStart }) +
          1 -
          startOf("week", t, zone, { weekStart })) /
          HOUR,
      ];
    };
    expect(week("UTC", "2026-01-01T12:00:00Z")).toEqual([
      "2025-12-29T00:00",
      168,
    ]);
    expect(week(NY, "2026-03-08T12:00:00Z", 0)).toEqual([
      "2026-03-08T00:00",
      167,
    ]);
    expect(week(NY, "2026-11-05T12:00:00Z", 0)).toEqual([
      "2026-11-01T00:00",
      169,
    ]);
  });

  it("finds a month and a year", () => {
    const t = ms("2026-03-15T12:00:00Z");
    expect(wall(startOf("month", t, NY), NY)).toBe("2026-03-01T00:00");
    expect(wall(endOf("month", t, NY) + 1, NY)).toBe("2026-04-01T00:00");
    expect(wall(startOf("year", t, NY), NY)).toBe("2026-01-01T00:00");
    expect(wall(endOf("year", t, NY) + 1, NY)).toBe("2027-01-01T00:00");
    // March in New York has 743 hours.
    expect((endOf("month", t, NY) + 1 - startOf("month", t, NY)) / HOUR).toBe(
      743,
    );
    // A leap year.
    expect(
      (endOf("month", ms("2028-02-10T00:00:00Z"), "UTC") +
        1 -
        startOf("month", ms("2028-02-10T00:00:00Z"), "UTC")) /
        (24 * HOUR),
    ).toBe(29);
  });

  it("starts a day at 01:00 in Brazil when it skipped midnight, as it did until 2018", () => {
    const zone = "America/Sao_Paulo";
    expect(wall(startOf("day", ms("2018-11-04T12:00:00Z"), zone), zone)).toBe(
      "2018-11-04T01:00",
    );
  });

  it("throws for a unit it does not know", () => {
    expect(() => startOf("fortnight" as never, 0, "UTC")).toThrow(RangeError);
  });
});

describe("addZoned", () => {
  const add = (
    start: string,
    duration: Parameters<typeof addZoned>[1],
    zone: string,
  ) => iso(addZoned(ms(start), duration, zone));

  it("adds a calendar day as 23 or 25 hours across a clock change", () => {
    // 09:00 EST the day before, 09:00 EDT the day of.
    expect(add("2026-03-07T14:00:00Z", { days: 1 }, NY)).toBe(
      "2026-03-08T13:00:00.000Z",
    );
    expect(add("2026-10-31T13:00:00Z", { days: 1 }, NY)).toBe(
      "2026-11-01T14:00:00.000Z",
    );
    expect(add("2026-10-31T13:00:00Z", { days: 2 }, NY)).toBe(
      "2026-11-02T14:00:00.000Z",
    );
  });

  it("adds elapsed hours as 60 minutes each across a clock change", () => {
    expect(add("2026-03-07T14:00:00Z", { hours: 24 }, NY)).toBe(
      "2026-03-08T14:00:00.000Z",
    );
    expect(add("2026-03-07T14:00:00Z", { hours: 24 }, NY)).not.toBe(
      add("2026-03-07T14:00:00Z", { days: 1 }, NY),
    );
    expect(add("2026-11-01T04:00:00Z", { minutes: 90 }, NY)).toBe(
      "2026-11-01T05:30:00.000Z",
    );
  });

  it("adds calendar units first, then elapsed units", () => {
    // One day and one hour from 01:30 EST on the night of the change.
    expect(add("2026-03-07T06:30:00Z", { days: 1, hours: 1 }, NY)).toBe(
      "2026-03-08T07:30:00.000Z",
    );
  });

  it("reads a wall time that falls in a gap as the time after it", () => {
    // 02:30 EST + 1 day is 02:30 on 2026-03-08, which is 03:30 EDT.
    expect(add("2026-03-07T07:30:00Z", { days: 1 }, NY)).toBe(
      "2026-03-08T07:30:00.000Z",
    );
    // 02:30 on the repeated night is the first one.
    expect(add("2026-10-31T05:30:00Z", { days: 1 }, NY)).toBe(
      "2026-11-01T05:30:00.000Z",
    );
  });

  it("clamps a month or a year to the last day", () => {
    expect(add("2026-01-31T12:00:00Z", { months: 1 }, "UTC")).toBe(
      "2026-02-28T12:00:00.000Z",
    );
    expect(add("2028-02-29T12:00:00Z", { years: 1 }, "UTC")).toBe(
      "2029-02-28T12:00:00.000Z",
    );
    expect(add("2026-03-31T12:00:00Z", { months: -1 }, "UTC")).toBe(
      "2026-02-28T12:00:00.000Z",
    );
    expect(add("2026-11-30T12:00:00Z", { months: 3 }, "UTC")).toBe(
      "2027-02-28T12:00:00.000Z",
    );
    expect(add("2026-01-31T12:00:00Z", { months: 25 }, "UTC")).toBe(
      "2028-02-29T12:00:00.000Z",
    );
  });

  it("adds weeks and a negative duration", () => {
    expect(add("2026-03-01T17:00:00Z", { weeks: 2 }, NY)).toBe(
      "2026-03-15T16:00:00.000Z",
    );
    expect(add("2026-03-15T16:00:00Z", { weeks: -2 }, NY)).toBe(
      "2026-03-01T17:00:00.000Z",
    );
    expect(add("2026-03-09T12:00:00Z", { days: -1, hours: -1 }, NY)).toBe(
      "2026-03-08T11:00:00.000Z",
    );
  });

  it("adds across the day Samoa skipped", () => {
    // 12:00 on 2011-12-29 plus a day is 12:00 on the 30th, which does not
    // exist, so it reads as 12:00 on the 31st.
    expect(add("2011-12-29T22:00:00Z", { days: 1 }, APIA)).toBe(
      "2011-12-30T22:00:00.000Z",
    );
  });

  it("returns the instant for an empty duration", () => {
    expect(addZoned(123, {}, NY)).toBe(123);
  });

  it("throws a RangeError for a fraction", () => {
    expect(() => addZoned(0, { days: 1.5 }, NY)).toThrow(RangeError);
    expect(() => addZoned(0, { hours: 0.5 }, NY)).toThrow(RangeError);
  });
});

describe("dayKey and diffCalendarDays", () => {
  it("names the day in the zone", () => {
    const t = ms("2026-11-06T23:30:00Z");
    expect(dayKey(t, "UTC")).toBe("2026-11-06");
    expect(dayKey(t, "Asia/Tokyo")).toBe("2026-11-07");
    expect(dayKey(t, "Pacific/Honolulu")).toBe("2026-11-06");
    expect(dayKey(t, "Pacific/Kiritimati")).toBe("2026-11-07");
    expect(dayKey(ms("0099-01-02T00:00:00Z"), "UTC")).toBe("0099-01-02");
  });

  it("counts calendar days, not 24 hour spans", () => {
    // 23:30 to 00:30 is an hour and a calendar day.
    expect(
      diffCalendarDays(
        ms("2026-06-01T03:30:00Z"),
        ms("2026-06-01T04:30:00Z"),
        NY,
      ),
    ).toBe(1);
    expect(
      diffCalendarDays(
        ms("2026-06-01T04:30:00Z"),
        ms("2026-06-01T23:30:00Z"),
        NY,
      ),
    ).toBe(0);
    expect(
      diffCalendarDays(
        ms("2026-06-02T04:30:00Z"),
        ms("2026-06-01T04:30:00Z"),
        NY,
      ),
    ).toBe(-1);
  });

  it("counts a 23 hour and a 25 hour day as one", () => {
    // 00:30 on the 8th to 00:30 on the 9th is 23 hours, and one day.
    const a = fromZoned(
      { year: 2026, month: 3, day: 8, hour: 0, minute: 30 },
      NY,
    );
    const b = fromZoned(
      { year: 2026, month: 3, day: 9, hour: 0, minute: 30 },
      NY,
    );
    expect(b - a).toBe(23 * HOUR);
    expect(diffCalendarDays(a, b, NY)).toBe(1);
    const c = fromZoned(
      { year: 2026, month: 11, day: 1, hour: 0, minute: 30 },
      NY,
    );
    const d = fromZoned(
      { year: 2026, month: 11, day: 2, hour: 0, minute: 30 },
      NY,
    );
    expect(d - c).toBe(25 * HOUR);
    expect(diffCalendarDays(c, d, NY)).toBe(1);
  });

  it("counts the day Samoa skipped on the wall calendar", () => {
    // 24 hours apart, and two days on the calendar the clocks show.
    const a = fromZoned({ year: 2011, month: 12, day: 29, hour: 12 }, APIA);
    const b = fromZoned({ year: 2011, month: 12, day: 31, hour: 12 }, APIA);
    expect(b - a).toBe(24 * HOUR);
    expect(diffCalendarDays(a, b, APIA)).toBe(2);
  });
});

describe("zones", () => {
  it("checks a name", () => {
    expect(isTimeZone("America/New_York")).toBe(true);
    expect(isTimeZone("america/new_york")).toBe(true);
    expect(isTimeZone("UTC")).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
    expect(isTimeZone("")).toBe(false);
    expect(isTimeZone(undefined)).toBe(false);
    expect(isTimeZone(5)).toBe(false);
  });

  it("gives one spelling for the names that engines disagree on", () => {
    expect(normalizeTimeZone("Asia/Calcutta")).toBe("Asia/Kolkata");
    expect(normalizeTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(normalizeTimeZone("Asia/Katmandu")).toBe("Asia/Kathmandu");
    expect(normalizeTimeZone("Europe/Kiev")).toBe("Europe/Kyiv");
    expect(normalizeTimeZone("America/Buenos_Aires")).toBe(
      "America/Argentina/Buenos_Aires",
    );
    expect(normalizeTimeZone("Etc/UTC")).toBe("UTC");
    expect(normalizeTimeZone("GMT")).toBe("UTC");
    expect(normalizeTimeZone("America/New_York")).toBe("America/New_York");
    expect(normalizeTimeZone("Mars/Olympus")).toBeUndefined();
  });

  it("lists UTC first, then each zone once, sorted", () => {
    const zones = listTimeZones();
    expect(zones[0]).toBe("UTC");
    expect(zones.length).toBeGreaterThan(400);
    expect(new Set(zones).size).toBe(zones.length);
    expect(zones.slice(1)).toEqual([...zones.slice(1)].sort());
    expect(zones).toContain("America/New_York");
    expect(zones).toContain("Asia/Kolkata");
    expect(zones).not.toContain("Asia/Calcutta");
  });

  it("adds the zones it is given, once", () => {
    const base = listTimeZones();
    expect(listTimeZones(["Asia/Calcutta", "Mars/Olympus"])).toEqual(base);
    expect(listTimeZones(["Etc/GMT+5"])).toContain("Etc/GMT+5");
    expect(listTimeZones()).toEqual(base);
  });

  it("keeps every zone it lists a zone the engine accepts, with a stable spelling", () => {
    for (const zone of listTimeZones()) {
      expect(isTimeZone(zone)).toBe(true);
      expect(normalizeTimeZone(zone)).toBe(zone);
    }
  });

  it("labels an offset", () => {
    expect(formatUtcOffset(0)).toBe("UTC");
    expect(formatUtcOffset(-5 * HOUR)).toBe("UTC−5");
    expect(formatUtcOffset(345 * 60_000)).toBe("UTC+5:45");
    expect(formatUtcOffset(630 * 60_000)).toBe("UTC+10:30");
    expect(formatUtcOffset(-570 * 60_000)).toBe("UTC−9:30");
    expect(formatUtcOffset(offsetOf(ms("2026-06-01T00:00:00Z"), NY))).toBe(
      "UTC−4",
    );
  });

  it("reads the host zone as an IANA name, with UTC as the fallback", () => {
    expect(isTimeZone(hostTimeZone())).toBe(true);
  });
});

describe("resolveWeekStart", () => {
  it("reads the first day of the week for a locale", () => {
    expect(resolveWeekStart("en-US")).toBe(0);
    expect(resolveWeekStart("en-GB")).toBe(1);
    expect(resolveWeekStart("de")).toBe(1);
    expect(resolveWeekStart("ar-EG")).toBe(6);
    expect(resolveWeekStart("fa-IR")).toBe(6);
    expect(resolveWeekStart("he-IL")).toBe(0);
    expect(resolveWeekStart("dv-MV")).toBe(5);
  });

  it("reads the table the DatePicker uses, so that the two agree", () => {
    for (const locale of ["en-US", "de-DE", "ar-EG", "ja-JP", "dv-MV", "fr"]) {
      expect(resolveWeekStart(locale)).toBe(resolveWeekInfo(locale).firstDay);
    }
  });

  it("takes a first day set in the tag over the locale's", () => {
    expect(resolveWeekStart("en-US-u-fw-mon")).toBe(1);
    expect(resolveWeekStart("de-u-fw-sun")).toBe(0);
    expect(resolveWeekStart("de-DE-u-ca-gregory-fw-sat")).toBe(6);
    expect(resolveWeekStart("en-US-u-ca-gregory")).toBe(0);
    // Not a day name, or past the end of the extension.
    expect(resolveWeekStart("en-US-u-fw-xyz")).toBe(0);
    expect(resolveWeekStart("de-x-fw-sun")).toBe(1);
  });

  it("falls back to Monday for a tag Intl cannot read", () => {
    expect(resolveWeekStart("not a locale")).toBe(1);
  });
});

describe("independence from the host", () => {
  it("gives the same answers whatever TZ the process runs in", () => {
    // These are literal. The CI step that runs this file under several `TZ`
    // values is what proves it; run it by hand with `TZ=Pacific/Apia`.
    expect(iso(fromZoned({ year: 2026, month: 3, day: 8, hour: 12 }, NY))).toBe(
      "2026-03-08T16:00:00.000Z",
    );
    expect(iso(startOf("day", ms("2026-03-08T12:00:00Z"), NY))).toBe(
      "2026-03-08T05:00:00.000Z",
    );
    expect(iso(startOf("week", ms("2026-03-08T12:00:00Z"), NY))).toBe(
      "2026-03-02T05:00:00.000Z",
    );
    expect(iso(addZoned(ms("2026-03-07T14:00:00Z"), { days: 1 }, NY))).toBe(
      "2026-03-08T13:00:00.000Z",
    );
    expect(dayKey(ms("2026-11-06T23:30:00Z"), "Asia/Tokyo")).toBe("2026-11-07");
  });
});
