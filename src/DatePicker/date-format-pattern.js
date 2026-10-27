// @ts-check

/** @typedef {import("./calendar-dates.js").CalendarLocale} CalendarLocale */

const REGEX_SPECIAL_CHARS = /[/\\^$*+?.()|[\]{}]/g;

/** @type {Record<string, string>} */
const dateFormatTokens = {
  d: "\\d{1,2}",
  j: "\\d{1,2}",
  m: "\\d{1,2}",
  n: "\\d{1,2}",
  Y: "\\d{4}",
  Q: "[1-4]",
  y: "\\d{2}",
  H: "\\d{1,2}",
  G: "\\d{1,2}",
  h: "\\d{1,2}",
  i: "\\d{1,2}",
  S: "\\d{1,2}",
  s: "\\d{1,2}",
  // AM/PM names can hold spaces and periods ("p. m."), but never digits.
  K: "\\D+",
};

/**
 * Month and weekday names come from the locale, as the parser reads them,
 * so "févr." or "März" pass where `\w+` (ASCII only) would not.
 * @type {Record<string, (l10n: CalendarLocale) => string[]>}
 */
const dateNameTokens = {
  F: (l10n) => l10n.months.longhand,
  M: (l10n) => l10n.months.shorthand,
  D: (l10n) => l10n.weekdays.shorthand,
  l: (l10n) => l10n.weekdays.longhand,
};

/**
 * The input's `pattern` for a `dateFormat`.
 *
 * @param {string} fmt
 * @param {CalendarLocale} l10n
 */
export function dateFormatToPattern(fmt, l10n) {
  let result = "";
  for (let i = 0; i < fmt.length; i++) {
    const ch = fmt[i];
    if (ch === "\\" && i + 1 < fmt.length) {
      result += fmt[++i].replace(REGEX_SPECIAL_CHARS, "\\$&");
    } else if (dateFormatTokens[ch]) {
      result += dateFormatTokens[ch];
    } else if (dateNameTokens[ch]) {
      const names = dateNameTokens[ch](l10n).map((name) =>
        name.replace(REGEX_SPECIAL_CHARS, "\\$&"),
      );
      result += `(?:${names.join("|")})`;
    } else {
      result += ch.replace(REGEX_SPECIAL_CHARS, "\\$&");
    }
  }
  return result;
}

/**
 * `datePickerType="multiple"` joins each selected date with Flatpickr's
 * default `", "` conjunction into one input value, so the derived pattern
 * must allow one or more repetitions instead of a single date.
 *
 * @param {string} fmt
 * @param {CalendarLocale} l10n
 */
export function dateFormatToMultiplePattern(fmt, l10n) {
  const single = dateFormatToPattern(fmt, l10n);
  return `${single}(, ${single})*`;
}
