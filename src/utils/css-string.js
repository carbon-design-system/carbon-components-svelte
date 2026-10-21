// @ts-check

const SPECIAL_CHARS = /[\\']/g;
const NEWLINE = /\n/g;

/**
 * Wrap text in a single-quoted CSS string, escaping the quote, backslash and
 * newline characters that would otherwise end the string early or drop the
 * declaration.
 *
 * @param {string} value
 * @returns {string}
 */
export function toCssString(value) {
  return `'${value.replace(SPECIAL_CHARS, "\\$&").replace(NEWLINE, "\\A ")}'`;
}
