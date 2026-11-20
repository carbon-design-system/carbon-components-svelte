export type Instant = Date | string | number;

export interface SlotInput {
  start: Instant;
  /** Defaults to `start` plus the slot length. */
  end?: Instant;
}

export interface Slot {
  /** Milliseconds since the epoch. */
  start: number;
  /** Milliseconds since the epoch. */
  end: number;
  /** The start as an ISO 8601 string in UTC. */
  id: string;
}

/** Milliseconds since the epoch, or `NaN` for a value that is not a time. */
export function toMs(value: unknown): number;

/** Whether the runtime knows `timeZone`. */
export function isValidTimeZone(timeZone: unknown): boolean;

/** Minutes that `timeZone` is ahead of UTC at `ms` (negative west of it). */
export function zoneOffset(ms: number, timeZone: string): number;

/** The calendar day at `ms` in `timeZone`, as `YYYY-MM-DD`. */
export function dayKey(ms: number, timeZone: string): string;

/** The calendar month at `ms` in `timeZone`, as `YYYY-MM`. */
export function monthKey(ms: number, timeZone: string): string;

export function parseDay(day: string): {
  year: number;
  month: number;
  day: number;
};

/** Move a calendar day by whole days. No zone is involved. */
export function addDays(day: string, days: number): string;

/** Move a calendar month by whole months. */
export function addMonths(month: string, months: number): string;

/** Day of the week of a calendar day, 0 (Sunday) to 6. */
export function weekday(day: string): number;

/**
 * The instant at which the wall clock in `timeZone` reads `minutes` after
 * midnight on `day`. A time that happens twice is the first one. A time
 * that does not exist reads with the offset from before the gap.
 */
export function wallTimeToInstant(
  day: string,
  minutes: number,
  timeZone: string,
): number;

/** The first instant of `day` in `timeZone`. */
export function startOfDay(day: string, timeZone: string): number;

/**
 * The instants of one calendar month in `timeZone`: `from` is its first
 * instant and `to` is the first instant of the next month.
 */
export function monthWindow(
  month: string,
  timeZone: string,
): { from: number; to: number };

/** How many hours `day` has in `timeZone`: 24, or 23 and 25 at a change. */
export function dayLength(day: string, timeZone: string): number;

/**
 * Drop slots that are not a time, end a slot with no `end` after
 * `duration` minutes, remove duplicates by start, and sort by start.
 */
export function normalizeSlots(
  slots: ReadonlyArray<SlotInput> | null | undefined,
  duration?: number,
): Slot[];

/** Group sorted slots by the calendar day they start on in `timeZone`. */
export function groupSlotsByDay(
  slots: ReadonlyArray<Slot>,
  timeZone: string,
): Record<string, Slot[]>;

/** Cut windows of free time into bookable slots. */
export function slotsFromWindows(
  windows: ReadonlyArray<{ start: Instant; end: Instant }>,
  options?: { duration?: number; step?: number },
): Slot[];

/**
 * The text of each slot's time in `timeZone`. Slots that would read the
 * same (the hour the clocks go back) add the zone's short name.
 */
export function formatSlotTimes(
  slots: ReadonlyArray<Slot>,
  options: {
    locale?: string;
    timeZone: string;
    hourCycle?: "h11" | "h12" | "h23" | "h24";
  },
): string[];

/** A calendar day written for people, such as "Tue, Nov 11". */
export function formatDay(
  day: string,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string;

/** The first day after `after` that has a slot. */
export function nextAvailableDay(
  days: Record<string, ReadonlyArray<unknown>>,
  after: string,
): string | undefined;
