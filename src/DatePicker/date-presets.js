// @ts-check

/**
 * @typedef {import("./date-presets.js").DatePresetContext} DatePresetContext
 * @typedef {import("./date-presets.js").DatePresetValue} DatePresetValue
 */

/**
 * Local midnight of `date`, moved by `offset` days.
 *
 * @param {Date} date
 * @param {number} [offset]
 */
function startOfDay(date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

/**
 * The first and last day of a span. With a time, the span ends at the last
 * second of its last day, so a one-day range isn't empty.
 *
 * @param {Date} start
 * @param {Date} end
 * @param {boolean} time
 * @returns {[Date, Date]}
 */
function span(start, end, time) {
  const last = startOfDay(end);
  if (time) last.setHours(23, 59, 59);
  return [startOfDay(start), last];
}

/**
 * Values for `presets`. Each returns a span's first and last day; a
 * `"single"` picker takes the first. They read `today` and
 * `firstDayOfWeek` when the preset is chosen, so they never go stale.
 */
export const datePresets = Object.freeze({
  /** @type {DatePresetValue} */
  today: ({ today, time }) => span(today, today, time),
  /** @type {DatePresetValue} */
  yesterday: ({ today, time }) => {
    const day = startOfDay(today, -1);
    return span(day, day, time);
  },
  /**
   * The last `days` days, today included.
   *
   * @param {number} days
   * @returns {DatePresetValue}
   */
  lastDays:
    (days) =>
    ({ today, time }) =>
      span(startOfDay(today, 1 - days), today, time),
  /** @type {DatePresetValue} */
  thisWeek: ({ today, firstDayOfWeek, time }) => {
    const start = startOfDay(
      today,
      -((today.getDay() - firstDayOfWeek + 7) % 7),
    );
    return span(start, startOfDay(start, 6), time);
  },
  /** @type {DatePresetValue} */
  thisMonth: ({ today, time }) =>
    span(
      new Date(today.getFullYear(), today.getMonth(), 1),
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
      time,
    ),
  /** @type {DatePresetValue} */
  lastMonth: ({ today, time }) =>
    span(
      new Date(today.getFullYear(), today.getMonth() - 1, 1),
      new Date(today.getFullYear(), today.getMonth(), 0),
      time,
    ),
  /** @type {DatePresetValue} */
  yearToDate: ({ today, time }) =>
    span(new Date(today.getFullYear(), 0, 1), today, time),
});
