// @ts-check
// Where a native `<input>` puts its one line of text, as numbers. The input
// does not follow one rule, it follows two, and a block or a flex item can
// copy only one of them. Pure, so the rules are tested without a browser.

/**
 * Hebrew, Arabic, Syriac, Thaana, NKo and their presentation forms, plus the
 * right to left scripts outside the BMP, as code point ranges. Written as
 * numbers so that no right to left character sits in this source file.
 * @type {ReadonlyArray<readonly [number, number]>}
 */
const RTL_RANGES = [
  [0x0590, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfeff],
  [0x10800, 0x10fff],
  [0x1e800, 0x1efff],
];

/** @param {number} code */
const isRtlCode = (code) =>
  RTL_RANGES.some(([from, to]) => code >= from && code <= to);

/** Any other letter is strongly left to right. */
const LETTER = /\p{L}/u;

/**
 * The direction of the first strongly directional character of `text`, which
 * is how `dir="auto"` and `unicode-bidi: plaintext` pick the direction of a
 * line. `null` when no letter is strong, such as a line of digits.
 * @param {string} text
 * @returns {"rtl" | "ltr" | null}
 */
export function firstStrong(text) {
  for (const char of text) {
    if (isRtlCode(/** @type {number} */ (char.codePointAt(0)))) return "rtl";
    if (LETTER.test(char)) return "ltr";
  }
  return null;
}

/**
 * Whether the first strongly directional character of `text` runs right to
 * left. `false` for a line with no letter.
 * @param {string} text
 * @returns {boolean}
 */
export function startsRtl(text) {
  return firstStrong(text) === "rtl";
}

/**
 * Whether a line in a field reads right to left. A field decides by its
 * `direction`, and by the line's first strong character when its text is
 * `plaintext` (Carbon's `Search` input is) or it says `dir="auto"`. A line
 * with no strong character takes the field's direction.
 * @param {string} text
 * @param {boolean} fieldRtl
 * @param {boolean} auto
 * @returns {boolean}
 */
export function paragraphIsRtl(text, fieldRtl, auto) {
  if (!auto) return fieldRtl;
  const strong = firstStrong(text);
  return strong === null ? fieldRtl : strong === "rtl";
}

/**
 * @typedef {Object} InputTextMetrics
 * @property {number} boxWidth Width of the input's content box.
 * @property {number} textWidth Width of the whole line of text.
 * @property {number} scrollLeft The input's `scrollLeft`.
 * @property {boolean} fieldRtl Whether the input's `direction` is `rtl`.
 * @property {boolean} textRtl Whether the line itself reads right to left,
 * which is the field's direction unless the line is `plaintext` or `dir="auto"`.
 * @property {string} [textAlign] The input's computed `text-align`.
 */

/**
 * The offset, from the left edge of the content box to the left edge of the
 * line of text, for the two rules an `<input>` uses:
 *
 * 1. Text that fits is aligned by the field. `text-align` says which edge,
 *    and `start` and `end` follow the field's `direction`. A Hebrew query in
 *    an LTR field sits at the left.
 * 2. Text that overflows is anchored at the start of its line's direction,
 *    and `scrollLeft` counts from there. For a line that is `plaintext` or
 *    `dir="auto"` that is its first strong character's direction: a Hebrew
 *    query in an LTR field runs off the left edge, and its `scrollLeft` is
 *    negative. For any other line it is the field's.
 *
 * A block with `unicode-bidi: plaintext` gets rule 2 right and rule 1 wrong.
 * A flex item gets rule 1 right and rule 2 wrong.
 *
 * @param {InputTextMetrics} metrics
 * @returns {number}
 */
export function inputTextOffset(metrics) {
  const { boxWidth, textWidth, scrollLeft, fieldRtl, textRtl } = metrics;
  if (textWidth > boxWidth) {
    return (textRtl ? boxWidth - textWidth : 0) - scrollLeft;
  }
  const room = boxWidth - textWidth;
  switch (metrics.textAlign) {
    case "left":
      return 0;
    case "right":
      return room;
    case "center":
      return room / 2;
    case "end":
      return fieldRtl ? 0 : room;
    default:
      return fieldRtl ? room : 0;
  }
}
