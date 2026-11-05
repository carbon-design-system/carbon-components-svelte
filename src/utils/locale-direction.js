// @ts-check
// The writing direction of the locale `Intl` formats a number in.
import { BoundedFifoCache } from "./bounded-fifo-cache.js";
import { getNumberFormatter } from "./intl-formatter-cache.js";

/** Scripts written right to left, as ISO 15924 codes. */
const RTL_SCRIPTS = new Set([
  "Adlm",
  "Arab",
  "Hebr",
  "Mand",
  "Mend",
  "Nkoo",
  "Rohg",
  "Samr",
  "Syrc",
  "Thaa",
  "Yezi",
]);

/** @type {BoundedFifoCache<string, "ltr" | "rtl">} */
const cache = new BoundedFifoCache(32);

/**
 * The writing direction of the locale `Intl.NumberFormat` resolves `locale`
 * to: `"rtl"` for Arabic or Hebrew, `"ltr"` for English. `undefined` is the
 * runtime's default locale.
 *
 * Intl output is written for its own locale's direction. Lay it out in that
 * direction, isolated from the page, so `+12%` keeps its sign in front on an
 * RTL page, and an Arabic `-1.2 ألف` keeps its word after the number on an
 * LTR one.
 *
 * @param {string | undefined} locale
 * @returns {"ltr" | "rtl"}
 */
export function localeDirection(locale) {
  const resolved = getNumberFormatter(locale).resolvedOptions().locale;
  let direction = cache.get(resolved);
  if (!direction) {
    const { script } = new Intl.Locale(resolved).maximize();
    direction = script && RTL_SCRIPTS.has(script) ? "rtl" : "ltr";
    cache.set(resolved, direction);
  }
  return direction;
}

/**
 * The writing direction of the language tag `locale`, as the tag itself
 * reads, without asking `Intl.NumberFormat` which locale it resolved to.
 * Uses `Intl.Locale`'s text info where the engine has it, and the script
 * of the tag's likely subtags (`ar` is Arabic, `pa-Arab` is too) where it
 * does not. A missing or invalid tag is `"ltr"`.
 *
 * It is a pure function of the tag, so a server and a browser agree. Use
 * it to write `<html lang dir>` for a `LocaleProvider`'s locale.
 *
 * @param {string | undefined} locale
 * @returns {"ltr" | "rtl"}
 */
export function getLocaleDirection(locale) {
  if (!locale) return "ltr";
  let direction = cache.get(`tag:${locale}`);
  if (!direction) {
    direction = "ltr";
    try {
      const parsed = new Intl.Locale(locale);
      // `getTextInfo()` is the standard name; Chromium 99 to 130 had a
      // `textInfo` getter instead.
      const text = /** @type {any} */ (parsed);
      const info =
        typeof text.getTextInfo === "function"
          ? text.getTextInfo()
          : text.textInfo;
      if (info?.direction) {
        direction = info.direction === "rtl" ? "rtl" : "ltr";
      } else {
        const { script } = parsed.maximize();
        direction = script && RTL_SCRIPTS.has(script) ? "rtl" : "ltr";
      }
    } catch {
      // An invalid tag has no direction to read.
    }
    cache.set(`tag:${locale}`, direction);
  }
  return direction;
}
