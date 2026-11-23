import type { Readable } from "svelte/store";
import type { ActivityItem, ActivityUser } from "./activity-feed.js";

export type ActivityRollback = {
  /** Identifies the event, for `dismiss`. */
  id: number;
  op: "edit" | "delete" | "react" | "older";
  itemId?: string;
  error: unknown;
};

export type ActivityFeedState = {
  /** Committed items with every pending operation applied. */
  items: ActivityItem[];
  hasOlder: boolean;
  loadingOlder: boolean;
  /** Changes that were rolled back, oldest first. */
  errors: ActivityRollback[];
  /** Ids of items with a request in flight. */
  pending: ReadonlySet<string>;
};

type OlderPage = ActivityItem[] | { items: ActivityItem[]; hasOlder?: boolean };

export type ActivityFeedOptions = {
  items?: ReadonlyArray<ActivityItem>;
  /** The person using the feed. */
  user: ActivityUser;
  hasOlder?: boolean;
  /** Return the saved item. Its id replaces the temporary one. */
  onAdd?: (draft: {
    body: string;
    parentId?: string;
    clientId: string;
  }) => ActivityItem | Promise<ActivityItem>;
  onEdit?: (id: string, body: string) => unknown;
  onDelete?: (id: string) => unknown;
  onReact?: (id: string, emoji: string, on: boolean) => unknown;
  onLoadOlder?: () => OlderPage | Promise<OlderPage>;
  now?: () => number;
};

export type ActivityFeedStore = Readable<ActivityFeedState> & {
  /** Post a comment, or a reply when `parentId` is set. */
  add(body: string, parentId?: string): Promise<boolean>;
  send(draft: ActivityItem): Promise<boolean>;
  retry(id: string): Promise<boolean>;
  discard(id: string): void;
  edit(id: string, body: string): Promise<boolean>;
  remove(id: string): Promise<boolean>;
  /** Toggle the user's reaction. */
  react(id: string, emoji: string): Promise<boolean>;
  /** Items that arrived from elsewhere. Returns the ones that are new. */
  receive(incoming: ReadonlyArray<ActivityItem>): ActivityItem[];
  loadOlder(): Promise<boolean>;
  dismiss(id: number): void;
  set(items: ReadonlyArray<ActivityItem>, hasOlder?: boolean): void;
};

/**
 * Optimistic state for an activity feed. A request that rejects rolls back
 * that change alone, and records it in `errors`.
 */
export function createActivityFeed(
  options: ActivityFeedOptions,
): ActivityFeedStore;
