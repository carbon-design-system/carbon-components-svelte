// @ts-check
// Number input string parsing and clamping.

/** Period/dot characters. */
const RE_DOT = /\./g;
/** Comma and Arabic decimal separator (٫). */
const RE_COMMA = /[,٫]/g;

/**
 * Non-Western decimal digit ranges that `Intl.NumberFormat` renders for some
 * locales (e.g. "ar-EG" formats using Arabic-Indic ٠-٩), mapped to their
 * Unicode codepoint offset from the localized "0".
 */
const DIGIT_RANGES = [
  [0x0660, 0x0669], // Arabic-Indic
  [0x06f0, 0x06f9], // Extended Arabic-Indic (Persian)
  [0x0966, 0x096f], // Devanagari
  [0x09e6, 0x09ef], // Bengali
  [0xff10, 0xff19], // Fullwidth
];

/**
 * Replace non-Western digit glyphs with ASCII `0`-`9` so `Number()` can parse them.
 *
 * @param {string} raw
 * @returns {string}
 */
function normalizeDigits(raw) {
  let result = "";
  for (const char of raw) {
    const code = char.codePointAt(0);
    const range = DIGIT_RANGES.find(
      ([start, end]) => code >= start && code <= end,
    );
    result += range ? String(code - range[0]) : char;
  }
  return result;
}

/**
 * Replace comma and ٫ with `.`. Use while the user is still typing, before blur.
 *
 * @param {string} raw
 * @returns {string}
 */
function replaceDecimalSeparators(raw) {
  return normalizeDigits(raw).replace(RE_COMMA, ".");
}

/**
 * Normalize on blur when both `.` and `,`/`٫` appear. The last separator is
 * decimal; strip the others as thousands grouping ("1.000,5" → "1000.5",
 * "1,000.5" → "1000.5").
 *
 * @param {string} raw
 * @returns {string}
 */
function normalizeLocale(raw) {
  const normalized = normalizeDigits(raw);
  const lastComma = Math.max(
    normalized.lastIndexOf(","),
    normalized.lastIndexOf("٫"),
  );
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      return normalized.replace(RE_DOT, "").replace(RE_COMMA, ".");
    }
    return normalized.replace(RE_COMMA, "");
  }

  return replaceDecimalSeparators(normalized);
}

/**
 * Parse a raw string to a number. Returns `null` for `""`, `"-"`, or NaN.
 *
 * @param {string} raw
 * @param {boolean} [useLocaleNormalize] - On blur, disambiguate thousands vs decimal separators.
 * @returns {number | null}
 */
export function parse(raw, useLocaleNormalize = false) {
  if (raw === "" || raw === "-") return null;
  const num = Number(
    useLocaleNormalize ? normalizeLocale(raw) : replaceDecimalSeparators(raw),
  );
  return Number.isNaN(num) ? null : num;
}

/**
 * Parse a display string with explicit group and decimal separators. Returns
 * `null` for `""`, `"-"`, or NaN.
 *
 * @param {string} raw
 * @param {string} groupSeparator - Thousands separator (may be empty).
 * @param {string} decimalSeparator - Decimal separator.
 * @returns {number | null}
 */
export function parseLocaleValue(raw, groupSeparator, decimalSeparator) {
  if (raw === "" || raw === "-") return null;
  let normalized = raw;
  if (groupSeparator) {
    normalized = normalized.split(groupSeparator).join("");
  }
  if (decimalSeparator !== ".") {
    normalized = normalized.replace(decimalSeparator, ".");
  }
  const num = Number(normalizeDigits(normalized));
  return Number.isNaN(num) ? null : num;
}

/**
 * Validate that `input` uses digits and separators consistent with `locale`
 * (or plain ASCII digits/separators when `locale` is undefined). Intended for
 * use as a `NumberInput` `validate` function.
 *
 * @param {string} input
 * @param {string | undefined} locale
 * @returns {boolean}
 */
export function validateNumberSeparators(input, locale) {
  if (input === "" || input === "-") return true;
  if (locale === undefined) return parse(input) !== null;

  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const groupSeparator = parts.find((p) => p.type === "group")?.value ?? "";
  const decimalSeparator =
    parts.find((p) => p.type === "decimal")?.value ?? ".";
  return parseLocaleValue(input, groupSeparator, decimalSeparator) !== null;
}

/**
 * First step value when the field is empty: `stepStartValue` if set, else `min`,
 * else 0.
 *
 * @param {number | undefined} stepStartValue
 * @param {number | undefined} min
 * @returns {number}
 */
export function getDefaultValue(stepStartValue, min) {
  if (stepStartValue !== undefined) return stepStartValue;
  return min === undefined ? 0 : min;
}

/**
 * Clamp `value` to `[min, max]`. Skip `min` or `max` when undefined.
 *
 * @param {number} value
 * @param {number | undefined} min
 * @param {number | undefined} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (max !== undefined && value > max) return max;
  if (min !== undefined && value < min) return min;
  return value;
}

/**
 * Round `value` to the decimal places in `step` (fixes 0.1 + 0.2 drift).
 *
 * @param {number} value
 * @param {number} step
 * @returns {number}
 */
export function roundToStep(value, step) {
  const decimalPlaces = step.toString().split(".")[1]?.length || 0;
  return Number(value.toFixed(decimalPlaces));
}
