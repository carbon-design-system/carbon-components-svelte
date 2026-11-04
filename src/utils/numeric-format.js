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
    // `char` from `for...of` is always at least one code unit, so this is
    // never undefined.
    const code = /** @type {number} */ (char.codePointAt(0));
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

/** Number with an optional symbol or unit text around it ("$-5.00", "12.5 kg"). */
const RE_AFFIXED = /^[^\d.-]*(-?)[^\d.]*(\d*\.?\d*)[^\d.]*$/;
/** Unicode minus sign ("−"), which some locales format negatives with. */
const RE_MINUS = /−/g;
/** Accounting format wraps a negative in brackets. */
const RE_BRACKETED = /^\s*\(.*\)\s*$/;

/**
 * Parse a display string with explicit group and decimal separators. Returns
 * `null` for `""`, `"-"`, or NaN.
 *
 * For the `currency`, `percent` and `unit` styles, the symbol or unit text
 * around the number is ignored, and a percent is read as a ratio ("26%" is
 * 0.26), so the text `Intl.NumberFormat` displays reads back as its value.
 *
 * @param {string} raw
 * @param {string} groupSeparator - Thousands separator (may be empty).
 * @param {string} decimalSeparator - Decimal separator.
 * @param {Intl.NumberFormatOptions["style"]} [style]
 * @returns {number | null}
 */
export function parseLocaleValue(
  raw,
  groupSeparator,
  decimalSeparator,
  style = "decimal",
) {
  if (raw === "" || raw === "-") return null;
  let normalized = raw.replace(RE_MINUS, "-");
  if (groupSeparator) {
    normalized = normalized.split(groupSeparator).join("");
  }
  if (decimalSeparator !== ".") {
    normalized = normalized.replace(decimalSeparator, ".");
  }
  normalized = normalizeDigits(normalized);
  if (style === "decimal") {
    const num = Number(normalized);
    return Number.isNaN(num) ? null : num;
  }

  const match = RE_AFFIXED.exec(normalized);
  if (!match?.[2] || match[2] === ".") return null;
  const negative = match[1] === "-" || RE_BRACKETED.test(normalized);
  // `e-2` shifts the decimal point, so 12.3 is exactly 0.123.
  const num = Number(
    `${negative ? "-" : ""}${match[2]}${style === "percent" ? "e-2" : ""}`,
  );
  return Number.isNaN(num) ? null : num;
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
