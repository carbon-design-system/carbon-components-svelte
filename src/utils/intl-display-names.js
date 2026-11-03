// @ts-check
// Countries and languages from the browser's `Intl.DisplayNames`. The engine
// can name a code but cannot list them, so the lists are found by asking it
// about every two-letter code.
import { BoundedFifoCache } from "./bounded-fifo-cache.js";

/**
 * Region codes `Intl.DisplayNames` names that are not countries or
 * territories: reserved, grouping or pseudo-locale codes. Deprecated codes
 * ("DD", "SU") are dropped by canonicalizing them instead.
 */
const NOT_COUNTRIES = new Set(
  "AC CP DG EA EU EZ IC TA UN QO XA XB ZZ".split(" "),
);

/** Language codes that name a language another code already names ("tw"). */
const DUPLICATE_LANGUAGES = new Set(["tw"]);

/**
 * Languages with no two-letter code, and the script and region variants a
 * picker most often needs. Added by `variants`.
 */
const EXTRA_LANGUAGES = ["fil", "yue", "ckb", "ast"];
const LANGUAGE_VARIANTS = [
  "ar-EG",
  "ar-SA",
  "az-Cyrl",
  "bs-Cyrl",
  "de-AT",
  "de-CH",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-IN",
  "en-US",
  "es-419",
  "es-ES",
  "es-MX",
  "fr-BE",
  "fr-CA",
  "fr-CH",
  "it-CH",
  "nl-BE",
  "pt-BR",
  "pt-PT",
  "sr-Cyrl",
  "sr-Latn",
  "uz-Cyrl",
  "zh-Hans",
  "zh-Hant",
  "zh-HK",
];

const TWO_LETTERS = /^[A-Z]{2}$/;

/** @type {BoundedFifoCache<string, Intl.DisplayNames | null>} */
const displayNamesCache = new BoundedFifoCache(64);

/**
 * @param {string | string[]} locale
 * @param {"language" | "region"} type
 * @param {"dialect" | "standard"} [languageDisplay]
 * @returns {Intl.DisplayNames | null} `null` where the engine has no
 * `Intl.DisplayNames` or rejects the locale.
 */
function getDisplayNames(locale, type, languageDisplay = "standard") {
  const key = `${type}|${languageDisplay}|${locale}`;
  let names = displayNamesCache.get(key);
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames(locale, {
        type,
        fallback: "none",
        ...(type === "language" && { languageDisplay }),
      });
    } catch {
      names = null;
    }
    displayNamesCache.set(key, names);
  }
  return names;
}

/**
 * Display names in a locale's own language, or `null` where the engine has no
 * data for it and answers in its default locale instead. Without this check,
 * an engine that lacks Icelandic would show "Iceland" as Iceland's own name.
 * @param {string} locale
 * @param {"language" | "region"} type
 * @param {"dialect" | "standard"} [languageDisplay]
 * @returns {Intl.DisplayNames | null}
 */
function getOwnDisplayNames(locale, type, languageDisplay) {
  const names = getDisplayNames(locale, type, languageDisplay);
  if (!names) return null;
  try {
    const wanted = new Intl.Locale(locale).language;
    const got = new Intl.Locale(names.resolvedOptions().locale).language;
    return wanted === got ? names : null;
  } catch {
    return null;
  }
}

/**
 * @param {Intl.DisplayNames | null} names
 * @param {string} code
 * @returns {string | undefined}
 */
function safeOf(names, code) {
  try {
    return names?.of(code) || undefined;
  } catch {
    return undefined;
  }
}

/** @type {string[] | undefined} */
let regionCodes;

/**
 * The countries and territories the engine can name, as ISO 3166-1 alpha-2
 * codes. Empty where the engine has no `Intl.DisplayNames`.
 * @returns {string[]}
 */
export function listRegions() {
  if (regionCodes) return regionCodes;
  const names = getDisplayNames("en", "region");
  const codes = [];
  if (names) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const a of letters) {
      for (const b of letters) {
        const code = a + b;
        if (
          !NOT_COUNTRIES.has(code) &&
          safeOf(names, code) &&
          canonicalRegion(code) === code
        ) {
          codes.push(code);
        }
      }
    }
  }
  regionCodes = codes;
  return codes;
}

/**
 * The current code for a deprecated one: "DD" is "DE". An unknown code is
 * returned as it came.
 * @param {string} code
 * @returns {string}
 */
function canonicalRegion(code) {
  try {
    return Intl.getCanonicalLocales(`und-${code}`)[0].slice(4);
  } catch {
    return code;
  }
}

/**
 * The name of a region in a locale: "Deutschland" for "DE" in German. UN M.49
 * numeric codes name groups ("150" is Europe).
 * @param {string} locale
 * @param {string} code
 * @returns {string | undefined}
 */
export function regionName(locale, code) {
  return safeOf(getDisplayNames(locale, "region"), code);
}

/**
 * The name of a region in the language it is mostly written in, found from
 * the region's likely locale: "Schweiz" for "CH", "日本" for "JP". `undefined`
 * when the engine knows no language for it.
 * @param {string} code
 * @returns {string | undefined}
 */
export function regionNativeName(code) {
  if (!TWO_LETTERS.test(code)) return undefined;
  let tag;
  try {
    const { language, script } = new Intl.Locale(`und-${code}`).maximize();
    if (language === "und") return undefined;
    tag = script ? `${language}-${script}` : language;
  } catch {
    return undefined;
  }
  return safeOf(getOwnDisplayNames(tag, "region"), code);
}

/**
 * The region a locale is most likely in: "US" for "en", "DE" for "de".
 * @param {string} locale
 * @returns {string}
 */
export function localeRegion(locale) {
  try {
    return new Intl.Locale(locale).maximize().region ?? "";
  } catch {
    return "";
  }
}

/** @type {string[] | undefined} */
let languageCodes;

/**
 * The languages the engine can name, by two-letter code, plus a few with
 * none. Deprecated codes ("iw", "in") are dropped by canonicalizing them.
 * @returns {string[]}
 */
export function listLanguages() {
  if (languageCodes) return languageCodes;
  const names = getDisplayNames("en", "language");
  const codes = [];
  if (names) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    for (const a of letters) {
      for (const b of letters) {
        const code = a + b;
        if (
          !DUPLICATE_LANGUAGES.has(code) &&
          safeOf(names, code) &&
          canonicalLanguage(code) === code
        ) {
          codes.push(code);
        }
      }
    }
    for (const code of EXTRA_LANGUAGES) {
      if (safeOf(names, code)) codes.push(code);
    }
  }
  languageCodes = codes;
  return codes;
}

/**
 * Common script and region variants of the languages: "pt-BR", "zh-Hant".
 * @returns {string[]}
 */
export function listLanguageVariants() {
  const names = getDisplayNames("en", "language");
  return LANGUAGE_VARIANTS.filter((tag) => safeOf(names, tag));
}

/**
 * @param {string} code
 * @returns {string}
 */
function canonicalLanguage(code) {
  try {
    return Intl.getCanonicalLocales(code)[0];
  } catch {
    return code;
  }
}

/**
 * The name of a language, script or regional variant in a locale. With
 * `"standard"`, "pt-BR" is "Portuguese (Brazil)", which sorts beside
 * "Portuguese"; with `"dialect"` it is "Brazilian Portuguese".
 * @param {string} locale
 * @param {string} tag
 * @param {"dialect" | "standard"} [display]
 * @returns {string | undefined}
 */
export function languageName(locale, tag, display) {
  return safeOf(getDisplayNames(locale, "language", display), tag);
}

/**
 * A language's name in itself: "français" for "fr". `undefined` where the
 * engine has no data for the language.
 * @param {string} tag
 * @param {"dialect" | "standard"} [display]
 * @returns {string | undefined}
 */
export function languageEndonym(tag, display) {
  return safeOf(getOwnDisplayNames(tag, "language", display), tag);
}

/**
 * The language tag the browser prefers that a list has, or `""`: the full
 * tag first ("pt-BR"), then its language ("pt").
 * @param {ReadonlyArray<string>} tags The browser's languages, best first.
 * @param {ReadonlyArray<string>} available
 * @returns {string}
 */
export function matchLanguage(tags, available) {
  for (const tag of tags) {
    if (available.includes(tag)) return tag;
    const base = tag.split("-")[0];
    if (available.includes(base)) return base;
  }
  return "";
}
