/**
 * TimePicker string parse, validate, and format helpers.
 */

export type TimeFormat = "12" | "24";

export type TimeInputPreset = {
  pattern: string;
  placeholder: string;
  maxlength: number;
};

export type ParsedTime = {
  valid: boolean;
  /** Normalized `hh:mm` / `hh:mm:ss` when valid; otherwise the input. */
  value: string;
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
};

/** Pattern / placeholder / maxlength for a `format` + `seconds` combination. */
export function getTimeInputPreset(
  format: TimeFormat,
  seconds?: boolean,
): TimeInputPreset;

/**
 * Parse and validate a time string. Empty input is valid with null parts.
 * Accepts colon-separated values and compact digit strings (`930` → 9:30).
 */
export function parseTime(
  raw: string,
  options?: { format?: TimeFormat; seconds?: boolean },
): ParsedTime;

/** Format parts to a display string, or `null` when out of range. */
export function formatTime(
  hours: number,
  minutes: number,
  options?: { format?: TimeFormat; seconds?: number | boolean },
): string | null;

/** Whether `raw` is a valid time for the given options. */
export function isValidTime(
  raw: string,
  options?: { format?: TimeFormat; seconds?: boolean },
): boolean;

/** Convert clock parts to minutes since midnight (seconds as a fraction). */
export function toMinutesSinceMidnight(
  hours: number,
  minutes: number,
  seconds?: number,
): number;

export type TimeConstraintReason = "min" | "max";

export type TimeConstraintResult = {
  valid: boolean;
  reason?: TimeConstraintReason;
};

/**
 * Check a parsed or raw time against optional `min` / `max` bounds.
 * Unset or unparsable bounds are ignored. Empty input is valid. Inclusive.
 */
export function checkTimeConstraints(
  rawOrParsed: string | ParsedTime,
  options?: {
    format?: TimeFormat;
    seconds?: boolean;
    min?: string;
    max?: string;
  },
): TimeConstraintResult;
