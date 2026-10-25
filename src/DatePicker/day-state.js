// @ts-check
import { compareDays } from "./calendar-dates.js";

/**
 * @typedef {{
 *   selected: ReadonlyArray<Date>;
 *   range?: boolean;
 *   today: Date;
 *   isEnabled: (date: Date) => boolean;
 *   isBlocked?: (date: Date) => boolean;
 * }} DayStateContext
 */

/**
 * @typedef {{
 *   selected: boolean;
 *   rangeStart: boolean;
 *   rangeEnd: boolean;
 *   inRange: boolean;
 *   disabled: boolean;
 *   blocked: boolean;
 *   today: boolean;
 * }} DayState
 */

/**
 * The class each state adds to a day cell, in the order cells list them.
 * Literal strings, so CSS pruning can find them.
 */
export const DAY_STATE_CLASSES = /** @type {const} */ ({
  selected: "bx--date-picker__day--selected",
  rangeStart: "bx--date-picker__day--range-start",
  rangeEnd: "bx--date-picker__day--range-end",
  inRange: "bx--date-picker__day--in-range",
  today: "bx--date-picker__day--today",
  disabled: "bx--date-picker__day--disabled",
});

/**
 * The state of one day cell: whether it is picked, a range end, inside a
 * picked range, today, or can't be picked. The calendar engine and
 * DateCalendar both draw their days from it.
 *
 * @param {Date} date
 * @param {DayStateContext} context
 * @param {"previous" | "next"} [outside] A day of the neighbouring month.
 * @returns {DayState}
 */
export function dayState(date, context, outside) {
  const { selected, range = false, today, isEnabled, isBlocked } = context;
  const enabled = isEnabled(date);
  const blocked = enabled && !!isBlocked?.(date);
  const picked = selected.some(
    (day) => day instanceof Date && compareDays(day, date) === 0,
  );
  const isSelected = enabled && picked;
  /** @param {number} end */
  const isEnd = (end) =>
    isSelected &&
    range &&
    !!selected[end] &&
    compareDays(date, selected[end]) === 0;
  const withinRange =
    range &&
    selected.length === 2 &&
    compareDays(date, selected[0]) >= 0 &&
    compareDays(date, selected[1]) <= 0;
  return {
    selected: isSelected,
    rangeStart: isEnd(0),
    rangeEnd: isEnd(1),
    // A picked end shown again as the next month's lead-in reads as part
    // of the span.
    inRange:
      (isSelected && range && outside === "next") || (withinRange && !picked),
    disabled: !enabled || blocked,
    // Can't be picked now, but still takes focus (a pending range's limit).
    blocked,
    today: compareDays(date, today) === 0,
  };
}

/**
 * A day cell's full class list, for renderers that write it in one go.
 *
 * @param {DayState} state
 * @param {boolean} outside
 */
export function dayClassName(state, outside) {
  let className = "bx--date-picker__day";
  if (outside) className += " bx--date-picker__day--outside-month";
  for (const key of /** @type {Array<keyof typeof DAY_STATE_CLASSES>} */ (
    Object.keys(DAY_STATE_CLASSES)
  )) {
    if (state[key]) className += ` ${DAY_STATE_CLASSES[key]}`;
  }
  return className;
}
