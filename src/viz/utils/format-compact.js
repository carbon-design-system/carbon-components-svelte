// @ts-check
// Short number, percent, and duration labels for dense graphics. Every
// formatter comes from the shared `Intl` cache: none is built per call.
import { getNumberFormatter } from "../../utils/intl-formatter-cache.js";

/** @typedef {import("./format-compact.d.ts").FormatOptions} FormatOptions */
/** @typedef {import("./format-compact.d.ts").DurationOptions} DurationOptions */
/** @typedef {import("./format-compact.d.ts").NumberFormat} NumberFormat */

/**
 * Compact notation: `10K`, `1.2M`.
 *
 * @param {number} value
 * @param {FormatOptions} [options]
 * @returns {string}
 */
export function formatCompact(value, { locale, digits = 1 } = {}) {
  return getNumberFormatter(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Format a ratio as a percentage: `0.084` becomes `8.4%`. `signed` adds a
 * plus sign to positive values, for deltas.
 *
 * @param {number} ratio
 * @param {FormatOptions & { signed?: boolean }} [options]
 * @returns {string}
 */
export function formatPercent(
  ratio,
  { locale, digits = 1, signed = false } = {},
) {
  return getNumberFormatter(locale, {
    style: "percent",
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(ratio);
}

const UNITS = /** @type {const} */ ([
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1000],
  ["millisecond", 1],
]);

/**
 * Humanize a millisecond duration using its `largest` most significant
 * units: `4d`, `2h 15m`. Units are localized through `Intl.NumberFormat`.
 *
 * @param {number} ms
 * @param {DurationOptions} [options]
 * @returns {string}
 */
export function formatDuration(
  ms,
  { locale, largest = 2, style = "narrow" } = {},
) {
  if (!Number.isFinite(ms)) return "";
  const rounded = Math.round(ms);
  let rest = Math.abs(rounded);
  /** @type {string[]} */
  const parts = [];

  for (let i = 0; i < UNITS.length && parts.length < largest; i++) {
    const [unit, size] = UNITS[i];
    // Sub-second precision only matters when nothing larger was shown.
    if (unit === "millisecond" && parts.length > 0) break;
    const amount = Math.floor(rest / size);
    if (amount === 0 && parts.length === 0 && unit !== "millisecond") continue;
    if (amount === 0 && parts.length > 0) continue;
    rest -= amount * size;
    parts.push(
      getNumberFormatter(locale, {
        style: "unit",
        unit,
        unitDisplay: style,
        maximumFractionDigits: 0,
      }).format(amount),
    );
  }

  const text = parts.join(" ");
  return rounded < 0 ? `-${text}` : text;
}

/**
 * Normalize a `format` prop to a function: `Intl.NumberFormat` options, a
 * custom function, or nothing (compact notation).
 *
 * @param {NumberFormat | undefined} format
 * @param {string} [locale]
 * @returns {(value: number) => string}
 */
export function resolveFormat(format, locale) {
  if (typeof format === "function") return format;
  if (format) {
    const formatter = getNumberFormatter(locale, format);
    return (value) => formatter.format(value);
  }
  return (value) => formatCompact(value, { locale });
}
