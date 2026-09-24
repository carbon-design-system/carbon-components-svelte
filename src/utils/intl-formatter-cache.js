// @ts-check
import { BoundedFifoCache } from "./bounded-fifo-cache.js";

/** @type {BoundedFifoCache<string, Intl.NumberFormat>} */
const numberCache = new BoundedFifoCache(32);
/** @type {BoundedFifoCache<string, Intl.RelativeTimeFormat>} */
const relativeTimeCache = new BoundedFifoCache(32);
/** @type {BoundedFifoCache<string, Intl.DateTimeFormat>} */
const dateTimeCache = new BoundedFifoCache(32);

/**
 * @param {string | undefined} locale
 * @param {object | undefined} options
 */
function cacheKey(locale, options) {
  return `${locale ?? ""}|${JSON.stringify(options)}`;
}

/**
 * @template T
 * @param {BoundedFifoCache<string, T>} cache
 * @param {new (locale: string | undefined, options?: any) => T} Ctor
 * @param {string | undefined} locale
 * @param {any} [options]
 * @returns {T}
 */
function getCached(cache, Ctor, locale, options) {
  const key = cacheKey(locale, options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Ctor(locale, options);
    cache.set(key, formatter);
  }
  return formatter;
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
  return getCached(numberCache, Intl.NumberFormat, locale, options);
}

/**
 * @param {string | undefined} locale
 * @param {Intl.RelativeTimeFormatOptions} [options]
 * @returns {Intl.RelativeTimeFormat}
 */
export function getRelativeTimeFormatter(locale, options) {
  return getCached(relativeTimeCache, Intl.RelativeTimeFormat, locale, options);
}

/**
 * @param {string | undefined} locale
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {Intl.DateTimeFormat}
 */
export function getDateTimeFormatter(locale, options) {
  return getCached(dateTimeCache, Intl.DateTimeFormat, locale, options);
}
