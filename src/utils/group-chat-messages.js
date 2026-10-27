// @ts-check

import { dayLabel } from "./day-label.js";
import { getDateTimeFormatter } from "./intl-formatter-cache.js";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** @param {Date | number | string} time */
function toTime(time) {
  return time instanceof Date ? time.getTime() : new Date(time).getTime();
}

/** @param {number} time */
function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * The default divider label: "Today" or "Yesterday", a date for an older
 * day, and the time for a gap within the same day.
 *
 * @param {number} time
 * @param {{ newDay: boolean, now: number, locale?: string }} context
 */
function defaultLabel(time, { newDay, now, locale }) {
  if (!newDay) {
    return getDateTimeFormatter(locale, { timeStyle: "short" }).format(time);
  }
  const daysAgo = Math.round((startOfDay(now) - startOfDay(time)) / DAY);
  if (daysAgo === 0 || daysAgo === 1) return dayLabel(daysAgo, locale);
  return getDateTimeFormatter(locale, { dateStyle: "medium" }).format(time);
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
    author = (message) => message.author ?? message.from,
  } = options;
  const now = toTime(options.now ?? Date.now());

  /** @type {Array<{ type: "divider", key: string, time: Date, label: string } | { type: "message", key: string | number, message: Message, continued: boolean, last: boolean }>} */
  const items = [];
  /** @type {undefined | { type: "message", key: string | number, message: Message, continued: boolean, last: boolean }} */
  let previous;
  let previousTime = Number.NaN;

  messages.forEach((message, index) => {
    const time = toTime(message.time);
    const newDay = !previous || startOfDay(time) !== startOfDay(previousTime);
    const pause = !previous || time - previousTime > dividerGap;
    if (newDay || pause) {
      const label = options.label
        ? options.label(new Date(time), { newDay })
        : defaultLabel(time, { newDay, now, locale });
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
