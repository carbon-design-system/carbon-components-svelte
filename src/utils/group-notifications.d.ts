export type NotificationGroup<Item> = {
  key: "today" | "yesterday" | "previous";
  /** "Today" and "Yesterday" in `locale`, or "Previous". */
  label: string;
  items: Item[];
};

/**
 * Group notifications by how long ago they happened: today, yesterday, and
 * everything before. A timestamp in the future counts as today, and one that
 * does not parse as previous. Items keep their order within a group, and
 * empty groups are left out.
 */
export function groupNotificationsByRecency<
  Item extends { timestamp: Date | number | string },
>(
  items: ReadonlyArray<Item>,
  options?: {
    /** The current time. Defaults to `Date.now()`. */
    now?: Date | number;
    locale?: string;
    /** IANA time zone that decides where days start. Defaults to the runtime's. */
    timeZone?: string;
    labels?: { today?: string; yesterday?: string; previous?: string };
  },
): Array<NotificationGroup<Item>>;
