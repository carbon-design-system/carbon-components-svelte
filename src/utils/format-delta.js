// @ts-check
// Signed change formatting, such as the delta `BigNumber` shows under its value.
import { getNumberFormatter } from "./intl-formatter-cache.js";

/** @typedef {import("./format-delta.d.ts").FormatDeltaOptions} FormatDeltaOptions */

/**
 * Format a change with an explicit sign on non-zero values: `+1.2K`, `-5%`.
 * `undefined` for a missing or `NaN` value.
 *
 * `percent: "literal"` reads the number as percent (`12` is `+12%`).
 * `percent: "ratio"` treats it as a fraction (`0.12` is `+12%`). Both
 * follow the locale's percent pattern (`+%12` in Turkish), never abbreviated.
 *
 * @param {number | null | undefined} value
 * @param {FormatDeltaOptions} [options]
 * @returns {string | undefined}
 */
export function formatDelta(value, options = {}) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  const {
    locale,
    digits,
    compact = false,
    percent,
    formatOptions,
    format,
  } = options;

  if (format) {
    const formatted = format(value);
    return value > 0 ? `+${formatted}` : formatted;
  }

  /** @type {Intl.NumberFormatOptions} */
  const intlOptions = {
    signDisplay: "exceptZero",
    maximumFractionDigits: digits,
  };
  // A percentage is never abbreviated: ICU's compact percent patterns move
  // the sign in Turkish ("%+4" for "+%4") and drop French's no-break space.
  if (compact && !percent) {
    intlOptions.notation = "compact";
    intlOptions.compactDisplay = "short";
  }
  // The "percent" unit takes the number as given, where `style: "percent"`
  // would need `value / 100` and can print float noise.
  if (percent === "literal") {
    intlOptions.style = "unit";
    intlOptions.unit = "percent";
    return getNumberFormatter(locale, intlOptions).format(value);
  }
  if (percent === "ratio") intlOptions.style = "percent";
  Object.assign(intlOptions, formatOptions);
  return getNumberFormatter(locale, intlOptions).format(value);
}
