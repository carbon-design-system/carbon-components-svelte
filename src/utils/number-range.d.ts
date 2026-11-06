/**
 * A min-max pair of numbers: validation, splitting pasted text, and the
 * mapping to a dual-thumb slider. Pure functions; no DOM.
 */

/** One end of a range. `null` is an open end: "no minimum" or "no maximum". */
export type RangeEnd = number | null;

export type RangeValue = [RangeEnd, RangeEnd];

export type RangeSide = "min" | "max";

/**
 * Why an end is not acceptable.
 * - `required`: an open end where `allowOpen` is off.
 * - `belowMin`, `aboveMax`: outside the bounds; `limit` is the bound.
 * - `step`: between steps; `limit` is the nearest allowed value below.
 * - `crossed`: the minimum is above the maximum; `limit` is the other end.
 */
export type RangeIssueCode =
  "required" | "belowMin" | "aboveMax" | "step" | "crossed";

export type RangeIssue = { code: RangeIssueCode; limit?: number };

/**
 * Coerce a value to a tuple of finite numbers and `null`. Anything else
 * (`undefined`, `NaN`, `Infinity`, a string, a short array) reads as an open
 * end.
 */
export function normalizeRange(value: unknown): RangeValue;

/** Whether two ranges hold the same ends. */
export function rangesEqual(a: RangeValue, b: RangeValue): boolean;

/**
 * Whether `value` lands on a step counted from `base`. Compares in steps,
 * with a tolerance, so `0.3` sits on a `0.1` step.
 */
export function isOnStep(value: number, step: number, base?: number): boolean;

/**
 * Validate a range as a pair: each end against the bounds and step, then the
 * ends against each other.
 *
 * The check never changes the value. A minimum above the maximum is an error
 * on the end the person edited last (`blame`), where they are looking and
 * where the fix is; it goes away when either end changes so the pair is
 * ordered again. With no `blame`, the maximum takes it.
 */
export function validateRange(options: {
  value: unknown;
  /** Lowest allowed value for either end. */
  min?: number;
  /** Highest allowed value for either end. */
  max?: number;
  /** Allowed increment, counted from `min` (or 0). */
  step?: number;
  /** Whether an end may be `null`. Defaults to `true`. */
  allowOpen?: boolean;
  /** End to report a crossed pair on. Defaults to `"max"`. */
  blame?: RangeSide;
  /** Leave out `required`, for a field the person has not been to yet. */
  skipRequired?: boolean;
}): { min: RangeIssue | null; max: RangeIssue | null; valid: boolean };

/**
 * Read two numbers out of pasted text such as `10-250`, `10 – 250`,
 * `$10 to $250`, `8000..8100` or `-5 - -2`, in the field's own number format.
 * Returns `null` unless both sides read as numbers: a lone number, or text
 * with an end missing, is left to the field.
 *
 * A hyphen can be a minus, so every separator is tried and the first split
 * where both sides parse wins.
 */
export function parseRangeText(
  text: string,
  parseNumber: (text: string) => number | null,
): RangeValue | null;

/**
 * The slider's handles for a range: an open end rests at its bound, and
 * handles stay inside the bounds and in order, so a range the slider cannot
 * draw (an end out of bounds, a crossed pair) still shows something sensible.
 */
export function toSliderValues(
  value: unknown,
  min: number,
  max: number,
): [number, number];

/**
 * Fold what the slider reports back into the range. A handle that did not
 * move since the slider was last given its values keeps the range's end as
 * it was, so moving one handle does not close the other's open end.
 */
export function fromSliderValues(
  current: RangeValue,
  shown: [number, number],
  reported: [number, number],
): RangeValue;
