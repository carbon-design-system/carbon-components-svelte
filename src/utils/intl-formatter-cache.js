// @ts-check
import { BoundedFifoCache } from "./bounded-fifo-cache.js";

const numberCache = new BoundedFifoCache(32);
const relativeTimeCache = new BoundedFifoCache(32);
const dateTimeCache = new BoundedFifoCache(32);

/**
 * @param {string | undefined} locale
 * @param {object | undefined} options
 */
function cacheKey(locale, options) {
  return `${locale ?? ""}|${JSON.stringify(options)}`;
}

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
  const key = cacheKey(locale, options);
  let formatter = numberCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberCache.set(key, formatter);
  }
  return formatter;
}

/**
 * @param {string | undefined} locale
 * @param {Intl.RelativeTimeFormatOptions} [options]
 * @returns {Intl.RelativeTimeFormat}
 */
export function getRelativeTimeFormatter(locale, options) {
  const key = cacheKey(locale, options);
  let formatter = relativeTimeCache.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, options);
    relativeTimeCache.set(key, formatter);
  }
  return formatter;
}

/**
 * @param {string | undefined} locale
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {Intl.DateTimeFormat}
 */
export function getDateTimeFormatter(locale, options) {
  const key = cacheKey(locale, options);
  let formatter = dateTimeCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeCache.set(key, formatter);
  }
  return formatter;
}
