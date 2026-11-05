// @ts-check
// Edits to a number property: typed text, arrow keys, and scrub drags.

import { clamp } from "../utils/numeric-format.js";

/**
 * @typedef {object} NumberEdit
 * @property {"set" | "add" | "multiply"} kind - `"set"` writes `n`; `"add"` adds `n` to each object's own value; `"multiply"` scales it.
 * @property {number} n
 */

/**
 * @typedef {object} NumberLimits
 * @property {number} [min]
 * @property {number} [max]
 */

const NUMBER = String.raw`[-−]?(?:\d+[.,]?\d*|[.,]\d+)`;
const RE_EXPONENT = /e-(\d+)$/;
const RE_SET = new RegExp(String.raw`^=?\s*(${NUMBER})$`);
const RE_ADD = new RegExp(String.raw`^\+\s*(${NUMBER})$`);
const RE_MULTIPLY = new RegExp(String.raw`^[*x×]\s*(${NUMBER})$`, "i");

/**
 * @param {string} raw
 * @returns {number}
 */
function toNumber(raw) {
  return Number(raw.replace("−", "-").replace(",", "."));
}

/**
 * Read what a person typed into a number field.
 *
 * `12` and `=12` set the value. `+10` adds 10 to each object's own value,
 * `+-10` subtracts, and `*2` or `x2` scales. A leading `-` alone is a
 * negative number, not a subtraction, so `-10` sets -10. A trailing `unit`
 * is ignored.
 *
 * @param {string} text
 * @param {string} [unit]
 * @returns {NumberEdit | null} `null` when the text is not an edit.
 */
export function parseNumberEdit(text, unit) {
  let value = text.trim();
  if (unit && value.toLowerCase().endsWith(unit.toLowerCase())) {
    value = value.slice(0, value.length - unit.length).trim();
  }
  if (!value) return null;
  let match = RE_SET.exec(value);
  if (match) return { kind: "set", n: toNumber(match[1]) };
  match = RE_ADD.exec(value);
  if (match) return { kind: "add", n: toNumber(match[1]) };
  match = RE_MULTIPLY.exec(value);
  if (match) return { kind: "multiply", n: toNumber(match[1]) };
  return null;
}

/**
 * @param {number} value
 * @returns {number}
 */
function decimalPlaces(value) {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  const exponent = RE_EXPONENT.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.split(".")[1]?.length ?? 0;
}

/**
 * Apply an edit to one object's value: clamp to the limits, and round away
 * the float noise a relative edit adds (`0.1 + 0.2`).
 *
 * @param {NumberEdit} edit
 * @param {number} from
 * @param {NumberLimits & { step?: number }} [limits]
 * @returns {number}
 */
export function applyNumberEdit(edit, from, limits = {}) {
  let next;
  if (edit.kind === "add") next = from + edit.n;
  else if (edit.kind === "multiply") next = from * edit.n;
  else next = edit.n;
  const places = Math.min(
    10,
    Math.max(
      decimalPlaces(limits.step ?? 1),
      decimalPlaces(edit.n),
      decimalPlaces(from),
    ),
  );
  return clamp(Number(next.toFixed(places)), limits.min, limits.max);
}

/**
 * The change an arrow or page key makes. Shift moves 10 steps, Alt a tenth
 * of one, and Page Up or Down 10 steps, as in `NumberInput`.
 *
 * @param {string} key
 * @param {{ step: number; shiftKey?: boolean; altKey?: boolean }} options
 * @returns {number} `0` for any other key.
 */
export function keyDelta(key, { step, shiftKey, altKey }) {
  let sign = 0;
  let size = step;
  if (key === "ArrowUp") sign = 1;
  else if (key === "ArrowDown") sign = -1;
  else if (key === "PageUp") {
    sign = 1;
    size = step * 10;
  } else if (key === "PageDown") {
    sign = -1;
    size = step * 10;
  } else return 0;
  if (shiftKey) size *= 10;
  else if (altKey) size /= 10;
  return sign * size;
}

/**
 * Turn pointer travel into a running total to add to the value the drag
 * began on. Every `pixelsPerStep` of travel toward the inline end is one
 * `step`; Shift makes it 10 steps and Alt a tenth. Travel not yet worth a
 * step is kept, so a slow drag still adds up.
 *
 * @param {{ step: number; pixelsPerStep?: number; sign?: 1 | -1 }} options
 *   `sign` is `-1` where the inline end is on the left.
 */
export function createScrub({ step, pixelsPerStep = 4, sign = 1 }) {
  let remainder = 0;
  let total = 0;
  return {
    /**
     * @param {number} dx - Pointer travel since the last move, in pixels.
     * @param {{ shiftKey?: boolean; altKey?: boolean }} [modifiers]
     * @returns {number} The total so far.
     */
    move(dx, modifiers = {}) {
      remainder += dx * sign;
      const steps = Math.trunc(remainder / pixelsPerStep);
      if (!steps) return total;
      remainder -= steps * pixelsPerStep;
      const size = modifiers.shiftKey
        ? step * 10
        : modifiers.altKey
          ? step / 10
          : step;
      total = Number((total + steps * size).toFixed(10));
      return total;
    },
  };
}

/**
 * Scale a linked value by the same ratio the primary changed by, so an
 * aspect ratio holds. A primary that was 0 has no ratio, so the linked
 * value stays.
 *
 * @param {number} primaryFrom
 * @param {number} primaryTo
 * @param {number} linkedFrom
 * @returns {number}
 */
export function scaleLinked(primaryFrom, primaryTo, linkedFrom) {
  if (!primaryFrom) return linkedFrom;
  return Number(((linkedFrom * primaryTo) / primaryFrom).toFixed(4));
}
