import {
  compareDays,
  formatDate,
  getCalendarLocale,
  isMonthFirst,
  isoWeek,
  parseDate,
} from "../../src/DatePicker/calendar-dates.js";

const en = getCalendarLocale("en");
const context = (dateFormat: string, onError = vi.fn()) => ({
  l10n: en,
  dateFormat,
  onError,
});

describe("getCalendarLocale", () => {
  it("uses Carbon's single-letter weekdays for English", () => {
    expect(en.weekdays.shorthand).toEqual(["S", "M", "T", "W", "Th", "F", "S"]);
    expect(en.firstDayOfWeek).toBe(0);
  });

  it("resolves other locale keys through Intl", () => {
    const de = getCalendarLocale("de");

    expect(de.months.longhand[2]).toBe("März");
    expect(de.weekdays.longhand[1]).toBe("Montag");
    expect(de.firstDayOfWeek).toBe(1);
  });

  it("merges a partial locale object over English", () => {
    const locale = getCalendarLocale({ firstDayOfWeek: 1 });

    expect(locale.firstDayOfWeek).toBe(1);
    expect(locale.months.longhand[0]).toBe("January");
  });
});

describe("formatDate", () => {
  const date = new Date(2024, 2, 5);

  it.each([
    ["m/d/Y", "03/05/2024"],
    ["n/j/y", "3/5/24"],
    ["F j, Y", "March 5, 2024"],
    ["D, M j", "T, Mar 5"],
    ["l", "Tuesday"],
    ["J", "5th"],
    ["\\W\\e\\e\\k W", "Week 10"],
  ])("formats %s", (format, expected) => {
    expect(formatDate(date, format, en)).toBe(expected);
  });
});

describe("parseDate", () => {
  it("parses by format", () => {
    const parsed = parseDate("15.03.2024", context("d.m.Y"));

    expect(parsed).toEqual(new Date(2024, 2, 15));
  });

  it("parses month names", () => {
    expect(parseDate("March 5, 2024", context("F j, Y"))).toEqual(
      new Date(2024, 2, 5),
    );
  });

  it("accepts dates, timestamps, and today", () => {
    const now = new Date(2024, 2, 5, 13, 30);

    expect(parseDate(now, context("Y"), undefined, true)).toEqual(
      new Date(2024, 2, 5),
    );
    expect(parseDate(now.getTime(), context("Y"))).toEqual(now);
    expect(parseDate("today", context("Y"))?.getHours()).toBe(0);
  });

  it("reports and returns undefined for unparseable text", () => {
    const onError = vi.fn();

    expect(parseDate("not-a-date", context("m/d/Y", onError))).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid date provided: not-a-date" }),
    );
  });

  it("uses a custom parser", () => {
    const parsed = parseDate("x", {
      ...context("Y"),
      parseDate: () => new Date(2000, 0, 1),
    });

    expect(parsed).toEqual(new Date(2000, 0, 1));
  });
});

describe("helpers", () => {
  it("computes the ISO week", () => {
    expect(isoWeek(new Date(2024, 0, 1))).toBe(1);
    expect(isoWeek(new Date(2021, 0, 3))).toBe(53);
  });

  it("compares by day", () => {
    expect(compareDays(new Date(2024, 2, 5, 1), new Date(2024, 2, 5, 23))).toBe(
      0,
    );
    expect(
      compareDays(new Date(2024, 2, 6), new Date(2024, 2, 5)),
    ).toBeGreaterThan(0);
  });

  it("detects locales that put the year first", () => {
    expect(isMonthFirst("en")).toBe(true);
    expect(isMonthFirst("ja")).toBe(false);
  });
});
