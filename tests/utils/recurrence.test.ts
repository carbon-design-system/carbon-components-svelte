import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  formatRRule,
  monthlyChoices,
  occurrences,
  parseRRule,
  type RecurrenceRule,
} from "carbon-components-svelte/utils/recurrence";

const stamp = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

function list(rule: string, start: Date, limit = 6) {
  const parsed = parseRRule(rule);
  assert(parsed);
  return occurrences(parsed, start, { limit }).map(stamp);
}

describe("parseRRule and formatRRule", () => {
  it.each([
    "FREQ=DAILY",
    "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH",
    "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO;WKST=SU",
    "FREQ=MONTHLY;BYMONTHDAY=15",
    "FREQ=MONTHLY;BYMONTHDAY=-1",
    "FREQ=MONTHLY;BYDAY=3TU",
    "FREQ=MONTHLY;BYDAY=-1FR;COUNT=12",
    "FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=29",
    "FREQ=DAILY;UNTIL=20261231",
  ])("round trips %s", (text) => {
    const rule = parseRRule(text);
    assert(rule);
    expect(formatRRule(rule)).toBe(text);
  });

  it("reads the RRULE prefix, lower case and a UTC date-time UNTIL", () => {
    const rule = parseRRule("rrule:freq=weekly;until=20261231T235959Z");
    expect(rule).toMatchObject({ freq: "WEEKLY", interval: 1 });
    expect(rule?.until).toEqual(new Date(2026, 11, 31));
  });

  it("leaves INTERVAL=1 out", () => {
    expect(formatRRule({ freq: "DAILY", interval: 1 })).toBe("FREQ=DAILY");
  });

  it.each([
    ["", "empty"],
    ["not a rule", "text"],
    ["FREQ=HOURLY", "an unsupported frequency"],
    ["FREQ=WEEKLY;BYSETPOS=1", "BYSETPOS"],
    ["FREQ=DAILY;BYHOUR=9", "a time part"],
    ["FREQ=WEEKLY;COUNT=3;UNTIL=20261231", "COUNT with UNTIL"],
    ["FREQ=WEEKLY;INTERVAL=0", "a zero interval"],
    ["FREQ=WEEKLY;BYDAY=1MO", "an ordinal on a weekly rule"],
    ["FREQ=YEARLY;BYDAY=1MO", "an ordinal on a yearly rule with no month"],
    ["FREQ=DAILY;BYDAY=MO", "BYDAY on a daily rule"],
    ["FREQ=MONTHLY;BYDAY=MO;BYMONTHDAY=3", "BYDAY with BYMONTHDAY"],
    ["FREQ=MONTHLY;BYMONTHDAY=0", "a zero month day"],
    ["FREQ=MONTHLY;BYMONTH=3", "BYMONTH on a monthly rule"],
    ["FREQ=DAILY;UNTIL=20260230", "a date that does not exist"],
    ["FREQ=DAILY;FREQ=WEEKLY", "a repeated part"],
  ])("returns null for %j (%s)", (text) => {
    expect(parseRRule(text)).toBeNull();
  });
});

describe("occurrences", () => {
  it("lists every second week on Tuesday and Thursday", () => {
    expect(
      list("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH", new Date(2026, 10, 3)),
    ).toEqual([
      "2026-11-03 00:00",
      "2026-11-05 00:00",
      "2026-11-17 00:00",
      "2026-11-19 00:00",
      "2026-12-01 00:00",
      "2026-12-03 00:00",
    ]);
  });

  it("depends on the week start for an interval over one", () => {
    const sunday = new Date(2026, 10, 1);
    const monday = list("FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO", sunday, 4);
    const sundayStart = list(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO;WKST=SU",
      sunday,
      4,
    );

    expect(monday).toEqual([
      "2026-11-01 00:00",
      "2026-11-09 00:00",
      "2026-11-15 00:00",
      "2026-11-23 00:00",
    ]);
    expect(sundayStart).toEqual([
      "2026-11-01 00:00",
      "2026-11-02 00:00",
      "2026-11-15 00:00",
      "2026-11-16 00:00",
    ]);
  });

  it("skips months without a 31st, and keeps the last day with -1", () => {
    const start = new Date(2026, 0, 31);

    expect(list("FREQ=MONTHLY", start, 4)).toEqual([
      "2026-01-31 00:00",
      "2026-03-31 00:00",
      "2026-05-31 00:00",
      "2026-07-31 00:00",
    ]);
    expect(list("FREQ=MONTHLY;BYMONTHDAY=-1", start, 4)).toEqual([
      "2026-01-31 00:00",
      "2026-02-28 00:00",
      "2026-03-31 00:00",
      "2026-04-30 00:00",
    ]);
  });

  it("repeats Feb 29 only in leap years, and the last day of a leap February", () => {
    expect(list("FREQ=YEARLY", new Date(2024, 1, 29), 3)).toEqual([
      "2024-02-29 00:00",
      "2028-02-29 00:00",
      "2032-02-29 00:00",
    ]);
    expect(
      list("FREQ=MONTHLY;BYMONTHDAY=-1", new Date(2028, 0, 31), 2)[1],
    ).toBe("2028-02-29 00:00");
  });

  it("finds the nth and last weekday of a month, skipping a missing fifth", () => {
    expect(list("FREQ=MONTHLY;BYDAY=3TU", new Date(2026, 10, 17), 3)).toEqual([
      "2026-11-17 00:00",
      "2026-12-15 00:00",
      "2027-01-19 00:00",
    ]);
    expect(list("FREQ=MONTHLY;BYDAY=-1FR", new Date(2026, 10, 27), 2)).toEqual([
      "2026-11-27 00:00",
      "2026-12-25 00:00",
    ]);
    expect(list("FREQ=MONTHLY;BYDAY=5FR", new Date(2026, 0, 30), 3)).toEqual([
      "2026-01-30 00:00",
      "2026-05-29 00:00",
      "2026-07-31 00:00",
    ]);
  });

  it("stops at COUNT, counting from the start, and at UNTIL inclusive", () => {
    const start = new Date(2026, 10, 1);

    expect(list("FREQ=DAILY;COUNT=3", start, 10)).toHaveLength(3);
    expect(list("FREQ=DAILY;UNTIL=20261103", start, 10)).toEqual([
      "2026-11-01 00:00",
      "2026-11-02 00:00",
      "2026-11-03 00:00",
    ]);
    const later = occurrences(
      parseRRule("FREQ=DAILY;COUNT=5") as RecurrenceRule,
      start,
      {
        from: new Date(2026, 10, 4),
        limit: 10,
      },
    );
    expect(later.map(stamp)).toEqual(["2026-11-04 00:00", "2026-11-05 00:00"]);
  });

  it("ends a rule that never matches", () => {
    expect(
      list("FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=30", new Date(2026, 0, 1)),
    ).toEqual([]);
  });

  it("does not list a start that fits no day of the rule", () => {
    expect(list("FREQ=WEEKLY;BYDAY=TH", new Date(2026, 10, 3), 2)).toEqual([
      "2026-11-05 00:00",
      "2026-11-12 00:00",
    ]);
  });
});

// A worker thread cannot change the time zone it started in, so each case
// runs the module in a fresh `node` process with `TZ` set.
const MODULE = pathToFileURL(
  resolve(import.meta.dirname, "../../src/utils/recurrence.js"),
).href;

function inZone<T>(zone: string, expression: string): T {
  const script = `
    import { occurrences, parseRRule } from ${JSON.stringify(MODULE)};
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    const list = (rule, start, limit) => occurrences(parseRRule(rule), start, { limit });
    console.log(JSON.stringify(${expression}));
  `;
  return JSON.parse(
    execFileSync("node", ["--input-type=module", "-e", script], {
      env: { ...process.env, TZ: zone },
      encoding: "utf8",
    }),
  );
}

describe("occurrences across daylight saving time", () => {
  const NEW_YORK = "America/New_York";

  it("keeps the local time on every date but the skipped one", () => {
    expect(
      inZone(
        NEW_YORK,
        `list("FREQ=DAILY", new Date(2026, 2, 6, 2, 30), 5).map(stamp)`,
      ),
    ).toEqual([
      "2026-03-06 02:30",
      "2026-03-07 02:30",
      // 2:30 does not exist on the spring forward date.
      "2026-03-08 03:30",
      "2026-03-09 02:30",
      "2026-03-10 02:30",
    ]);
  });

  it("keeps the local time through the repeated hour in November", () => {
    expect(
      inZone(
        NEW_YORK,
        `list("FREQ=DAILY", new Date(2026, 9, 31, 1, 30), 4).map(stamp)`,
      ),
    ).toEqual([
      "2026-10-31 01:30",
      "2026-11-01 01:30",
      "2026-11-02 01:30",
      "2026-11-03 01:30",
    ]);
  });

  it("lists one date a day where adding 24 hours would skip or repeat one", () => {
    // Clocks fall back at 2:00 on Nov 1, so 00:30 on Nov 1 to Nov 2 is 25 hours.
    const gaps = inZone<number[]>(
      NEW_YORK,
      `(() => { const days = list("FREQ=DAILY", new Date(2026, 10, 1, 0, 30), 3); return [days[1] - days[0], days[2] - days[1], days.map((d) => d.getDate()).join()]; })()`,
    );

    expect(gaps).toEqual([25 * 3_600_000, 24 * 3_600_000, "1,2,3"]);
  });

  it("agrees across zones on the dates of a start that falls late in the day", () => {
    const expression = `list("FREQ=WEEKLY;BYDAY=TU,TH", new Date(2026, 10, 3, 23, 30), 4).map(stamp)`;

    expect(inZone("Pacific/Kiritimati", expression)).toEqual(
      inZone("America/Los_Angeles", expression),
    );
  });
});

describe("monthlyChoices", () => {
  it("offers the weekday by position, and as the last one when it is", () => {
    expect(
      monthlyChoices({ year: 2026, month: 10, day: 3 }).map((c) => c.id),
    ).toEqual(["day", "nth", "lastDay"]);
    expect(
      monthlyChoices({ year: 2026, month: 10, day: 24 }).map((c) => c.id),
    ).toEqual(["day", "nth", "lastWeekday", "lastDay"]);
  });
});
