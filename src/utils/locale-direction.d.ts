/**
 * The writing direction of the locale `Intl.NumberFormat` resolves `locale`
 * to: `"rtl"` for Arabic or Hebrew, `"ltr"` for English. `undefined` is the
 * runtime's default locale.
 */
export function localeDirection(locale: string | undefined): "ltr" | "rtl";
