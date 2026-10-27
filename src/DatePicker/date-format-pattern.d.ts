import type { CalendarLocale } from "./calendar-dates.js";

/** The input's `pattern` for a `dateFormat`. */
export function dateFormatToPattern(fmt: string, l10n: CalendarLocale): string;

/** The input's `pattern` for comma-joined dates in "multiple" mode. */
export function dateFormatToMultiplePattern(
  fmt: string,
  l10n: CalendarLocale,
): string;
