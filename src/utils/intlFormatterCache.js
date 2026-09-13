// @ts-check
import { BoundedFifoCache } from "./boundedFifoCache.js";

const cache = new BoundedFifoCache(32);

/**
 * Get a cached `Intl.NumberFormat` for the given locale and options, constructing
 * and storing one on a cache miss. Shared across components so that identical
 * locale/options combinations reuse a single formatter instance instead of each
 * component (or each of its instances) building its own.
 *
 * @param {string | undefined} locale
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {Intl.NumberFormat}
 */
export function getNumberFormatter(locale, options) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    cache.set(key, formatter);
  }
  return formatter;
}
