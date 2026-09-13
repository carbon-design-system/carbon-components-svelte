export function getNumberFormatter(
  locale: string | undefined,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat;

export function getRelativeTimeFormatter(
  locale: string | undefined,
  options?: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat;

export function getDateTimeFormatter(
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat;
