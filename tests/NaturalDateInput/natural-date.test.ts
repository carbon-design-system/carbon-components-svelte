// @vitest-environment node
import {
  formatNaturalDate,
  NATURAL_DATE_EN,
  NATURAL_DATE_MAX_LENGTH,
  type NaturalDateOptions,
  naturalDateOrder,
  parseNaturalDate,
} from "../../src/NaturalDateInput/natural-date.js";

const pad = (n: number) => String(n).padStart(2, "0");

/** The date, and the time when the text named one, on the zone's wall. */
function wall(text: string, options: NaturalDateOptions = {}) {
  const r = parseNaturalDate(text, options);
  if (!r.ok) return `!${r.reason}`;
  const day = `${r.year}-${pad(r.month)}-${pad(r.day)}`;
  return r.hasTime ? `${day} ${pad(r.hour)}:${pad(r.minute)}` : day;
}

// Thursday, November 12, 2026, 10:30 in New York (EST, UTC-5).
const NOW = new Date("2026-11-12T15:30:00Z");
const base: NaturalDateOptions = {
  now: NOW,
  timeZone: "America/New_York",
  locale: "en-US",
};

type Row = [text: string, expected: string, options?: NaturalDateOptions];

describe("relative days", () => {
  it.each<Row>([
    ["today", "2026-11-12"],
    ["tomorrow", "2026-11-13"],
    ["tmrw", "2026-11-13"],
    ["yesterday", "2026-11-11"],
    ["  Tomorrow  ", "2026-11-13"],
    ["TOMORROW", "2026-11-13"],
    ["tomorrow,", "2026-11-13"],
    ["due tomorrow", "2026-11-13"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });
});

describe("weekdays", () => {
  it.each<Row>([
    // A weekday alone is the next one after today.
    ["friday", "2026-11-13"],
    ["Fri", "2026-11-13"],
    ["on friday", "2026-11-13"],
    ["thursday", "2026-11-19"],
    ["thu", "2026-11-19"],
    ["wednesday", "2026-11-18"],
    // "this" counts today.
    ["this thursday", "2026-11-12"],
    ["this friday", "2026-11-13"],
    ["this wednesday", "2026-11-18"],
    // "next" is the weekday of next week; the week starts on Sunday here.
    ["next friday", "2026-11-20"],
    ["next thursday", "2026-11-19"],
    ["next sunday", "2026-11-15"],
    ["next saturday", "2026-11-21"],
    // ... and on Monday in a locale that starts the week there.
    ["next sunday", "2026-11-22", { weekStart: 1 }],
    ["next monday", "2026-11-16", { weekStart: 1 }],
    ["next monday", "2026-11-16", { weekStart: 0 }],
    // "last" is the latest one before today.
    ["last friday", "2026-11-06"],
    ["last thursday", "2026-11-05"],
    ["last monday", "2026-11-09"],
    ["previous monday", "2026-11-09"],
    // Preferring the past reads a bare weekday backward.
    ["friday", "2026-11-06", { prefer: "past" }],
    ["thursday", "2026-11-05", { prefer: "past" }],
    ["this thursday", "2026-11-12", { prefer: "past" }],
    ["this friday", "2026-11-06", { prefer: "past" }],
    ["sat", "2026-11-14", { prefer: "nearest" }],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("reads next on a Sunday by where the week starts", () => {
    // Sunday, November 15. A Monday-start week ends today, so next
    // Monday is tomorrow. A Sunday-start week begins today.
    const sunday = new Date("2026-11-15T15:30:00Z");
    expect(wall("next monday", { ...base, now: sunday, weekStart: 1 })).toBe(
      "2026-11-16",
    );
    expect(wall("next monday", { ...base, now: sunday, weekStart: 0 })).toBe(
      "2026-11-23",
    );
    expect(wall("monday", { ...base, now: sunday, weekStart: 0 })).toBe(
      "2026-11-16",
    );
  });

  it("takes the week start from the locale", () => {
    // en-US starts on Sunday, en-GB on Monday.
    const sunday = new Date("2026-11-15T15:30:00Z");
    expect(wall("next monday", { ...base, now: sunday })).toBe("2026-11-23");
    expect(wall("next monday", { ...base, now: sunday, locale: "en-GB" })).toBe(
      "2026-11-16",
    );
  });
});

describe("amounts of time", () => {
  it.each<Row>([
    ["in 2 weeks", "2026-11-26"],
    ["in 3 days", "2026-11-15"],
    ["in a week", "2026-11-19"],
    ["in two weeks", "2026-11-26"],
    ["in 1 month", "2026-12-12"],
    ["in 1 year", "2027-11-12"],
    ["in 2d", "2026-11-14"],
    ["in 2w", "2026-11-26"],
    ["2 days ago", "2026-11-10"],
    ["a week ago", "2026-11-05"],
    ["3 weeks from now", "2026-12-03"],
    ["2 days later", "2026-11-14"],
    ["in 2 days at 3pm", "2026-11-14 15:00"],
    ["in 90 minutes", "2026-11-12 12:00"],
    ["in 2 hours", "2026-11-12 12:30"],
    ["in an hour", "2026-11-12 11:30"],
    ["in 30 min", "2026-11-12 11:00"],
    ["2 hours ago", "2026-11-12 08:30"],
    ["in 14 hours", "2026-11-13 00:30"],
    ["now", "2026-11-12 10:30"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("clamps a month to its last day", () => {
    const jan31 = new Date("2027-01-31T17:00:00Z");
    expect(wall("in 1 month", { ...base, now: jan31 })).toBe("2027-02-28");
    expect(wall("in 13 months", { ...base, now: jan31 })).toBe("2028-02-29");
    expect(
      wall("1 year ago", { ...base, now: new Date("2028-02-29T17:00:00Z") }),
    ).toBe("2027-02-28");
  });
});

describe("weeks, months and years", () => {
  it.each<Row>([
    // The first working day of the week, and the first day of the others.
    ["next week", "2026-11-16"],
    ["this week", "2026-11-09"],
    ["last week", "2026-11-02"],
    ["next month", "2026-12-01"],
    ["this month", "2026-11-01"],
    ["last month", "2026-10-01"],
    ["next year", "2027-01-01"],
    ["this year", "2026-01-01"],
    // The end of them.
    ["end of week", "2026-11-13"],
    ["eow", "2026-11-13"],
    ["end of next week", "2026-11-20"],
    ["end of this week", "2026-11-13"],
    ["end of month", "2026-11-30"],
    ["eom", "2026-11-30"],
    ["end of next month", "2026-12-31"],
    ["end of year", "2026-12-31"],
    ["eoy", "2026-12-31"],
    ["end of the month", "2026-11-30"],
    // A work week of four days.
    ["eow", "2026-11-12", { workWeek: [1, 4] }],
    // A work week that starts on Sunday.
    ["next week", "2026-11-15", { workWeek: [0, 4] }],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("rolls the end of a week that is over into the next one", () => {
    const saturday = new Date("2026-11-14T15:30:00Z");
    expect(wall("eow", { ...base, now: saturday })).toBe("2026-11-20");
    expect(wall("eow", { ...base, now: saturday, prefer: "past" })).toBe(
      "2026-11-13",
    );
    expect(wall("end of this week", { ...base, now: saturday })).toBe(
      "2026-11-20",
    );
    expect(wall("end of last week", { ...base, now: saturday })).toBe(
      "2026-11-06",
    );
  });
});

describe("end of day", () => {
  it.each<Row>([
    ["eod", "2026-11-12 17:00"],
    ["end of day", "2026-11-12 17:00"],
    ["eod tomorrow", "2026-11-13 17:00"],
    ["tomorrow eod", "2026-11-13 17:00"],
    ["friday eod", "2026-11-13 17:00"],
    ["eod", "2026-11-12 18:30", { eod: "18:30" }],
    ["eod", "2026-11-12 16:15", { eod: [16, 15] }],
    // Bad settings fall back to 17:00.
    ["eod", "2026-11-12 17:00", { eod: "25:00" }],
    ["eod", "2026-11-12 17:00", { eod: "nine" }],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("is today when it has passed", () => {
    const evening = new Date("2026-11-12T23:30:00Z");
    expect(wall("eod", { ...base, now: evening })).toBe("2026-11-12 17:00");
  });
});

describe("times", () => {
  it.each<Row>([
    ["tomorrow 3pm", "2026-11-13 15:00"],
    ["3pm tomorrow", "2026-11-13 15:00"],
    ["tomorrow at 3:30 pm", "2026-11-13 15:30"],
    ["tomorrow at 15:00", "2026-11-13 15:00"],
    ["tomorrow at 15:00:30", "2026-11-13 15:00"],
    ["tomorrow noon", "2026-11-13 12:00"],
    ["noon tomorrow", "2026-11-13 12:00"],
    ["tomorrow midnight", "2026-11-13 00:00"],
    ["tomorrow at 12am", "2026-11-13 00:00"],
    ["tomorrow at 12pm", "2026-11-13 12:00"],
    ["tomorrow 3 PM", "2026-11-13 15:00"],
    ["tomorrow 3 p.m.", "2026-11-13 15:00"],
    ["tomorrow 9 a.m", "2026-11-13 09:00"],
    ["next Fri 3pm", "2026-11-20 15:00"],
    ["next fri at 9:15am", "2026-11-20 09:15"],
    // A bare time rolls to the next time it is that time.
    ["3pm", "2026-11-12 15:00"],
    ["9am", "2026-11-13 09:00"],
    ["10:30am", "2026-11-12 10:30"],
    ["10:29am", "2026-11-13 10:29"],
    ["noon", "2026-11-12 12:00"],
    ["midnight", "2026-11-13 00:00"],
    ["15:00", "2026-11-12 15:00"],
    ["3pm", "2026-11-11 15:00", { prefer: "past" }],
    ["9am", "2026-11-12 09:00", { prefer: "past" }],
    ["9am", "2026-11-12 09:00", { prefer: "nearest" }],
    ["3pm", "2026-11-12 15:00", { prefer: "nearest" }],
    // With no am or pm, a 12-hour clock reads 1 to 6 as the afternoon.
    ["tomorrow at 3", "2026-11-13 15:00"],
    ["tomorrow at 2:30", "2026-11-13 14:30"],
    ["tomorrow at 7", "2026-11-13 07:00"],
    ["tomorrow at 7:30", "2026-11-13 07:30"],
    ["tomorrow at 12", "2026-11-13 12:00"],
    ["tomorrow at 18", "2026-11-13 18:00"],
    ["tomorrow at 02:30", "2026-11-13 02:30"],
    // ... and a 24-hour locale reads it as written.
    ["tomorrow at 3", "2026-11-13 03:00", { locale: "en-GB" }],
    ["tomorrow at 2:30", "2026-11-13 02:30", { locale: "de" }],
    // A bare number is not a time.
    ["tomorrow 3", "!unrecognized"],
    ["3", "!unrecognized"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it.each<Row>([
    ["tomorrow 13pm", "!invalid-time"],
    ["tomorrow 0pm", "!invalid-time"],
    ["tomorrow 3:60pm", "!invalid-time"],
    ["tomorrow 25:00", "!invalid-time"],
    ["tomorrow 24:00", "!invalid-time"],
    ["tomorrow at 15:00:99", "!invalid-time"],
    ["tomorrow at 25", "!invalid-time"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });
});

describe("month names", () => {
  it.each<Row>([
    ["dec 3", "2026-12-03"],
    ["Dec 3", "2026-12-03"],
    ["december 3rd", "2026-12-03"],
    ["dec. 3", "2026-12-03"],
    ["3 dec", "2026-12-03"],
    ["3rd of december", "2026-12-03"],
    ["the 3rd of December", "2026-12-03"],
    ["dec 3, 2027", "2027-12-03"],
    ["3 dec 2027", "2027-12-03"],
    ["dec 3 2027 3pm", "2027-12-03 15:00"],
    ["dec 3 at 15:00", "2026-12-03 15:00"],
    ["dec 3 3pm", "2026-12-03 15:00"],
    ["3pm on dec 3", "2026-12-03 15:00"],
    ["Sept 9", "2027-09-09"],
    // A date with no year rolls by the preference.
    ["nov 11", "2027-11-11"],
    ["nov 12", "2026-11-12"],
    ["nov 13", "2026-11-13"],
    ["dec 3", "2025-12-03", { prefer: "past" }],
    ["nov 12", "2026-11-12", { prefer: "past" }],
    ["may 15", "2026-05-15", { prefer: "nearest" }],
    ["jan 20", "2027-01-20", { prefer: "nearest" }],
    // Feb 29 waits for a leap year.
    ["feb 29", "2028-02-29"],
    ["feb 29", "2024-02-29", { prefer: "past" }],
    ["feb 29 2028", "2028-02-29"],
    ["feb 29 2027", "!invalid-date"],
    ["feb 30", "!invalid-date"],
    ["apr 31", "!invalid-date"],
    ["dec 32", "!invalid-date"],
    ["dec 0", "!invalid-date"],
    ["dec 3 0999", "!invalid-date"],
    // The weekday only labels the date.
    ["fri nov 20", "2026-11-20"],
    ["nov 20 fri", "2026-11-20"],
    ["friday, dec 4", "2026-12-04"],
    // A month alone is not a date.
    ["dec", "!unrecognized"],
    ["december 2027", "!unrecognized"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("reads the names of the locale", () => {
    expect(wall("3. Dezember", { ...base, locale: "de" })).toBe("2026-12-03");
    expect(wall("3 Dez. 2027", { ...base, locale: "de" })).toBe("2027-12-03");
    expect(wall("Mittwoch", { ...base, locale: "de" })).toBe("2026-11-18");
    expect(wall("3 déc", { ...base, locale: "fr" })).toBe("2026-12-03");
    expect(wall("3 décembre 2027", { ...base, locale: "fr" })).toBe(
      "2027-12-03",
    );
    expect(wall("3 dic", { ...base, locale: "es" })).toBe("2026-12-03");
    expect(wall("3 декабря", { ...base, locale: "ru" })).toBe("2026-12-03");
    // English still works in a locale that has its own names.
    expect(wall("dec 3", { ...base, locale: "de" })).toBe("2026-12-03");
  });
});

describe("numeric dates", () => {
  it.each<Row>([
    // The order of the locale: month first in the US.
    ["3/12", "2027-03-12", { locale: "en-US" }],
    ["3/12", "2026-12-03", { locale: "en-GB" }],
    ["3/12", "2026-12-03", { locale: "de" }],
    ["3.12.", "2026-12-03", { locale: "de" }],
    ["3.12", "2026-12-03", { locale: "de" }],
    ["3/12", "2026-12-03", { locale: "fr" }],
    ["3-12", "2026-12-03", { locale: "nl" }],
    // A locale that writes the year first writes month, then day.
    ["3/12", "2027-03-12", { locale: "ja" }],
    ["3/12", "2027-03-12", { locale: "sv" }],
    ["12/3/26", "2026-12-03", { locale: "en-US" }],
    ["12/3/26", "2026-03-12", { locale: "en-GB" }],
    ["12.3.2026", "2026-03-12", { locale: "de" }],
    ["12/3/2026", "2026-12-03", { locale: "en-US" }],
    ["2026/12/3", "2026-12-03", { locale: "ja" }],
    ["26/12/3", "2026-12-03", { locale: "ja" }],
    // A year first is always year, month, day.
    ["2026-12-03", "2026-12-03", { locale: "en-US" }],
    ["2026-12-03", "2026-12-03", { locale: "en-GB" }],
    ["2026.12.03", "2026-12-03", { locale: "de" }],
    ["2026-12-03 15:00", "2026-12-03 15:00"],
    ["3/12 3pm", "2027-03-12 15:00", { locale: "en-US" }],
    ["3/12 15:30", "2026-12-03 15:30", { locale: "en-GB" }],
    // When the locale's order is impossible, the other is read.
    ["25/12", "2026-12-25", { locale: "en-US" }],
    ["13/3", "2027-03-13", { locale: "en-US" }],
    ["3/25", "2027-03-25", { locale: "en-GB" }],
    ["12/25/26", "2026-12-25", { locale: "en-US" }],
    ["25/12/26", "2026-12-25", { locale: "en-US" }],
    ["13/13", "!invalid-date", { locale: "en-US" }],
    ["2/30", "!invalid-date", { locale: "en-US" }],
    ["30/2", "!invalid-date", { locale: "en-GB" }],
    ["2/29/2027", "!invalid-date", { locale: "en-US" }],
    ["0/12", "!invalid-date", { locale: "en-US" }],
    ["2026-13-01", "!invalid-date"],
    ["2026-02-29", "!invalid-date"],
    // Two-digit years are within fifty years of now.
    ["1/1/76", "1976-01-01", { locale: "en-US" }],
    ["1/1/75", "2075-01-01", { locale: "en-US" }],
    ["1/1/00", "2000-01-01", { locale: "en-US" }],
    // Only one, two or four digits are a year.
    ["1/1/202", "!unrecognized", { locale: "en-US" }],
    ["1/1/6", "!unrecognized", { locale: "en-US" }],
    ["123/1", "!unrecognized", { locale: "en-US" }],
    ["2026/12", "!unrecognized", { locale: "en-US" }],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("reports the other reading of an ambiguous date", () => {
    const us = parseNaturalDate("3/12/2026", base);
    const gb = parseNaturalDate("3/12/2026", { ...base, locale: "en-GB" });
    if (!us.ok || !gb.ok) throw new Error("expected a date");
    expect([us.month, us.day, us.ambiguous, us.swapped]).toEqual([
      3,
      12,
      true,
      false,
    ]);
    expect([gb.month, gb.day, gb.ambiguous, gb.swapped]).toEqual([
      12,
      3,
      true,
      false,
    ]);
    expect(us.alternative?.getTime()).toBe(gb.date.getTime());
    expect(gb.alternative?.getTime()).toBe(us.date.getTime());
  });

  it("is not ambiguous when the two readings agree or only one exists", () => {
    for (const text of ["5/5/2026", "13/3/2026", "2026-03-12", "mar 12 2026"]) {
      const r = parseNaturalDate(text, base);
      if (!r.ok) throw new Error(text);
      expect([text, r.ambiguous, r.alternative]).toEqual([text, false, null]);
    }
  });

  it("says when it read the other order", () => {
    const r = parseNaturalDate("25/12/2026", base);
    expect(r).toMatchObject({ ok: true, month: 12, day: 25, swapped: true });
  });

  it("learns the order from Intl", () => {
    expect(naturalDateOrder("en-US")).toBe("mdy");
    expect(naturalDateOrder("en")).toBe("mdy");
    expect(naturalDateOrder("en-GB")).toBe("dmy");
    expect(naturalDateOrder("de")).toBe("dmy");
    expect(naturalDateOrder("fr-CA")).toBe("ymd");
    expect(naturalDateOrder("ja")).toBe("ymd");
    expect(naturalDateOrder("hu")).toBe("ymd");
    // A locale that writes another calendar still gives its numeric order.
    expect(naturalDateOrder("ar-SA")).toBe("dmy");
    expect(naturalDateOrder("fa-IR")).toBe("ymd");
    // An unknown tag is English.
    expect(naturalDateOrder("not a locale")).toBe("mdy");
  });
});

describe("day of the month", () => {
  it.each<Row>([
    ["15th", "2026-11-15"],
    ["the 15th", "2026-11-15"],
    ["12th", "2026-11-12"],
    ["11th", "2026-12-11"],
    ["1st", "2026-12-01"],
    // November has no 31st.
    ["31st", "2026-12-31"],
    ["11th", "2026-11-11", { prefer: "past" }],
    ["15th", "2026-10-15", { prefer: "past" }],
    ["32nd", "!invalid-date"],
    ["0th", "!invalid-date"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });
});

describe("what it refuses", () => {
  it.each<Row>([
    ["", "!empty"],
    ["   ", "!empty"],
    [",", "!empty"],
    ["blah", "!unrecognized"],
    ["tomorrow xyz", "!unrecognized"],
    ["tomorrow friday", "!unrecognized"],
    ["tomorrow today", "!unrecognized"],
    ["3pm 4pm", "!unrecognized"],
    ["eod 3pm", "!unrecognized"],
    ["now tomorrow", "!unrecognized"],
    ["in 2 hours tomorrow", "!unrecognized"],
    ["in 2 hours 3pm", "!unrecognized"],
    ["in", "!unrecognized"],
    ["next", "!unrecognized"],
    ["next day", "!unrecognized"],
    ["in 2", "!unrecognized"],
    ["2 days", "!unrecognized"],
    ["3/", "!unrecognized"],
    ["//", "!unrecognized"],
    ["tomorrow!", "!unrecognized"],
    ["tomorrow 😀", "!unrecognized"],
    ["in 99999999 days", "!unrecognized"],
    ["in 99999 years", "!out-of-range"],
    ["99999999999999999999", "!unrecognized"],
  ])("%s", (text, expected, options) => {
    expect(wall(text, { ...base, ...options })).toBe(expected);
  });

  it("says where it stopped", () => {
    expect(parseNaturalDate("tomorrow xyz", base)).toEqual({
      ok: false,
      reason: "unrecognized",
      index: 9,
    });
    expect(parseNaturalDate("friday 3pm and more", base)).toMatchObject({
      reason: "unrecognized",
      index: 11,
    });
  });

  it("reads at most NATURAL_DATE_MAX_LENGTH characters", () => {
    const fits = `${" ".repeat(NATURAL_DATE_MAX_LENGTH - 8)}tomorrow`;
    expect(fits).toHaveLength(NATURAL_DATE_MAX_LENGTH);
    expect(wall(fits, base)).toBe("2026-11-13");
    expect(wall(`${fits} `, base)).toBe("!too-long");
  });

  it("reads at most 24 words", () => {
    expect(wall(Array(24).fill("on").join(" ") + " tomorrow", base)).toBe(
      "!unrecognized",
    );
    expect(wall(Array(23).fill("on").join(" ") + " tomorrow", base)).toBe(
      "2026-11-13",
    );
  });

  it("says empty for anything but a string", () => {
    for (const input of [undefined, null, 5, {}, []]) {
      expect(parseNaturalDate(input as never, base)).toMatchObject({
        ok: false,
        reason: "empty",
      });
    }
  });
});

describe("options", () => {
  it("accepts now as a Date, a number or an ISO string", () => {
    const options = { timeZone: "UTC", locale: "en-US" };
    const iso = "2026-11-12T15:30:00Z";
    expect(wall("today", { ...options, now: new Date(iso) })).toBe(
      "2026-11-12",
    );
    expect(wall("today", { ...options, now: Date.parse(iso) })).toBe(
      "2026-11-12",
    );
    expect(wall("today", { ...options, now: iso })).toBe("2026-11-12");
  });

  it("falls back to the clock for a now it cannot read", () => {
    const r = parseNaturalDate("now", { now: "nonsense" });
    if (!r.ok) throw new Error("expected a date");
    expect(Math.abs(r.date.getTime() - Date.now())).toBeLessThan(120_000);
  });

  it("reads the same text on the day the zone says it is", () => {
    // 02:30 UTC on Nov 13 is still Nov 12 in New York and already Nov 13 in
    // Tokyo.
    const now = new Date("2026-11-13T02:30:00Z");
    expect(wall("today", { now, timeZone: "America/New_York" })).toBe(
      "2026-11-12",
    );
    expect(wall("today", { now, timeZone: "Asia/Tokyo" })).toBe("2026-11-13");
    expect(wall("today", { now, timeZone: "UTC" })).toBe("2026-11-13");
    expect(wall("today", { now, timeZone: "Pacific/Kiritimati" })).toBe(
      "2026-11-13",
    );
    expect(wall("today", { now, timeZone: "Pacific/Pago_Pago" })).toBe(
      "2026-11-12",
    );
  });

  it("reads an unknown zone or locale as UTC and English", () => {
    const now = new Date("2026-11-12T23:30:00Z");
    expect(wall("today", { now, timeZone: "Nowhere/Land" })).toBe("2026-11-12");
    expect(wall("3/12", { now, locale: "!!", timeZone: "UTC" })).toBe(
      "2027-03-12",
    );
  });

  it("does not change an options object", () => {
    const options = Object.freeze({
      ...base,
      workWeek: [1, 5] as [number, number],
    });
    expect(() => parseNaturalDate("next week", options)).not.toThrow();
  });
});

describe("daylight saving time", () => {
  const ny = { timeZone: "America/New_York", locale: "en-US" };

  it("keeps the wall clock across a change when it counts days", () => {
    // March 7, 2026 at noon EST. Clocks go forward on March 8 at 02:00.
    const now = new Date("2026-03-07T17:00:00Z");
    expect(wall("tomorrow noon", { ...ny, now })).toBe("2026-03-08 12:00");
    const noon = parseNaturalDate("tomorrow noon", { ...ny, now });
    if (!noon.ok) throw new Error("expected a date");
    expect(noon.date.toISOString()).toBe("2026-03-08T16:00:00.000Z");
    expect(wall("in 1 day at noon", { ...ny, now })).toBe("2026-03-08 12:00");
    expect(wall("next week", { ...ny, now })).toBe("2026-03-09");
  });

  it("counts elapsed time when it counts hours", () => {
    const now = new Date("2026-03-07T17:00:00Z");
    // 24 hours after noon EST is 13:00 EDT.
    expect(wall("in 24 hours", { ...ny, now })).toBe("2026-03-08 13:00");
    expect(wall("in 1440 minutes", { ...ny, now })).toBe("2026-03-08 13:00");
    // ... and 12 hours before noon EDT is 23:00 EST the day before.
    const after = new Date("2026-03-08T16:00:00Z");
    expect(wall("12 hours ago", { ...ny, now: after })).toBe(
      "2026-03-07 23:00",
    );
  });

  it("moves a time that does not exist to the time after the gap", () => {
    const now = new Date("2026-03-07T17:00:00Z");
    // 02:30 never happens on March 8.
    expect(wall("tomorrow 2:30am", { ...ny, now })).toBe("2026-03-08 03:30");
    const r = parseNaturalDate("tomorrow 2:30am", { ...ny, now });
    if (!r.ok) throw new Error("expected a date");
    expect(r.date.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("reads a time that happens twice as the first one", () => {
    // Clocks go back on November 1 at 02:00. 01:30 happens in EDT, then EST.
    const now = new Date("2026-10-31T17:00:00Z");
    const r = parseNaturalDate("tomorrow 1:30am", { ...ny, now });
    if (!r.ok) throw new Error("expected a date");
    expect(r.date.toISOString()).toBe("2026-11-01T05:30:00.000Z");
    expect(wall("tomorrow 1:30am", { ...ny, now })).toBe("2026-11-01 01:30");
  });

  it("knows a day that is 23 or 25 hours long", () => {
    const spring = new Date("2026-03-08T05:00:00Z"); // 00:00 EST, March 8
    const day = parseNaturalDate("tomorrow", { ...ny, now: spring });
    if (!day.ok) throw new Error("expected a date");
    expect(day.date.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    const fall = new Date("2026-11-01T04:00:00Z"); // 00:00 EDT, November 1
    const next = parseNaturalDate("tomorrow", { ...ny, now: fall });
    if (!next.ok) throw new Error("expected a date");
    expect(next.date.toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("reads a date that starts an hour late, where midnight is skipped", () => {
    // Cuba moves its clocks at 00:00 on March 8, 2026.
    const now = new Date("2026-03-01T17:00:00Z");
    const r = parseNaturalDate("mar 8", {
      now,
      timeZone: "America/Havana",
      locale: "en-US",
    });
    if (!r.ok) throw new Error("expected a date");
    expect([r.month, r.day, r.hour]).toEqual([3, 8, 1]);
    expect(r.hasTime).toBe(false);
  });

  it("follows the southern hemisphere and half-hour zones", () => {
    // Sydney moves its clocks back on April 5, 2026 at 03:00.
    const now = new Date("2026-04-01T00:00:00Z");
    const sydney = parseNaturalDate("apr 5 2:30am", {
      now,
      timeZone: "Australia/Sydney",
      locale: "en-AU",
    });
    if (!sydney.ok) throw new Error("expected a date");
    expect(sydney.date.toISOString()).toBe("2026-04-04T15:30:00.000Z");
    const kathmandu = parseNaturalDate("tomorrow 9am", {
      now,
      timeZone: "Asia/Kathmandu",
      locale: "en",
    });
    if (!kathmandu.ok) throw new Error("expected a date");
    expect(kathmandu.date.toISOString()).toBe("2026-04-02T03:15:00.000Z");
  });

  it("puts a time on the wall of every zone, every day of a year", () => {
    const zones = [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "America/Havana",
      "America/Santiago",
      "America/Sao_Paulo",
      "Europe/London",
      "Europe/Berlin",
      "Asia/Kolkata",
      "Asia/Kathmandu",
      "Australia/Sydney",
      "Australia/Lord_Howe",
      "Pacific/Auckland",
      "Pacific/Apia",
    ];
    const bad: string[] = [];
    for (const timeZone of zones) {
      for (let day = 0; day < 365; day += 1) {
        const now = Date.UTC(2026, 0, 1, 12) + day * 86_400_000;
        const r = parseNaturalDate("tomorrow at 10:20", {
          now,
          timeZone,
          locale: "en-GB",
        });
        const today = new Date(
          new Intl.DateTimeFormat("en-CA", { timeZone }).format(now),
        );
        const expected = new Date(today.getTime() + 86_400_000)
          .toISOString()
          .slice(0, 10);
        const got = r.ok
          ? `${r.year}-${pad(r.month)}-${pad(r.day)} ${pad(r.hour)}:${pad(r.minute)}`
          : r.reason;
        if (got !== `${expected} 10:20`) bad.push(`${timeZone} ${day}: ${got}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("a language pack", () => {
  const de = {
    id: "de",
    locale: "de",
    words: {
      um: ["at"],
      am: ["fill"],
      heute: ["day", 0],
      morgen: ["day", 1],
      gestern: ["day", -1],
      übermorgen: ["day", 2],
      jetzt: ["now"],
      nächsten: ["mod", 1],
      nächste: ["mod", 1],
      letzten: ["mod", -1],
      in: ["in"],
      vor: ["ago"],
      woche: ["unit", "w"],
      wochen: ["unit", "w"],
      tag: ["unit", "d"],
      tage: ["unit", "d"],
      tagen: ["unit", "d"],
      stunde: ["unit", "h"],
      stunden: ["unit", "h"],
      mittag: ["time", [12, 0]],
      ein: ["num", 1],
      eine: ["num", 1],
      zwei: ["num", 2],
    },
  } satisfies NonNullable<NaturalDateOptions["pack"]>;
  const options: NaturalDateOptions = {
    ...base,
    locale: "de",
    timeZone: "Europe/Berlin",
    now: new Date("2026-11-12T09:30:00Z"),
    pack: de,
  };

  it.each<Row>([
    ["heute", "2026-11-12"],
    ["morgen", "2026-11-13"],
    ["übermorgen", "2026-11-14"],
    ["gestern", "2026-11-11"],
    ["morgen um 15:00", "2026-11-13 15:00"],
    ["morgen Mittag", "2026-11-13 12:00"],
    ["in zwei Wochen", "2026-11-26"],
    ["in 3 Tagen", "2026-11-15"],
    ["vor 3 Tagen", "2026-11-09"],
    ["in einer Stunde", "!unrecognized"],
    ["in eine Stunde", "2026-11-12 11:30"],
    ["nächsten Freitag", "2026-11-20"],
    ["nächste Woche", "2026-11-16"],
    ["letzten Montag", "2026-11-09"],
    ["am 3. Dezember", "2026-12-03"],
    ["am 3.12.", "2026-12-03"],
    ["jetzt", "2026-11-12 10:30"],
    ["Freitag um 9:00", "2026-11-13 09:00"],
  ])("%s", (text, expected, extra) => {
    expect(wall(text, { ...options, ...extra })).toBe(expected);
  });

  it("does not read the English words", () => {
    expect(wall("tomorrow", options)).toBe("!unrecognized");
    expect(wall("tomorrow", { ...options, pack: NATURAL_DATE_EN })).toBe(
      "2026-11-13",
    );
  });

  it("reads the month names of the pack language", () => {
    expect(wall("dez 3", options)).toBe("2026-12-03");
    expect(wall("dec 3", options)).toBe("!unrecognized");
  });
});

describe("formatNaturalDate", () => {
  const date = new Date("2026-11-14T20:00:00Z");
  const ny = { timeZone: "America/New_York" };

  it("writes the readback", () => {
    // ICU writes "at" or a comma before the time, by version.
    expect(formatNaturalDate(date, { ...ny, hasTime: true })).toMatch(
      /^Saturday, Nov 14, 2026(,| at) 3:00 PM$/,
    );
    expect(formatNaturalDate(date, ny)).toBe("Saturday, Nov 14, 2026");
  });

  it("writes the text a field shows", () => {
    expect(
      formatNaturalDate(date, { ...ny, hasTime: true, style: "short" }),
    ).toBe("Nov 14, 2026, 3:00 PM");
    expect(formatNaturalDate(date, { ...ny, style: "short" })).toBe(
      "Nov 14, 2026",
    );
  });

  it("names the zone on request", () => {
    expect(
      formatNaturalDate(date, { ...ny, hasTime: true, timeZoneName: true }),
    ).toMatch(/3:00 PM EST$/);
  });

  it("uses the locale's order and clock", () => {
    expect(
      formatNaturalDate(date, {
        ...ny,
        locale: "de",
        hasTime: true,
        style: "short",
      }),
    ).toBe("14. Nov. 2026, 15:00");
    expect(formatNaturalDate(date, { ...ny, locale: "en-GB" })).toMatch(
      /^Saturday,? 14 Nov 2026$/,
    );
  });

  it("writes Latin digits and the Gregorian calendar", () => {
    expect(
      formatNaturalDate(date, { locale: "ar-EG", timeZone: "UTC" }),
    ).toMatch(/^[^\d]*14[^\d]*2026$/u);
    expect(
      formatNaturalDate(date, { locale: "th-TH", timeZone: "UTC" }),
    ).toContain("2026");
  });

  it("is empty for a date that is not one, and falls back for a bad zone", () => {
    expect(formatNaturalDate(Number.NaN)).toBe("");
    expect(formatNaturalDate(new Date("nope"))).toBe("");
    expect(formatNaturalDate(date, { timeZone: "Nowhere/Land" })).toBe(
      "Saturday, Nov 14, 2026",
    );
  });

  it("writes text the parser reads back to the same moment", () => {
    const locales = [
      "en-US",
      "en-GB",
      "de",
      "fr",
      "es",
      "it",
      "nl",
      "sv",
      "pt-BR",
      "ru",
      "pl",
      "tr",
      "fi",
      "da",
      "nb",
      "cs",
      "hu",
      "ja",
      "ko",
      "zh-CN",
    ];
    const dates = [
      new Date("2026-01-05T14:15:00Z"),
      new Date("2026-03-08T07:30:00Z"),
      new Date("2026-12-31T23:59:00Z"),
      new Date("2027-07-04T00:00:00Z"),
    ];
    const lost: string[] = [];
    for (const locale of locales) {
      for (const d of dates) {
        for (const hasTime of [true, false]) {
          const options = {
            locale,
            timeZone: "UTC",
            hasTime,
            style: "short",
          } as const;
          const text = formatNaturalDate(d, options);
          const r = parseNaturalDate(text, {
            locale,
            timeZone: "UTC",
            now: d,
          });
          const expected = hasTime
            ? d.getTime()
            : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
          if (!r.ok || r.date.getTime() !== expected) {
            lost.push(`${locale} ${hasTime} ${text}`);
          }
        }
      }
    }
    // Languages whose month names are numbers and characters (ja, ko, zh)
    // and times written with a dot (fi, da) are not read back; the field
    // falls back to ISO text for them.
    expect(
      lost.filter((line) => !/^(ja|ko|zh|(fi|da) true)/.test(line)),
    ).toEqual([]);
  });
});
