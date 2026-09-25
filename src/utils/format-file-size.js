// @ts-check

const UNITS = {
  decimal: { base: 1000, symbols: ["B", "kB", "MB", "GB", "TB"] },
  binary: { base: 1024, symbols: ["B", "KiB", "MiB", "GiB", "TiB"] },
};

/** @type {Map<string, Intl.NumberFormat>} */
const formatters = new Map();

/** @param {string} locale */
function getFormatter(locale) {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      useGrouping: false,
    });
    formatters.set(locale, formatter);
  }
  return formatter;
}

/**
 * Format a byte count as a human-readable size. `units: "decimal"`
 * (default) uses 1000 (B, kB, MB, GB, TB); `units: "binary"` uses 1024
 * (B, KiB, MiB, GiB, TiB). Rounds to one fractional digit and drops a
 * trailing ".0". Pass `locale` to format the number with that locale's
 * decimal separator.
 * @param {number} bytes
 * @param {{ units?: "decimal" | "binary"; locale?: string }} [options]
 * @returns {string}
 */
export function formatFileSize(bytes, options = {}) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const { base, symbols } = UNITS[options.units ?? "decimal"];
  let value = Math.round(bytes * 10) / 10;
  let i = 0;
  while (value >= base && i < symbols.length - 1) {
    value = Math.round((value / base) * 10) / 10;
    i += 1;
  }
  const text = options.locale
    ? getFormatter(options.locale).format(value)
    : String(value);
  return `${text} ${symbols[i]}`;
}
