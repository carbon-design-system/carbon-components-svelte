export type TimelineStatus =
  "success" | "warning" | "error" | "info" | "pending";

export type TimelineGroupContext = {
  /** The reference instant, in milliseconds. */
  now: number;
  locale?: string;
  timeZone?: string;
};

export type TimelineRow<Item> = {
  key: string | number;
  item: Item;
  /** Position in the source `items`. */
  index: number;
  /** Milliseconds, or `NaN` for an event with no time. */
  time: number;
};

export type TimelineGroup<Item> = {
  key: string;
  /** The first dated row's time, or `NaN`. */
  time: number;
  /** `null` for rows before the first dated one. */
  label: string | null;
  rows: TimelineRow<Item>[];
};

/**
 * The calendar day of `time` in `timeZone`, as a day count. The difference
 * of two numbers is whole days, even across a daylight saving change.
 */
export function dayNumber(time: number, timeZone: string | undefined): number;

/**
 * The default group heading: "Today", "Yesterday" and "Tomorrow" in the
 * locale, then a short date, with the year when it is not this one.
 */
export function defaultGroupLabel(
  time: number,
  context: TimelineGroupContext,
): string;

/**
 * Order, window and group the events of a timeline. Events sort by time;
 * ties and events with no time keep their source order, and an event with no
 * time is the latest. `limit` keeps the latest events.
 */
export function buildTimeline<
  Item extends { id?: string | number; time?: Date | number | string },
>(
  items: ReadonlyArray<Item>,
  options?: {
    order?: "asc" | "desc";
    groupBy?: "none" | "day";
    limit?: number;
    expanded?: boolean;
    now?: number;
    locale?: string;
    timeZone?: string;
    groupLabel?: (time: number, context: TimelineGroupContext) => string;
  },
): {
  groups: TimelineGroup<Item>[];
  /** Events hidden now. */
  hidden: number;
  /** Events `limit` cuts off, whether or not `expanded` shows them. */
  earlier: number;
  total: number;
};

/** The words that stand for a marker; `""` for no status. */
export function defaultStatusText(status: TimelineStatus | undefined): string;

/**
 * Whether a relative time is worth showing beside an event's time: it has a
 * time, and is no older than `within` milliseconds.
 */
export function isWithinRelative(
  time: number,
  reference: number,
  within: number,
): boolean;
