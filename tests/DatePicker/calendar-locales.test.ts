import {
  formatDate,
  getCalendarLocale,
  isMonthFirst,
  yearSuffix,
} from "../../src/DatePicker/calendar-dates.js";
import { dateFormatToPattern } from "../../src/DatePicker/date-format-pattern.js";

// Each language tag's calendar strings, checked against the runtime's own
// Intl data: Gregorian names (the grid is Gregorian), the first day of the
// week, and month/year order.
const TAGS = [
  "en-GB",
  "de",
  "fr",
  "es",
  "it",
  "pt-BR",
  "nl",
  "sv",
  "pl",
  "ru",
  "uk",
  "tr",
  "fa",
  "ar",
  "ar-EG",
  "ar-SA",
  "he",
  "ja",
  "zh",
  "zh-TW",
  "ko",
  "th",
  "hi",
  "vi",
  "id",
  "fi",
  "cs",
  "el",
  "hu",
  "da",
];

// Formats whose output the input's derived `pattern` must accept.
const INPUT_FORMATS = ["m/d/Y", "Y-m-d", "d.m.y", "m/d/Y H:i:S", "m/d/Y h:i K"];

// Single and double digits, both sides of noon.
const INPUT_DATES = [
  new Date(2026, 0, 5, 9, 5, 7),
  new Date(2026, 5, 15, 12, 0, 0),
  new Date(2026, 10, 25, 23, 59, 59),
];

const gregorian = (tag: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(`${tag}-u-ca-gregory`, options);

type WeekInfo = { firstDay: number };
const weekInfo = (tag: string): WeekInfo | undefined => {
  const locale = new Intl.Locale(tag) as Intl.Locale & {
    getWeekInfo?: () => WeekInfo;
    weekInfo?: WeekInfo;
  };
  return locale.getWeekInfo?.() ?? locale.weekInfo;
};

describe.each(TAGS)("%s", (tag) => {
  const locale = getCalendarLocale(tag);

  it("names Gregorian months", () => {
    const format = gregorian(tag, { month: "long" });
    expect(locale.months.longhand).toEqual(
      Array.from({ length: 12 }, (_, i) => format.format(new Date(2000, i, 1))),
    );
  });

  it("tells every weekday heading apart", () => {
    expect(new Set(locale.weekdays.shorthand).size).toBe(7);
  });

  it("starts the week on the locale's first day", (context) => {
    const info = weekInfo(tag);
    if (!info) context.skip();
    // Intl numbers days 1 (Monday) to 7 (Sunday).
    expect(locale.firstDayOfWeek).toBe((info?.firstDay ?? 0) % 7);
  });

  it("orders month and year like the locale", () => {
    const parts = gregorian(tag, {
      year: "numeric",
      month: "long",
    }).formatToParts(new Date(2000, 0, 1));
    const monthFirst =
      parts.findIndex((part) => part.type === "month") <
      parts.findIndex((part) => part.type === "year");
    expect(isMonthFirst(tag)).toBe(monthFirst);
  });

  it("writes the locale's word after a leading year", () => {
    const parts = gregorian(tag, {
      year: "numeric",
      month: "long",
    }).formatToParts(new Date(2000, 0, 1));
    const year = parts.findIndex((part) => part.type === "year");
    const month = parts.findIndex((part) => part.type === "month");
    const between =
      year < month
        ? parts
            .slice(year + 1, month)
            .map((part) => part.value)
            .join("")
            .trim()
        : "";
    expect(yearSuffix(tag)).toBe(between);
  });

  it("formats dates the input's derived pattern accepts", () => {
    const rejected: string[] = [];
    for (const format of INPUT_FORMATS) {
      // Browsers compile the pattern attribute with the `v` flag.
      const pattern = new RegExp(`^(?:${dateFormatToPattern(format)})$`, "v");
      for (const date of INPUT_DATES) {
        const text = formatDate(date, format, locale);
        if (!pattern.test(text)) rejected.push(`${format}: ${text}`);
      }
    }
    expect(rejected).toEqual([]);
  });
});

it("shows German weekdays as two-letter names", () => {
  expect(getCalendarLocale("de").weekdays.shorthand).toEqual([
    "So",
    "Mo",
    "Di",
    "Mi",
    "Do",
    "Fr",
    "Sa",
  ]);
});

it.each([
  ["ja", "年"],
  ["ko", "년"],
  ["de", ""],
  ["en", ""],
])("writes %s years with the suffix %j", (tag, suffix) => {
  expect(yearSuffix(tag)).toBe(suffix);
});
