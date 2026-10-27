// @ts-check
import { dayLabel } from "./day-label.js";
import { getDateTimeFormatter } from "./intl-formatter-cache.js";
import { toTimestamp } from "./relative-time.js";

const DAY = 24 * 60 * 60 * 1000;

/**
 * The calendar day of `time` as a number of days, in `timeZone` or the
 * runtime time zone. Differences between two results count calendar days,
 * not 24-hour windows.
 *
 * @param {number} time
 * @param {string | undefined} timeZone
 * @returns {number}
 */
function calendarDay(time, timeZone) {
  if (!timeZone) {
    const date = new Date(time);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
  }
  /** @type {Record<string, number>} */
  const parts = {};
  for (const part of getDateTimeFormatter("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(time)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return Date.UTC(parts.year, parts.month - 1, parts.day) / DAY;
}

/**
 * Group notifications by how long ago they happened: today, yesterday, and
 * everything before. A timestamp in the future counts as today, and one that
 * does not parse as previous. Items keep their order within a group, and
 * empty groups are left out.
 *
 * @template {{ timestamp: Date | number | string }} Item
 * @param {ReadonlyArray<Item>} items
 * @param {{
 *   now?: Date | number,
 *   locale?: string,
 *   timeZone?: string,
 *   labels?: { today?: string, yesterday?: string, previous?: string },
 * }} [options]
 * @returns {Array<{ key: "today" | "yesterday" | "previous", label: string, items: Item[] }>}
 */
export function groupNotificationsByRecency(items, options = {}) {
  const { locale, timeZone, labels = {} } = options;
  const today = calendarDay(toTimestamp(options.now ?? Date.now()), timeZone);

  /** @type {{ today: Item[], yesterday: Item[], previous: Item[] }} */
  const buckets = { today: [], yesterday: [], previous: [] };
  for (const item of items) {
    const time = toTimestamp(item.timestamp);
    if (Number.isNaN(time)) {
      buckets.previous.push(item);
      continue;
    }
    const daysAgo = today - calendarDay(time, timeZone);
    if (daysAgo <= 0) buckets.today.push(item);
    else if (daysAgo === 1) buckets.yesterday.push(item);
    else buckets.previous.push(item);
  }

  return /** @type {const} */ (["today", "yesterday", "previous"])
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({
      key,
      label:
        labels[key] ||
        (key === "previous"
          ? "Previous"
          : dayLabel(key === "today" ? 0 : 1, locale)),
      items: buckets[key],
    }));
}
