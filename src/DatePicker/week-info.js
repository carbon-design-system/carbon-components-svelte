// @ts-check
/**
 * Locale -> first-day-of-week data, hand-rolled from CLDR's
 * `weekData.json` (unicode-org/cldr-json, cldr-core/supplemental/weekData.json,
 * CLDR 48). Only territories that deviate from the CLDR "001" default
 * (Monday-first) are listed.
 *
 * Native `Intl.Locale.prototype.getWeekInfo()` provides this data directly,
 * but only reached Baseline in mid-2026 — this repo's browser floor (Chrome
 * 87 / Firefox 83 / Safari 14 / Edge 87, see scripts/build-css.ts) predates
 * every engine's implementation, so this table is the primary path here, not
 * a progressive-enhancement fallback.
 *
 * Days are numbered like `Date.prototype.getDay()`: 0 = Sunday, 6 = Saturday.
 */

/** @type {Record<string, number>} */
const FIRST_DAY = {
  AF: 6, // sat
  AG: 0, // sun
  AS: 0, // sun
  BD: 0, // sun
  BH: 6, // sat
  BR: 0, // sun
  BS: 0, // sun
  BT: 0, // sun
  BW: 0, // sun
  BZ: 0, // sun
  CA: 0, // sun
  CO: 0, // sun
  DJ: 6, // sat
  DM: 0, // sun
  DO: 0, // sun
  DZ: 6, // sat
  EG: 6, // sat
  ET: 0, // sun
  GT: 0, // sun
  GU: 0, // sun
  HK: 0, // sun
  HN: 0, // sun
  ID: 0, // sun
  IL: 0, // sun
  IN: 0, // sun
  IQ: 6, // sat
  IR: 6, // sat
  IS: 0, // sun
  JM: 0, // sun
  JO: 6, // sat
  JP: 0, // sun
  KE: 0, // sun
  KH: 0, // sun
  KR: 0, // sun
  KW: 6, // sat
  LA: 0, // sun
  LY: 6, // sat
  MH: 0, // sun
  MM: 0, // sun
  MO: 0, // sun
  MT: 0, // sun
  MV: 5, // fri
  MX: 0, // sun
  MZ: 0, // sun
  NI: 0, // sun
  NP: 0, // sun
  OM: 6, // sat
  PA: 0, // sun
  PE: 0, // sun
  PH: 0, // sun
  PK: 0, // sun
  PR: 0, // sun
  PT: 0, // sun
  PY: 0, // sun
  QA: 6, // sat
  SA: 0, // sun
  SD: 6, // sat
  SG: 0, // sun
  SV: 0, // sun
  SY: 6, // sat
  TH: 0, // sun
  TT: 0, // sun
  TW: 0, // sun
  UM: 0, // sun
  US: 0, // sun
  VE: 0, // sun
  VI: 0, // sun
  WS: 0, // sun
  YE: 0, // sun
  ZA: 0, // sun
  ZW: 0, // sun
};

const DEFAULT_FIRST_DAY = 1; // Monday

/**
 * Resolves a BCP 47 locale tag to its likely region via CLDR's likely-subtags
 * data (e.g. "en" -> "US", "de" -> "DE", "ar" -> "EG"), the same data `Intl`
 * uses internally. Falls back to a directly-specified region ("en-GB" -> "GB").
 *
 * @param {string} locale
 * @returns {string | undefined}
 */
function resolveRegion(locale) {
  try {
    const parsed = new Intl.Locale(locale);
    const maximized =
      typeof parsed.maximize === "function" ? parsed.maximize() : parsed;
    return maximized.region ?? parsed.region;
  } catch {
    return undefined;
  }
}

/**
 * @param {string} locale BCP 47 locale tag (e.g. "en-US", "de", "ar-EG")
 * @returns {{ firstDay: number }}
 */
export function resolveWeekInfo(locale) {
  const region = resolveRegion(locale);
  return {
    firstDay:
      region != null && region in FIRST_DAY
        ? FIRST_DAY[region]
        : DEFAULT_FIRST_DAY,
  };
}
