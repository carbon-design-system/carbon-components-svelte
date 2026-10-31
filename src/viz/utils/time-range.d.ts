import type { Readable } from "svelte/store";

export type TimeRangeValue = {
  from: Date;
  to: Date;
  /** The preset the range came from, such as `"7d"`, or `null` for two dates. */
  preset: string | null;
};

export type TimeRangeOptions = {
  /** Presets as a count and a unit: `m`, `h`, `d`, or `w`. @default ["1h", "24h", "7d", "30d"] */
  presets?: ReadonlyArray<string>;
  /** The preset, or the two dates, to start from. @default presets[0] */
  initial?: string | readonly [Date | number, Date | number];
  /** The clock a preset counts back from. @default Date.now */
  now?: () => number;
};

export type TimeRange = Readable<TimeRangeValue> & {
  presets: ReadonlyArray<string>;
  /** Set a preset, or two dates in either order. */
  set(next: string | readonly [Date | number, Date | number]): void;
  /** Count a preset back from now again. Two dates stay as they are. */
  refresh(): void;
  /** Move the window by its own length: `-1` for the previous one, `1` for the next. */
  shift(steps: number): void;
  /** Refresh a preset on an interval. Returns the stop. */
  refreshEvery(ms: number): () => void;
};

/** One time range for a page of charts, as a store with presets. */
export function createTimeRange(options?: TimeRangeOptions): TimeRange;

/** The length of a preset in milliseconds, or `null` when it is not one. */
export function presetLength(preset: string): number | null;

/** The words for a preset: "Last 7 days". */
export function presetLabel(preset: string, locale?: string): string;

/** A range as one short string for a URL: the preset, or two ISO dates. */
export function timeRangeToParam(value: TimeRangeValue): string;

/** A range read back from `timeRangeToParam`, or `undefined` for junk. */
export function timeRangeFromParam(
  raw: string,
): string | [Date, Date] | undefined;
