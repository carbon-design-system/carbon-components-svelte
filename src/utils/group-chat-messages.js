// @ts-check

import {
  getDateTimeFormatter,
  getRelativeTimeFormatter,
} from "./intl-formatter-cache.js";
import {
  diffCalendarDays,
  endOf,
  hostTimeZone,
  startOf,
} from "./zoned-time.js";

const MINUTE = 60_000;

/** @param {Date | number | string} time */
function toTime(time) {
  return time instanceof Date ? time.getTime() : new Date(time).getTime();
}

/** @param {string} text */
function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/**
 * The default divider label: "Today" or "Yesterday", a date for an older
 * day, and the time for a gap within the same day.
 *
 * @param {number} time
 * @param {{ newDay: boolean, now: number, locale?: string, timeZone?: string }} context
 */
function defaultLabel(time, { newDay, now, locale, timeZone }) {
  if (!newDay) {
    return getDateTimeFormatter(locale, {
      timeStyle: "short",
      timeZone,
    }).format(time);
  }
  const daysAgo = diffCalendarDays(time, now, timeZone ?? hostTimeZone());
  if (daysAgo === 0 || daysAgo === 1) {
    const relative = getRelativeTimeFormatter(locale, { numeric: "auto" });
    return capitalize(relative.format(-daysAgo, "day"));
  }
  return getDateTimeFormatter(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(time);
}

/**
 * Lay out a conversation for ChatLog: mark each message `continued` when
 * it follows one from the same author within `groupGap`, and `last` when
 * it ends its group, and insert a divider before a new day or after a
 * pause longer than `dividerGap`.
 *
 * @template {{ time: Date | number | string, author?: string, from?: string, id?: string | number }} Message
 * @param {ReadonlyArray<Message>} messages
 * @param {{
 *   groupGap?: number,
 *   dividerGap?: number,
 *   locale?: string,
 *   timeZone?: string,
 *   now?: Date | number,
 *   author?: (message: Message) => unknown,
 *   label?: (time: Date, context: { newDay: boolean }) => string,
 * }} [options]
 */
export function groupChatMessages(messages, options = {}) {
  const {
    groupGap = 5 * MINUTE,
    dividerGap = 60 * MINUTE,
    locale,
    timeZone,
    author = (message) => message.author ?? message.from,
  } = options;
  const now = toTime(options.now ?? Date.now());
  // The days are the zone's days. With no `timeZone`, the host's.
  const zone = timeZone ?? hostTimeZone();
  // Zone math costs microseconds, and a conversation is mostly runs of
  // messages on one day, so the window of the last day found answers them.
  let windowStart = Number.NaN;
  let windowEnd = Number.NaN;
  /** @param {number} time */
  const dayStart = (time) => {
    if (!Number.isFinite(time)) return Number.NaN;
    if (!(time >= windowStart && time < windowEnd)) {
      windowStart = startOf("day", time, zone);
      windowEnd = endOf("day", time, zone) + 1;
    }
    return windowStart;
  };

  /** @type {Array<{ type: "divider", key: string, time: Date, label: string } | { type: "message", key: string | number, message: Message, continued: boolean, last: boolean }>} */
  const items = [];
  /** @type {undefined | { type: "message", key: string | number, message: Message, continued: boolean, last: boolean }} */
  let previous;
  let previousTime = Number.NaN;

  messages.forEach((message, index) => {
    const time = toTime(message.time);
    const newDay = !previous || dayStart(time) !== dayStart(previousTime);
    const pause = !previous || time - previousTime > dividerGap;
    if (newDay || pause) {
      const label = options.label
        ? options.label(new Date(time), { newDay })
        : defaultLabel(time, { newDay, now, locale, timeZone });
      items.push({
        type: "divider",
        key: `divider-${time}`,
        time: new Date(time),
        label,
      });
    }
    const continued =
      !!previous &&
      !newDay &&
      !pause &&
      time - previousTime <= groupGap &&
      author(previous.message) === author(message);
    if (previous && !continued) previous.last = true;
    const item = {
      type: /** @type {const} */ ("message"),
      key: message.id ?? index,
      message,
      continued,
      last: false,
    };
    items.push(item);
    previous = item;
    previousTime = time;
  });
  if (previous) previous.last = true;
  return items;
}
