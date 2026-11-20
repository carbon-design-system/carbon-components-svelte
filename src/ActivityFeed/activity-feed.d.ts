export type ActivityUser = {
  id: string;
  name: string;
  image?: string;
};

export type ActivityReaction = {
  emoji: string;
  userIds: string[];
};

export type ActivityItem = {
  id: string;
  /** A `"comment"` is written by a person. An `"event"` is system activity. */
  kind: "comment" | "event";
  author: ActivityUser;
  createdAt: string | number | Date;
  editedAt?: string | number | Date;
  /** Plain text with `@[Name](id)` mentions, links and a Markdown subset. */
  body: string;
  reactions?: ActivityReaction[];
  /** One level only. Comments only. */
  replies?: ActivityItem[];
  /** Set on an item that is added as a reply. */
  parentId?: string;
  /** The id the item had before the server gave it one. */
  clientId?: string;
  status?: "sending" | "failed";
};

export type ActivityRow = {
  type: "comment" | "events";
  key: string;
  item: ActivityItem;
  events: ActivityItem[];
  /** Set on the first row of a day: `YYYY-MM-DD` in the feed's time zone. */
  day?: string;
  timestamp: number;
};

export function itemTime(item: ActivityItem): number;

export function itemKey(item: ActivityItem): string;

export function findItem(
  items: ReadonlyArray<ActivityItem>,
  id: string,
): { item: ActivityItem; parent?: ActivityItem } | undefined;

export function addItem(
  items: ReadonlyArray<ActivityItem>,
  item: ActivityItem,
): ActivityItem[];

export function editItem(
  items: ReadonlyArray<ActivityItem>,
  id: string,
  body: string,
  editedAt: string | number | Date,
): ActivityItem[];

export function removeItem(
  items: ReadonlyArray<ActivityItem>,
  id: string,
): ActivityItem[];

export function toggleReaction(
  items: ReadonlyArray<ActivityItem>,
  id: string,
  emoji: string,
  userId: string,
  on?: boolean,
): ActivityItem[];

export function mergeItems(
  items: ReadonlyArray<ActivityItem>,
  incoming: ReadonlyArray<ActivityItem>,
): { items: ActivityItem[]; added: ActivityItem[] };

export function dayKey(timestamp: number, timeZone?: string): string;

export function buildRows(
  items: ReadonlyArray<ActivityItem>,
  options?: {
    timeZone?: string;
    groupWindowMs?: number;
    groupEvents?: boolean;
  },
): ActivityRow[];

export function summarizeReactions(
  item: ActivityItem,
  userId: string | undefined,
  nameOf: (id: string) => string,
): { emoji: string; count: number; mine: boolean; names: string[] }[];

export function hiddenReplyCount(total: number, limit: number): number;

/** The heading of a day divider: "Today", "Yesterday", or the date. */
export function dayLabel(
  day: string,
  options?: { now?: number; locale?: string; timeZone?: string },
): string;
