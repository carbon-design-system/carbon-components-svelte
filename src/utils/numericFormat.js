// @ts-check
// Number input string parsing and clamping.

/** Period/dot characters. */
const RE_DOT = /\./g;
/** Comma and Arabic decimal separator (٫). */
const RE_COMMA = /[,٫]/g;

/**
 * Replace comma and ٫ with `.`. Use while the user is still typing, before blur.
 *
 * @param {string} raw
 * @returns {string}
 */
function replaceDecimalSeparators(raw) {
  return raw.replace(RE_COMMA, ".");
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
  const lastComma = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("٫"));
  const lastDot = raw.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      return raw.replace(RE_DOT, "").replace(RE_COMMA, ".");
    }
    return raw.replace(RE_COMMA, "");
  }

  return replaceDecimalSeparators(raw);
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
  const num = Number(normalized);
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
