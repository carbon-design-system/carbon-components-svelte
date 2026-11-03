/**
 * The countries and territories the engine can name, as ISO 3166-1 alpha-2
 * codes. Empty where the engine has no `Intl.DisplayNames`.
 */
export function listRegions(): string[];

/** The name of a region in a locale. UN M.49 numeric codes name groups. */
export function regionName(locale: string, code: string): string | undefined;

/**
 * The name of a region in the language it is mostly written in: "Schweiz"
 * for "CH". `undefined` where the engine has no data for that language.
 */
export function regionNativeName(code: string): string | undefined;

/** The region a locale is most likely in: "US" for "en". */
export function localeRegion(locale: string): string;

/** The languages the engine can name, by two-letter code, plus a few more. */
export function listLanguages(): string[];

/** Common script and region variants: "pt-BR", "zh-Hant". */
export function listLanguageVariants(): string[];

/** The name of a language, script or regional variant in a locale. */
export function languageName(
  locale: string,
  tag: string,
  display?: "dialect" | "standard",
): string | undefined;

/**
 * A language's name in itself: "français" for "fr". `undefined` where the
 * engine has no data for the language.
 */
export function languageEndonym(
  tag: string,
  display?: "dialect" | "standard",
): string | undefined;

/** The first of the browser's languages that a list has, or `""`. */
export function matchLanguage(
  tags: ReadonlyArray<string>,
  available: ReadonlyArray<string>,
): string;
