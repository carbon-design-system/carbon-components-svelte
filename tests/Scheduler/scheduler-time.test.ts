import {
  civilDay,
  dayInfo,
  getZone,
  startOfWeek,
  weekdayOf,
} from "../../src/Scheduler/scheduler-time.js";

const LA = "America/Los_Angeles";
const HOUR = 3_600_000;

// 2026-03-08 springs forward at 02:00 and 2026-11-01 falls back at 02:00.
const SPRING = civilDay(2026, 2, 8);
const FALL = civilDay(2026, 10, 1);

describe("civil days", () => {
  it("numbers days from 1970-01-01 and names the weekday", () => {
    expect(civilDay(1970, 0, 1)).toBe(0);
    expect(weekdayOf(civilDay(1970, 0, 1))).toBe(4);
    expect(weekdayOf(civilDay(2026, 9, 25))).toBe(0);
    expect(weekdayOf(civilDay(1969, 11, 31))).toBe(3);
  });

  it("finds the start of the week for either first day", () => {
    const sunday = civilDay(2026, 9, 25);
    const wednesday = civilDay(2026, 9, 21);
    expect(startOfWeek(wednesday, 1)).toBe(wednesday - 2);
    expect(startOfWeek(wednesday, 0)).toBe(wednesday - 3);
    expect(startOfWeek(sunday, 1)).toBe(sunday - 6);
    expect(startOfWeek(sunday, 0)).toBe(sunday);
  });
});

describe("a named zone", () => {
  const zone = getZone(LA);

  it("reads the wall clock of an instant", () => {
    // 2026-10-27T17:30Z is 10:30 PDT.
    const { day, minute } = zone.parts(Date.UTC(2026, 9, 27, 17, 30));
    expect(day).toBe(civilDay(2026, 9, 27));
    expect(minute).toBe(10 * 60 + 30);
  });

  it("is a different day than UTC late in the evening", () => {
    const instant = Date.UTC(2026, 9, 28, 3, 0);
    expect(getZone("UTC").parts(instant).day).toBe(civilDay(2026, 9, 28));
    expect(zone.parts(instant).day).toBe(civilDay(2026, 9, 27));
  });

  it("round-trips ordinary times", () => {
    const day = civilDay(2026, 9, 27);
    for (const minute of [0, 59, 600, 1439]) {
      expect(zone.parts(zone.instant(day, minute))).toEqual({ day, minute });
    }
  });

  it("rolls a minute past the day into the next one", () => {
    const day = civilDay(2026, 9, 27);
    expect(zone.instant(day, 1440)).toBe(zone.instant(day + 1, 0));
    expect(zone.instant(day, -60)).toBe(zone.instant(day - 1, 23 * 60));
  });

  it("falls back to the local zone for an unknown name", () => {
    expect(getZone("Not/AZone")).toBe(getZone(undefined));
  });
});

describe("a spring-forward day", () => {
  const zone = getZone(LA);

  it("is 23 hours long and skips 02:00 to 03:00", () => {
    expect(dayInfo(zone, SPRING)).toEqual({
      length: 1380,
      skipped: [[120, 180]],
    });
  });

  it("puts a time in the gap after it", () => {
    // 02:30 does not exist; it becomes 03:30 PDT, as `new Date` does.
    const instant = zone.instant(SPRING, 150);
    expect(zone.parts(instant)).toEqual({ day: SPRING, minute: 210 });
  });

  it("keeps the instants on either side of the gap an hour apart", () => {
    expect(zone.instant(SPRING, 180) - zone.instant(SPRING, 60)).toBe(HOUR);
  });

  it("makes the next midnight 23 hours after this one", () => {
    expect(zone.instant(SPRING + 1, 0) - zone.instant(SPRING, 0)).toBe(
      23 * HOUR,
    );
  });
});

describe("a fall-back day", () => {
  const zone = getZone(LA);

  it("is 25 hours long with nothing skipped", () => {
    expect(dayInfo(zone, FALL)).toEqual({ length: 1500, skipped: [] });
  });

  it("takes the first occurrence of the repeated hour", () => {
    const first = zone.instant(FALL, 90);
    // 01:30 PDT is 08:30Z; 01:30 PST, an hour later, is 09:30Z.
    expect(first).toBe(Date.UTC(2026, 10, 1, 8, 30));
    expect(zone.parts(first + HOUR)).toEqual({ day: FALL, minute: 90 });
  });

  it("makes the next midnight 25 hours after this one", () => {
    expect(zone.instant(FALL + 1, 0) - zone.instant(FALL, 0)).toBe(25 * HOUR);
  });
});

describe("a day with no change", () => {
  it("is 24 hours with nothing skipped", () => {
    expect(dayInfo(getZone(LA), civilDay(2026, 9, 27))).toEqual({
      length: 1440,
      skipped: [],
    });
  });

  it("has no change in a zone without DST", () => {
    expect(dayInfo(getZone("Asia/Tokyo"), SPRING).length).toBe(1440);
  });
});

describe("the local zone", () => {
  const local = getZone(undefined);
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const named = getZone(resolved);

  it("agrees with the zone the browser reports, minute by minute", () => {
    // Every quarter hour of a week that holds the next DST change in the
    // process's own zone, or an ordinary week when it has none.
    const from = Date.UTC(2026, 2, 5);
    for (let ms = from; ms < from + 7 * 24 * HOUR; ms += 15 * 60_000) {
      expect(local.parts(ms)).toEqual(named.parts(ms));
    }
    const fall = Date.UTC(2026, 9, 29);
    for (let ms = fall; ms < fall + 7 * 24 * HOUR; ms += 15 * 60_000) {
      expect(local.parts(ms)).toEqual(named.parts(ms));
    }
  });

  it("builds instants the same way as the named zone", () => {
    for (const day of [
      SPRING - 1,
      SPRING,
      SPRING + 1,
      FALL - 1,
      FALL,
      FALL + 1,
    ]) {
      for (let minute = 0; minute < 1440; minute += 30) {
        expect(local.instant(day, minute)).toBe(named.instant(day, minute));
      }
    }
  });
});

// Assigning `process.env.TZ` takes effect on macOS but not in every Linux
// runner, so these skip when the zone did not change. Run the file with
// `TZ=America/Los_Angeles` to force it. The named-zone tests above cover the
// same days either way.
describe("the local zone with the browser in Los Angeles", () => {
  const previous = process.env.TZ;
  let applied = false;
  beforeAll(() => {
    process.env.TZ = LA;
    applied = new Date(2026, 2, 8, 2, 30).getHours() === 3;
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });

  it("sees the 23-hour and 25-hour days", (context) => {
    if (!applied) context.skip();
    const local = getZone(undefined);
    expect(dayInfo(local, SPRING)).toEqual({
      length: 1380,
      skipped: [[120, 180]],
    });
    expect(dayInfo(local, FALL)).toEqual({ length: 1500, skipped: [] });
  });

  it("puts a skipped time after the gap and a repeated time first", (context) => {
    if (!applied) context.skip();
    const local = getZone(undefined);
    expect(local.parts(local.instant(SPRING, 150))).toEqual({
      day: SPRING,
      minute: 210,
    });
    expect(local.instant(FALL, 90)).toBe(Date.UTC(2026, 10, 1, 8, 30));
  });
});
