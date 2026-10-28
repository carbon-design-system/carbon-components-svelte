import type { CivilDay, Zone } from "./scheduler-time.js";

/** The fields of an event the layout reads. */
export interface EventLike {
  id?: string | number;
  start?: Date | number;
  end?: Date | number;
  allDay?: boolean;
  title?: string;
  color?: string;
  readonly?: boolean;
  [key: string]: unknown;
}

/** An event read once into the numbers the layout needs. */
export interface EventRecord {
  event: EventLike;
  id: string;
  order: number;
  startMs: number;
  endMs: number;
  allDay: boolean;
  /** Lives in the all-day row: an all-day event, or a timed one lasting 24 hours or more. */
  banner: boolean;
  startDay: CivilDay;
  /** The last day the event touches, inclusive. */
  lastDay: CivilDay;
  startMinute: number;
  /** 1440 when the event ends at midnight. */
  endMinute: number;
}

/** One day's slice of a timed event, with the place the overlap layout gave it. */
export interface Segment {
  record: EventRecord;
  key: string;
  day: CivilDay;
  startMin: number;
  endMin: number;
  visualEnd: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  column: number;
  columns: number;
  span: number;
}

/** An event across days: an all-day bar, or any event in a month week. */
export interface Bar {
  record: EventRecord;
  key: string;
  start: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/** Reads events into records, skipping any with an invalid `start`. `end` is exclusive. */
export function readEvents(
  events: ReadonlyArray<EventLike>,
  zone: Zone,
): EventRecord[];

/** Splits the timed events into one segment per day they touch. */
export function splitByDay(
  records: ReadonlyArray<EventRecord>,
  firstDay: CivilDay,
  lastDay: CivilDay,
  minMinutes: number,
): Segment[][];

/** Lays out one day's overlapping segments side by side, in place. */
export function layoutDay(segments: Segment[]): Segment[];

/** Packs whole-day events into lanes. */
export function packBars(
  records: ReadonlyArray<EventRecord>,
  firstDay: CivilDay,
  lastDay: CivilDay,
  bannersOnly?: boolean,
): { bars: Bar[]; lanes: number };

/** How many bars each day hides when only `limit` lanes show. */
export function hiddenPerDay(
  bars: ReadonlyArray<Bar>,
  days: number,
  limit: number,
): number[];

export function snapMinute(minute: number, step: number): number;

/** Where an event lands when moved, keeping its elapsed duration. */
export function moveRecord(
  record: EventRecord,
  zone: Zone,
  dayDelta: number,
  minuteDelta: number,
): { startMs: number; endMs: number };

/** Where an event ends after its bottom edge moves to a wall-clock time. */
export function resizeRecord(
  record: EventRecord,
  zone: Zone,
  day: CivilDay,
  minute: number,
  minMinutes: number,
): { startMs: number; endMs: number };
