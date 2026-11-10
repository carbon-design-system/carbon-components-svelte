// @ts-check
// A min-max pair of numbers: validation, splitting pasted text, and the
// mapping to a dual-thumb slider. Pure functions; no DOM.

/**
 * One end of a range. `null` is an open end: "no minimum" or "no maximum".
 * @typedef {number | null} RangeEnd
 */

/**
 * @typedef {[RangeEnd, RangeEnd]} RangeValue
 */

/**
 * @typedef {"min" | "max"} RangeSide
 */

/**
 * Why an end is not acceptable.
 * - `required`: an open end where `allowOpen` is off.
 * - `belowMin`, `aboveMax`: outside the bounds; `limit` is the bound.
 * - `step`: between steps; `limit` is the nearest allowed value below.
 * - `crossed`: the minimum is above the maximum; `limit` is the other end.
 * @typedef {"required" | "belowMin" | "aboveMax" | "step" | "crossed"} RangeIssueCode
 */

/**
 * @typedef {{ code: RangeIssueCode; limit?: number }} RangeIssue
 */

/** Float noise allowed when testing a step, in steps. */
const STEP_TOLERANCE = 1e-9;

/** Unicode minus sign, which locales and word processors write negatives with. */
const RE_MINUS = /−/g;

/**
 * Separators between two numbers in pasted text, tried at every position:
 * `..`, an ellipsis, en and em dashes, the word "to" and a hyphen.
 */
const RE_RANGE_SEPARATOR = /\s*(?:\.\.\.?|…|[–—]|\bto\b|-)\s*/giu;

/**
 * Coerce a value to a tuple of finite numbers and `null`. Anything else
 * (`undefined`, `NaN`, `Infinity`, a string, a short array) reads as an open
 * end.
 *
 * @param {unknown} value
 * @returns {RangeValue}
 */
export function normalizeRange(value) {
  const pair = Array.isArray(value) ? value : [];
  return [toEnd(pair[0]), toEnd(pair[1])];
}

/**
 * @param {unknown} end
 * @returns {RangeEnd}
 */
function toEnd(end) {
  return typeof end === "number" && Number.isFinite(end) ? end : null;
}

/**
 * Whether two ranges hold the same ends.
 *
 * @param {RangeValue} a
 * @param {RangeValue} b
 * @returns {boolean}
 */
export function rangesEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Whether `value` lands on a step counted from `base`. Compares in steps,
 * with a tolerance, so `0.3` sits on a `0.1` step.
 *
 * @param {number} value
 * @param {number} step
 * @param {number} [base]
 * @returns {boolean}
 */
export function isOnStep(value, step, base = 0) {
  if (!(step > 0)) return true;
  const steps = (value - base) / step;
  return Math.abs(steps - Math.round(steps)) < STEP_TOLERANCE;
}

/**
 * The step at or below `value`, counted from `base`.
 *
 * @param {number} value
 * @param {number} step
 * @param {number} [base]
 * @returns {number}
 */
function stepBelow(value, step, base = 0) {
  const places = (String(step).split(".")[1] ?? "").length;
  return Number(
    (base + Math.floor((value - base) / step) * step).toFixed(places),
  );
}

/**
 * Check one end against the bounds and the step.
 *
 * @param {RangeEnd} end
 * @param {{ min?: number; max?: number; step?: number; allowOpen: boolean }} rules
 * @returns {RangeIssue | null}
 */
function checkEnd(end, { min, max, step, allowOpen }) {
  if (end === null) return allowOpen ? null : { code: "required" };
  if (min !== undefined && end < min) return { code: "belowMin", limit: min };
  if (max !== undefined && end > max) return { code: "aboveMax", limit: max };
  if (step !== undefined && !isOnStep(end, step, min ?? 0)) {
    return { code: "step", limit: stepBelow(end, step, min ?? 0) };
  }
  return null;
}

/**
 * Validate a range as a pair: each end against the bounds and step, then the
 * ends against each other.
 *
 * The check never changes the value. A minimum above the maximum is an error
 * on the end the person edited last (`blame`), where they are looking and
 * where the fix is; it goes away when either end changes so the pair is
 * ordered again. With no `blame`, the maximum takes it.
 *
 * @param {object} options
 * @param {unknown} options.value
 * @param {number} [options.min] - Lowest allowed value for either end.
 * @param {number} [options.max] - Highest allowed value for either end.
 * @param {number} [options.step] - Allowed increment, counted from `min` (or 0).
 * @param {boolean} [options.allowOpen=true] - Whether an end may be `null`.
 * @param {RangeSide} [options.blame="max"] - End to report a crossed pair on.
 * @param {boolean} [options.skipRequired=false] - Leave out `required`, for a
 *   field the person has not been to yet.
 * @returns {{ min: RangeIssue | null; max: RangeIssue | null; valid: boolean }}
 */
export function validateRange({
  value,
  min,
  max,
  step,
  allowOpen = true,
  blame = "max",
  skipRequired = false,
}) {
  const [lo, hi] = normalizeRange(value);
  const rules = { min, max, step, allowOpen };
  /** @type {RangeIssue | null} */
  let loIssue = checkEnd(lo, rules);
  /** @type {RangeIssue | null} */
  let hiIssue = checkEnd(hi, rules);
  const crossed = lo !== null && hi !== null && lo > hi;
  const valid = !loIssue && !hiIssue && !crossed;

  // An end with a problem of its own reports that one; a crossed pair is
  // reported on one end only, so the other is not marked invalid too.
  if (crossed && !loIssue && !hiIssue) {
    if (blame === "min") loIssue = { code: "crossed", limit: hi };
    else hiIssue = { code: "crossed", limit: lo };
  }
  if (skipRequired) {
    if (loIssue?.code === "required") loIssue = null;
    if (hiIssue?.code === "required") hiIssue = null;
  }
  return { min: loIssue, max: hiIssue, valid };
}

/**
 * Read two numbers out of pasted text such as `10-250`, `10 – 250`,
 * `$10 to $250`, `8000..8100` or `-5 - -2`, in the field's own number format.
 * Returns `null` unless both sides read as numbers: a lone number, or text
 * with an end missing, is left to the field.
 *
 * A hyphen can be a minus, so every separator is tried and the first split
 * where both sides parse wins.
 *
 * @param {string} text
 * @param {(text: string) => number | null} parseNumber - Reads one number,
 *   `null` when the text is not one.
 * @returns {RangeValue | null}
 */
export function parseRangeText(text, parseNumber) {
  const source = text.trim().replace(RE_MINUS, "-");
  if (!source) return null;
  for (const match of source.matchAll(RE_RANGE_SEPARATOR)) {
    const left = source.slice(0, match.index).trim();
    const right = source.slice(match.index + match[0].length).trim();
    if (!left || !right) continue;
    const lo = parseNumber(left);
    const hi = lo === null ? null : parseNumber(right);
    if (lo !== null && hi !== null) return [lo, hi];
  }
  return null;
}

/**
 * The slider's handles for a range: an open end rests at its bound, and
 * handles stay inside the bounds and in order, so a range the slider cannot
 * draw (an end out of bounds, a crossed pair) still shows something sensible.
 *
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @returns {[number, number]}
 */
export function toSliderValues(value, min, max) {
  const [lo, hi] = normalizeRange(value);
  const lower = Math.min(Math.max(lo ?? min, min), max);
  const upper = Math.min(Math.max(hi ?? max, min), max);
  return [lower, Math.max(lower, upper)];
}

/**
 * Fold what the slider reports back into the range. A handle that did not
 * move since the slider was last given its values keeps the range's end as
 * it was, so moving one handle does not close the other's open end.
 *
 * @param {RangeValue} current - The range now.
 * @param {[number, number]} shown - Handles the slider was last given.
 * @param {[number, number]} reported - Handles the slider reports.
 * @returns {RangeValue}
 */
export function fromSliderValues(current, shown, reported) {
  return [
    reported[0] === shown[0] ? current[0] : reported[0],
    reported[1] === shown[1] ? current[1] : reported[1],
  ];
}
