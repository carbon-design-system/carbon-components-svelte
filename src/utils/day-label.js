// @ts-check
import { getRelativeTimeFormatter } from "./intl-formatter-cache.js";

/**
 * The label for a day this many days before today, such as "Today" or
 * "Yesterday", in `locale`. Other values read as the locale's phrasing for
 * that distance, for example "2 days ago".
 *
 * @param {number} daysAgo
 * @param {string} [locale]
 * @returns {string}
 */
export function dayLabel(daysAgo, locale) {
  const text = getRelativeTimeFormatter(locale, { numeric: "auto" }).format(
    -daysAgo,
    "day",
  );
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
