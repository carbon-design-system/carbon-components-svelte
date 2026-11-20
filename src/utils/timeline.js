// @ts-check
import {
  getDateTimeFormatter,
  getRelativeTimeFormatter,
} from "./intl-formatter-cache.js";
import { toTimestamp } from "./relative-time.js";

const DAY = 86_400_000;

/**
 * @typedef {object} TimelineGroupContext
 * @property {number} now - The reference instant, in milliseconds.
 * @property {string} [locale]
 * @property {string} [timeZone]
 */

/**
 * @template Item
 * @typedef {object} TimelineRow
 * @property {string | number} key
 * @property {Item} item
 * @property {number} index - Position in the source `items`.
 * @property {number} time - Milliseconds, or `NaN` for an event with no time.
 */

/**
 * @template Item
 * @typedef {object} TimelineGroup
 * @property {string} key
 * @property {number} time - The first dated row's time, or `NaN`.
 * @property {string | null} label - `null` for rows before the first dated one.
 * @property {TimelineRow<Item>[]} rows
 */

/**
 * The calendar day of `time` in `timeZone`, as a day count. Two times on the
 * same wall-clock day share a number whatever the offset, and the difference
 * of two numbers is whole days, so a day with 23 or 25 hours is still one.
 *
 * @param {number} time
 * @param {string | undefined} timeZone
 * @returns {number}
 */
export function dayNumber(time, timeZone) {
  const formatter = getDateTimeFormatter("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  let year = 0;
  let month = 1;
  let day = 1;
  for (const part of formatter.formatToParts(time)) {
    if (part.type === "year") year = Number(part.value);
    else if (part.type === "month") month = Number(part.value);
    else if (part.type === "day") day = Number(part.value);
  }
  return Math.floor(Date.UTC(year, month - 1, day) / DAY);
}

/** @param {string} text */
function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/**
 * The default group heading: "Today", "Yesterday" and "Tomorrow" in the
 * locale, then a short date ("Nov 5"), with the year when it is not this one.
 *
 * @param {number} time
 * @param {TimelineGroupContext} context
 * @returns {string}
 */
export function defaultGroupLabel(time, { now, locale, timeZone }) {
  const day = dayNumber(time, timeZone);
  const offset = day - dayNumber(now, timeZone);
  if (Math.abs(offset) <= 1) {
    return capitalize(
      getRelativeTimeFormatter(locale, { numeric: "auto" }).format(
        offset,
        "day",
      ),
    );
  }
  const sameYear =
    new Date(day * DAY).getUTCFullYear() ===
    new Date(dayNumber(now, timeZone) * DAY).getUTCFullYear();
  return getDateTimeFormatter(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(time);
}

/**
 * Order, window and group the events of a timeline. Pure and DOM-free.
 *
 * Events sort by time. Ties, and events with no `time` (an in-progress step
 * is the latest of all), keep their source order, so a list that arrives
 * newest first stays that way under `order: "desc"` when times are equal.
 * `limit` keeps the latest events and hides the rest. `earlier` counts what
 * `limit` cuts off whether or not `expanded` shows it, and `hidden` counts
 * what is hidden now.
 * Grouping by day starts a group each time the day changes; an event with no
 * time joins the group before it, so the in-progress step never gets a
 * heading of its own.
 *
 * @template {{ id?: string | number, time?: Date | number | string }} Item
 * @param {ReadonlyArray<Item>} items
 * @param {{
 *   order?: "asc" | "desc",
 *   groupBy?: "none" | "day",
 *   limit?: number,
 *   expanded?: boolean,
 *   now?: number,
 *   locale?: string,
 *   timeZone?: string,
 *   groupLabel?: (time: number, context: TimelineGroupContext) => string,
 * }} [options]
 * @returns {{ groups: TimelineGroup<Item>[], hidden: number, earlier: number, total: number }}
 */
export function buildTimeline(items, options = {}) {
  const {
    order = "asc",
    groupBy = "none",
    limit = Number.POSITIVE_INFINITY,
    expanded = false,
    now = Date.now(),
    locale,
    timeZone,
    groupLabel = defaultGroupLabel,
  } = options;

  /** @type {TimelineRow<Item>[]} */
  const rows = items.map((item, index) => ({
    key: item.id ?? `#${index}`,
    item,
    index,
    time: toTimestamp(item.time),
  }));

  /** @param {number} time */
  const rank = (time) => (Number.isNaN(time) ? Number.POSITIVE_INFINITY : time);
  const direction = order === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    const x = rank(a.time);
    const y = rank(b.time);
    return x === y ? 0 : x < y ? -direction : direction;
  });

  const total = rows.length;
  const keep = Number.isNaN(limit) ? total : Math.max(0, Math.floor(limit));
  const earlier = keep >= total ? 0 : total - keep;
  const hidden = expanded ? 0 : earlier;
  const visible =
    hidden === 0
      ? rows
      : order === "desc"
        ? rows.slice(0, keep)
        : rows.slice(total - keep);

  if (groupBy !== "day") {
    return {
      groups: [{ key: "all", time: Number.NaN, label: null, rows: visible }],
      hidden,
      earlier,
      total,
    };
  }

  /** @type {TimelineGroup<Item>[]} */
  const groups = [];
  /** @type {TimelineGroup<Item> | undefined} */
  let current;
  let currentDay = Number.NaN;
  for (const row of visible) {
    if (Number.isNaN(row.time)) {
      if (!current) {
        current = { key: "undated", time: Number.NaN, label: null, rows: [] };
        groups.push(current);
      }
      current.rows.push(row);
      continue;
    }
    const day = dayNumber(row.time, timeZone);
    if (!current || day !== currentDay) {
      // A headingless lead group holds undated rows only; the first dated
      // row starts a headed group after it.
      current = {
        key: `day-${day}`,
        time: row.time,
        label: groupLabel(row.time, { now, locale, timeZone }),
        rows: [],
      };
      currentDay = day;
      groups.push(current);
    }
    current.rows.push(row);
  }
  return { groups, hidden, earlier, total };
}

/** @typedef {"success" | "warning" | "error" | "info" | "pending"} TimelineStatus */

/** @type {Record<TimelineStatus, string>} */
const STATUS_TEXT = {
  success: "Success",
  warning: "Warning",
  error: "Error",
  info: "Information",
  pending: "In progress",
};

/**
 * The words that stand for a marker, since a marker alone is a shape and a
 * color. Empty for an event with no status.
 *
 * @param {TimelineStatus | undefined} status
 * @returns {string}
 */
export function defaultStatusText(status) {
  return status ? (STATUS_TEXT[status] ?? "") : "";
}

/**
 * Whether a relative time ("2 hours ago") is worth showing beside an
 * event's time: it has a time, and is no older than `within`.
 *
 * @param {number} time
 * @param {number} reference
 * @param {number} within - Milliseconds. `0` is never; `Infinity` is always.
 * @returns {boolean}
 */
export function isWithinRelative(time, reference, within) {
  if (Number.isNaN(time) || !(within > 0)) return false;
  return Math.abs(reference - time) <= within;
}
