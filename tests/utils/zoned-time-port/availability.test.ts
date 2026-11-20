// @vitest-environment node
// The BookingSlots draft's own tests (#5549, availability.test.ts), run against
// the draft's helpers ported onto src/utils/zoned-time.js. Only the import
// changed.
import {
  addDays,
  addMonths,
  dayKey,
  dayLength,
  formatDay,
  formatSlotTimes,
  groupSlotsByDay,
  isValidTimeZone,
  monthWindow,
  nextAvailableDay,
  normalizeSlots,
  slotsFromWindows,
  startOfDay,
  toMs,
  wallTimeToInstant,
  zoneOffset,
} from "./booking-slots.js";

const NY = "America/New_York";
const BERLIN = "Europe/Berlin";
const iso = (ms: number) => new Date(ms).toISOString();
const utc = (value: string) => Date.parse(value);

describe("zoneOffset and dayKey", () => {
  it("reads the offset on either side of a change", () => {
    expect(zoneOffset(utc("2026-03-08T06:59:00Z"), NY)).toBe(-300);
    expect(zoneOffset(utc("2026-03-08T07:00:00Z"), NY)).toBe(-240);
    expect(zoneOffset(utc("2026-03-29T00:59:00Z"), BERLIN)).toBe(60);
    expect(zoneOffset(utc("2026-03-29T01:00:00Z"), BERLIN)).toBe(120);
  });

  it("puts an instant on the day of the zone", () => {
    const ms = utc("2026-11-12T02:30:00Z");
    expect(dayKey(ms, "UTC")).toBe("2026-11-12");
    expect(dayKey(ms, NY)).toBe("2026-11-11");
    expect(dayKey(ms, BERLIN)).toBe("2026-11-12");
    expect(dayKey(ms, "Pacific/Kiritimati")).toBe("2026-11-12");
  });

  it("rejects a zone the runtime does not know", () => {
    expect(isValidTimeZone(NY)).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
  });
});

describe("wallTimeToInstant", () => {
  it("converts an ordinary time", () => {
    expect(iso(wallTimeToInstant("2026-11-11", 9 * 60, NY))).toBe(
      "2026-11-11T14:00:00.000Z",
    );
    expect(iso(wallTimeToInstant("2026-07-01", 9 * 60, BERLIN))).toBe(
      "2026-07-01T07:00:00.000Z",
    );
  });

  it("reads a time that does not exist as the time after the gap", () => {
    // New York: 02:00 to 03:00 is skipped on 2026-03-08.
    expect(iso(wallTimeToInstant("2026-03-08", 2 * 60 + 30, NY))).toBe(
      "2026-03-08T07:30:00.000Z",
    );
    // Berlin: 02:00 to 03:00 is skipped on 2026-03-29.
    expect(iso(wallTimeToInstant("2026-03-29", 2 * 60 + 30, BERLIN))).toBe(
      "2026-03-29T01:30:00.000Z",
    );
  });

  it("reads a time that happens twice as the first one", () => {
    // New York: 01:00 to 02:00 happens twice on 2026-11-01.
    expect(iso(wallTimeToInstant("2026-11-01", 60 + 30, NY))).toBe(
      "2026-11-01T05:30:00.000Z",
    );
    // Berlin: 02:00 to 03:00 happens twice on 2026-10-25.
    expect(iso(wallTimeToInstant("2026-10-25", 2 * 60 + 30, BERLIN))).toBe(
      "2026-10-25T00:30:00.000Z",
    );
  });

  it("round-trips every quarter hour of the transition weeks", () => {
    for (const [zone, from] of [
      [NY, "2026-03-05"],
      [NY, "2026-10-30"],
      [BERLIN, "2026-03-26"],
      [BERLIN, "2026-10-22"],
    ] as const) {
      for (let day = 0; day < 7; day++) {
        const key = addDays(from, day);
        for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
          const ms = wallTimeToInstant(key, minutes, zone);
          // The result lands on the same day, or the next where a time was skipped.
          expect([key, addDays(key, 1)]).toContain(dayKey(ms, zone));
        }
      }
    }
  });
});

describe("startOfDay, monthWindow and dayLength", () => {
  it("counts 23 and 25 hour days", () => {
    expect(dayLength("2026-03-08", NY)).toBe(23);
    expect(dayLength("2026-11-01", NY)).toBe(25);
    expect(dayLength("2026-03-29", BERLIN)).toBe(23);
    expect(dayLength("2026-10-25", BERLIN)).toBe(25);
    expect(dayLength("2026-11-11", NY)).toBe(24);
  });

  it("starts a day at its first minute where midnight is skipped", () => {
    // Havana moves clocks forward at 00:00, so the day starts at 01:00.
    const start = startOfDay("2026-03-08", "America/Havana");
    expect(dayKey(start, "America/Havana")).toBe("2026-03-08");
    expect(dayKey(start - 1, "America/Havana")).toBe("2026-03-07");
  });

  it("bounds a month by the zone, not by UTC", () => {
    const { from, to } = monthWindow("2026-11", NY);
    expect(iso(from)).toBe("2026-11-01T04:00:00.000Z");
    expect(iso(to)).toBe("2026-12-01T05:00:00.000Z");
    expect(dayKey(from, NY)).toBe("2026-11-01");
    expect(dayKey(to - 1, NY)).toBe("2026-11-30");
  });

  it("moves months and days over year ends", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("normalizeSlots", () => {
  it("sorts, removes duplicates and drops values that are not times", () => {
    const slots = normalizeSlots(
      [
        { start: "2026-11-11T15:00:00Z" },
        { start: "2026-11-11T14:00:00Z", end: "2026-11-11T14:45:00Z" },
        { start: "2026-11-11T15:00:00Z" },
        { start: "not a time" },
        { start: "" },
      ],
      30,
    );
    expect(slots.map((slot) => slot.id)).toEqual([
      "2026-11-11T14:00:00.000Z",
      "2026-11-11T15:00:00.000Z",
    ]);
    expect(slots[0].end - slots[0].start).toBe(45 * 60_000);
    expect(slots[1].end - slots[1].start).toBe(30 * 60_000);
  });

  it("takes a Date, a string and a number", () => {
    const ms = utc("2026-11-11T14:00:00Z");
    expect(
      normalizeSlots([{ start: new Date(ms) }, { start: ms + 1_800_000 }]),
    ).toHaveLength(2);
    expect(toMs(undefined)).toBeNaN();
  });
});

describe("groupSlotsByDay", () => {
  const slots = normalizeSlots(
    [
      { start: "2026-11-12T01:30:00Z" },
      { start: "2026-11-12T04:30:00Z" },
      { start: "2026-11-12T05:00:00Z" },
    ],
    30,
  );

  it("groups by the day in the zone", () => {
    expect(Object.keys(groupSlotsByDay(slots, "UTC"))).toEqual(["2026-11-12"]);
    const days = groupSlotsByDay(slots, NY);
    expect(Object.keys(days)).toEqual(["2026-11-11", "2026-11-12"]);
    expect(days["2026-11-11"]).toHaveLength(2);
    expect(days["2026-11-12"]).toHaveLength(1);
  });

  it("moves a slot to the next day when the zone passes midnight", () => {
    // 23:30 on Nov 11 in New York, then 00:30 on Nov 12 in Berlin.
    const late = normalizeSlots([{ start: "2026-11-12T04:30:00Z" }]);
    expect(Object.keys(groupSlotsByDay(late, NY))).toEqual(["2026-11-11"]);
    expect(Object.keys(groupSlotsByDay(late, BERLIN))).toEqual(["2026-11-12"]);
  });

  it("keeps a 23 hour day whole", () => {
    // Every half hour of 2026-03-08 in New York: 23 hours, 46 slots.
    const from = startOfDay("2026-03-08", NY);
    const to = startOfDay("2026-03-09", NY);
    const day = slotsFromWindows([{ start: from, end: to }]);
    const days = groupSlotsByDay(day, NY);
    expect(Object.keys(days)).toEqual(["2026-03-08"]);
    expect(days["2026-03-08"]).toHaveLength(46);
  });

  it("keeps a 25 hour day whole", () => {
    const from = startOfDay("2026-10-25", BERLIN);
    const to = startOfDay("2026-10-26", BERLIN);
    const days = groupSlotsByDay(
      slotsFromWindows([{ start: from, end: to }]),
      BERLIN,
    );
    expect(Object.keys(days)).toEqual(["2026-10-25"]);
    expect(days["2026-10-25"]).toHaveLength(50);
  });
});

describe("slotsFromWindows", () => {
  it("cuts a window into slots of the duration", () => {
    const slots = slotsFromWindows(
      [{ start: "2026-11-11T14:00:00Z", end: "2026-11-11T16:00:00Z" }],
      { duration: 30 },
    );
    expect(slots.map((slot) => slot.id.slice(11, 16))).toEqual([
      "14:00",
      "14:30",
      "15:00",
      "15:30",
    ]);
  });

  it("steps by less than the duration and drops a slot that does not fit", () => {
    const slots = slotsFromWindows(
      [{ start: "2026-11-11T14:00:00Z", end: "2026-11-11T15:00:00Z" }],
      { duration: 30, step: 15 },
    );
    expect(slots.map((slot) => slot.id.slice(11, 16))).toEqual([
      "14:00",
      "14:15",
      "14:30",
    ]);
  });

  it("returns nothing for a duration that is not positive", () => {
    expect(
      slotsFromWindows(
        [{ start: "2026-11-11T14:00:00Z", end: "2026-11-11T16:00:00Z" }],
        { duration: 0 },
      ),
    ).toEqual([]);
  });
});

describe("formatSlotTimes", () => {
  it("writes the time in the zone", () => {
    const slots = normalizeSlots([
      { start: "2026-11-11T14:00:00Z" },
      { start: "2026-11-11T14:30:00Z" },
    ]);
    expect(formatSlotTimes(slots, { locale: "en", timeZone: NY })).toEqual([
      "9:00 AM",
      "9:30 AM",
    ]);
    expect(
      formatSlotTimes(slots, {
        locale: "en",
        timeZone: BERLIN,
        hourCycle: "h23",
      }),
    ).toEqual(["15:00", "15:30"]);
  });

  it("names the zone on the hour the clocks go back", () => {
    // 01:30 happens twice on 2026-11-01 in New York.
    const slots = normalizeSlots([
      { start: "2026-11-01T05:30:00Z" },
      { start: "2026-11-01T06:30:00Z" },
      { start: "2026-11-01T07:30:00Z" },
    ]);
    const labels = formatSlotTimes(slots, { locale: "en", timeZone: NY });
    expect(labels[0]).toMatch(/^1:30 AM E[DS]T$/);
    expect(labels[1]).toMatch(/^1:30 AM E[DS]T$/);
    expect(labels[0]).not.toBe(labels[1]);
    expect(labels[2]).toBe("2:30 AM");
  });

  it("leaves the hour the clocks go forward out", () => {
    const slots = slotsFromWindows([
      {
        start: startOfDay("2026-03-08", NY),
        end: startOfDay("2026-03-08", NY) + 5 * 3_600_000,
      },
    ]);
    const labels = formatSlotTimes(slots, { locale: "en", timeZone: NY });
    expect(labels).not.toContain("2:00 AM");
    expect(labels).not.toContain("2:30 AM");
    expect(labels).toContain("1:30 AM");
    expect(labels).toContain("3:00 AM");
  });
});

describe("formatDay and nextAvailableDay", () => {
  it("writes a calendar day without a zone", () => {
    expect(formatDay("2026-11-13", "en")).toBe("Fri, Nov 13");
    expect(
      formatDay("2026-11-11", "en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    ).toBe("Wednesday, Nov 11");
  });

  it("finds the first day after another with a slot", () => {
    const days = { "2026-11-13": [1], "2026-11-11": [1], "2026-11-20": [1] };
    expect(nextAvailableDay(days, "2026-11-11")).toBe("2026-11-13");
    expect(nextAvailableDay(days, "2026-11-12")).toBe("2026-11-13");
    expect(nextAvailableDay(days, "2026-11-20")).toBeUndefined();
  });
});
