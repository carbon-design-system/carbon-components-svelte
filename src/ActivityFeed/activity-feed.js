// @ts-check
// The data model of an activity feed and the pure helpers on it: ordering,
// optimistic edits, reactions, and the grouping of items into rows. DOM-free.

import {
  getDateTimeFormatter,
  getRelativeTimeFormatter,
} from "../utils/intl-formatter-cache.js";
import { toTimestamp } from "../utils/relative-time.js";

/**
 * @typedef {object} ActivityUser
 * @property {string} id
 * @property {string} name
 * @property {string} [image]
 */

/**
 * @typedef {object} ActivityReaction
 * @property {string} emoji
 * @property {string[]} userIds
 */

/**
 * @typedef {object} ActivityItem
 * @property {string} id
 * @property {"comment" | "event"} kind - A `"comment"` is written by a person. An `"event"` is system activity, such as "changed status to Done".
 * @property {ActivityUser} author
 * @property {string | number | Date} createdAt
 * @property {string | number | Date} [editedAt]
 * @property {string} body - Plain text with `@[Name](id)` mentions, links and a Markdown subset. An event's body continues the author's name: "changed status to Done".
 * @property {ActivityReaction[]} [reactions]
 * @property {ActivityItem[]} [replies] - One level only. Comments only.
 * @property {string} [parentId] - Set on an item that is added as a reply.
 * @property {string} [clientId] - The id the item had before the server gave it one. Rows are keyed by it, so a posted comment keeps its element.
 * @property {"sending" | "failed"} [status] - Set by `createActivityFeed` while a comment is being sent, or when it could not be.
 */

/**
 * @typedef {object} ActivityRow
 * @property {"comment" | "events"} type
 * @property {string} key
 * @property {ActivityItem} item - The comment, or the first event of a group.
 * @property {ActivityItem[]} events - The grouped events (`[item]` for a comment is not set).
 * @property {string} [day] - Set on the first row of a day: `YYYY-MM-DD` in the feed's time zone.
 * @property {number} timestamp - When the row began.
 */

/**
 * The time of an item in epoch milliseconds.
 * @param {ActivityItem} item
 * @returns {number}
 */
export function itemTime(item) {
  const time = toTimestamp(item.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

/**
 * The key a row is rendered under. Stable across the temporary id of a
 * comment being sent and the id the server gives it.
 * @param {ActivityItem} item
 * @returns {string}
 */
export function itemKey(item) {
  return item.clientId ?? item.id;
}

/**
 * @param {ActivityItem} a
 * @param {ActivityItem} b
 */
function byTime(a, b) {
  const diff = itemTime(a) - itemTime(b);
  if (diff !== 0) return diff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Insert `item` into a list kept in time order, in place of an item with
 * the same id. Equal times keep the order of arrival.
 * @param {ActivityItem[]} list
 * @param {ActivityItem} item
 * @returns {ActivityItem[]}
 */
function insertSorted(list, item) {
  const without = list.filter((other) => other.id !== item.id);
  let at = without.length;
  while (at > 0 && byTime(without[at - 1], item) > 0) at--;
  without.splice(at, 0, item);
  return without;
}

/**
 * Where an item is: its parent comment, if it is a reply.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {string} id
 * @returns {{ item: ActivityItem; parent?: ActivityItem } | undefined}
 */
export function findItem(items, id) {
  for (const item of items) {
    if (item.id === id) return { item };
    for (const reply of item.replies ?? []) {
      if (reply.id === id) return { item: reply, parent: item };
    }
  }
  return undefined;
}

/**
 * Add an item in time order. An item with a `parentId` becomes the last
 * reply of that comment (a reply to a reply lands on the same comment:
 * threads are one level). An id already in the feed is replaced, so a
 * server echo of your own comment does not show twice.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {ActivityItem} item
 * @returns {ActivityItem[]}
 */
export function addItem(items, item) {
  if (item.parentId) {
    const target = findItem(items, item.parentId);
    const parentId = target?.parent?.id ?? target?.item.id;
    if (parentId) {
      return items.map((other) =>
        other.id === parentId
          ? {
              ...other,
              replies: insertSorted(other.replies ?? [], {
                ...item,
                parentId,
              }),
            }
          : other,
      );
    }
  }
  const existing = findItem(items, item.id);
  if (existing?.parent) {
    return items.map((other) =>
      other.id === existing.parent?.id
        ? { ...other, replies: insertSorted(other.replies ?? [], item) }
        : other,
    );
  }
  return insertSorted(/** @type {ActivityItem[]} */ (items), item);
}

/**
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {string} id
 * @param {(item: ActivityItem) => ActivityItem} change
 * @returns {ActivityItem[]}
 */
function updateItem(items, id, change) {
  return items.map((item) => {
    if (item.id === id) return change(item);
    if (item.replies?.some((reply) => reply.id === id)) {
      return {
        ...item,
        replies: item.replies.map((reply) =>
          reply.id === id ? change(reply) : reply,
        ),
      };
    }
    return item;
  });
}

/**
 * Replace the body of an item and mark it edited.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {string} id
 * @param {string} body
 * @param {string | number | Date} editedAt
 * @returns {ActivityItem[]}
 */
export function editItem(items, id, body, editedAt) {
  return updateItem(items, id, (item) => ({ ...item, body, editedAt }));
}

/**
 * Remove an item. Removing a comment removes its replies.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {string} id
 * @returns {ActivityItem[]}
 */
export function removeItem(items, id) {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.replies?.some((reply) => reply.id === id)
        ? { ...item, replies: item.replies.filter((reply) => reply.id !== id) }
        : item,
    );
}

/**
 * Add or remove a user's reaction. Emptied reactions are dropped, and a
 * reaction keeps its place while others are added after it.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {string} id
 * @param {string} emoji
 * @param {string} userId
 * @param {boolean} [on] - Force the state. Unset toggles.
 * @returns {ActivityItem[]}
 */
export function toggleReaction(items, id, emoji, userId, on) {
  return updateItem(items, id, (item) => {
    const reactions = item.reactions ?? [];
    const current = reactions.find((reaction) => reaction.emoji === emoji);
    const had = current?.userIds.includes(userId) ?? false;
    const want = on ?? !had;
    if (want === had) return item;
    if (!current) {
      return {
        ...item,
        reactions: [...reactions, { emoji, userIds: [userId] }],
      };
    }
    const userIds = want
      ? [...current.userIds, userId]
      : current.userIds.filter((other) => other !== userId);
    return {
      ...item,
      reactions: userIds.length
        ? reactions.map((reaction) =>
            reaction === current ? { emoji, userIds } : reaction,
          )
        : reactions.filter((reaction) => reaction !== current),
    };
  });
}

/**
 * Merge items that arrive from the server (a poll, a socket, an older page)
 * into the feed. Known ids are replaced, so an edit from elsewhere shows.
 * @param {ReadonlyArray<ActivityItem>} items
 * @param {ReadonlyArray<ActivityItem>} incoming
 * @returns {{ items: ActivityItem[]; added: ActivityItem[] }} `added` lists
 *   only the items the feed did not have.
 */
export function mergeItems(items, incoming) {
  let next = /** @type {ActivityItem[]} */ (items);
  /** @type {ActivityItem[]} */
  const added = [];
  for (const item of incoming) {
    if (!findItem(next, item.id)) added.push(item);
    next = addItem(next, item);
  }
  return { items: next, added };
}

/**
 * The calendar day of a time, as `YYYY-MM-DD` in a time zone.
 * @param {number} timestamp
 * @param {string} [timeZone] - An IANA zone. The runtime's when unset.
 * @returns {string}
 */
export function dayKey(timestamp, timeZone) {
  const parts = getDayFormatter(timeZone).formatToParts(timestamp);
  const get = (/** @type {string} */ type) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** @type {Map<string, Intl.DateTimeFormat>} */
const dayFormatters = new Map();

/** @param {string | undefined} timeZone */
function getDayFormatter(timeZone) {
  const key = timeZone ?? "";
  let formatter = dayFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dayFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Turn items into rows: every comment is a row, and consecutive events by
 * anyone that are close in time share one row. The first row of each day
 * carries the day, for a divider.
 * @param {ReadonlyArray<ActivityItem>} items - In time order.
 * @param {object} [options]
 * @param {string} [options.timeZone]
 * @param {number} [options.groupWindowMs] - Events further apart than this start a new group. Default 6 hours.
 * @param {boolean} [options.groupEvents] - Set to `false` for one row per event. Default `true`.
 * @returns {ActivityRow[]}
 */
export function buildRows(items, options = {}) {
  const {
    timeZone,
    groupWindowMs = 6 * 3_600_000,
    groupEvents = true,
  } = options;
  /** @type {ActivityRow[]} */
  const rows = [];
  let lastDay = "";
  /** @type {ActivityRow | undefined} */
  let group;
  let groupLast = 0;

  for (const item of items) {
    const timestamp = itemTime(item);
    const day = dayKey(timestamp, timeZone);
    const newDay = day !== lastDay;
    lastDay = day;

    if (item.kind === "event") {
      if (
        groupEvents &&
        group &&
        !newDay &&
        timestamp - groupLast <= groupWindowMs
      ) {
        group.events.push(item);
        groupLast = timestamp;
        continue;
      }
      group = {
        type: "events",
        key: itemKey(item),
        item,
        events: [item],
        timestamp,
        day: newDay ? day : undefined,
      };
      groupLast = timestamp;
      rows.push(group);
      continue;
    }

    group = undefined;
    rows.push({
      type: "comment",
      key: itemKey(item),
      item,
      events: [],
      timestamp,
      day: newDay ? day : undefined,
    });
  }
  return rows;
}

/**
 * The reactions of an item as the reader sees them: the order they were
 * first added, with the reader's own marked, and the names to show.
 * @param {ActivityItem} item
 * @param {string | undefined} userId - The reader.
 * @param {(id: string) => string} nameOf
 * @returns {{ emoji: string; count: number; mine: boolean; names: string[] }[]}
 */
export function summarizeReactions(item, userId, nameOf) {
  return (item.reactions ?? [])
    .filter((reaction) => reaction.userIds.length > 0)
    .map((reaction) => {
      const mine = userId !== undefined && reaction.userIds.includes(userId);
      return {
        emoji: reaction.emoji,
        count: reaction.userIds.length,
        mine,
        names: reaction.userIds.filter((id) => id !== userId).map(nameOf),
      };
    });
}

/**
 * Whether the last `[hidden, shown)` split of replies hides any.
 * @param {number} total
 * @param {number} limit
 * @returns {number} How many of the earliest replies a collapsed thread hides.
 */
export function hiddenReplyCount(total, limit) {
  // Hiding a single reply saves no room: the button is as tall as the reply.
  return total > limit + 1 ? total - limit : 0;
}

/**
 * The heading of a day divider: "Today" and "Yesterday" in the locale, and
 * the date after that.
 * @param {string} day - `YYYY-MM-DD`, as `dayKey` writes it.
 * @param {object} [options]
 * @param {number} [options.now] - The reference time. Fix it so the server and the browser agree.
 * @param {string} [options.locale]
 * @param {string} [options.timeZone]
 * @returns {string}
 */
export function dayLabel(day, options = {}) {
  const { now = Date.now(), locale, timeZone } = options;
  const [year, month, date] = day.split("-").map(Number);
  const at = Date.UTC(year, month - 1, date);
  const [ny, nm, nd] = dayKey(now, timeZone).split("-").map(Number);
  const offset = Math.round((at - Date.UTC(ny, nm - 1, nd)) / 86_400_000);
  if (offset === 0 || offset === -1) {
    const label = getRelativeTimeFormatter(locale, { numeric: "auto" }).format(
      offset,
      "day",
    );
    return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
  }
  return getDateTimeFormatter(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(at);
}
