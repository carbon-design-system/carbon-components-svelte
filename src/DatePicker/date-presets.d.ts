/** What a preset's `value` is computed from, each time it's chosen. */
export interface DatePresetContext {
  /** The current date and time. */
  today: Date;
  /** The calendar's first day of the week, 0 (Sunday) to 6 (Saturday). */
  firstDayOfWeek: number;
  /** Whether the picker also sets a time of day. */
  time: boolean;
}

/** A date, or the first and last dates of a range. */
export type DatePresetValue = (
  context: DatePresetContext,
) => Date | [Date, Date];

/** A shortcut beside the calendar, such as "Last 7 days". */
export interface DatePickerPreset {
  label: string;
  value: DatePresetValue;
  disabled?: boolean;
}

/**
 * Values for `presets`. Each returns a span's first and last day; a
 * `"single"` picker takes the first.
 */
export const datePresets: Readonly<{
  today: DatePresetValue;
  yesterday: DatePresetValue;
  /** The last `days` days, today included. */
  lastDays: (days: number) => DatePresetValue;
  thisWeek: DatePresetValue;
  thisMonth: DatePresetValue;
  lastMonth: DatePresetValue;
  yearToDate: DatePresetValue;
}>;
