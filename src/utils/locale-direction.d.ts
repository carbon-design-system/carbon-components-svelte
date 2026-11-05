/**
 * The writing direction of the locale `Intl.NumberFormat` resolves `locale`
 * to: `"rtl"` for Arabic or Hebrew, `"ltr"` for English. `undefined` is the
 * runtime's default locale.
 */
export function localeDirection(locale: string | undefined): "ltr" | "rtl";

/**
 * The writing direction of the language tag `locale`, as the tag itself
 * reads: `"rtl"` for `"ar"`, `"he"` and `"pa-Arab"`, `"ltr"` for the rest,
 * and for a missing or invalid tag. A pure function of the tag, so a server
 * and a browser agree. Use it to write `<html lang dir>` for a
 * `LocaleProvider`'s locale.
 */
export function getLocaleDirection(locale: string | undefined): "ltr" | "rtl";
