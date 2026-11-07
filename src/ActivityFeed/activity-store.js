// @ts-check
// Optimistic state for an activity feed. The committed items are what the
// server has confirmed; every request in flight is an operation applied on
// top. A request that fails is dropped from the list, which rolls back that
// change and nothing else, and a rollback event is recorded. This is how a
// failed edit cannot undo the successful reaction made after it.

import { writable } from "svelte/store";
import {
  addItem,
  editItem,
  findItem,
  mergeItems,
  removeItem,
  toggleReaction,
} from "./activity-feed.js";

/**
 * @typedef {import("./activity-feed.js").ActivityItem} ActivityItem
 * @typedef {import("./activity-feed.js").ActivityUser} ActivityUser
 */

/**
 * @typedef {object} ActivityRollback
 * @property {number} id - Identifies the event, for `dismiss`.
 * @property {"edit" | "delete" | "react" | "older"} op
 * @property {string} [itemId]
 * @property {unknown} error
 */

/**
 * @typedef {object} ActivityFeedState
 * @property {ActivityItem[]} items - Committed items with every pending operation applied.
 * @property {boolean} hasOlder
 * @property {boolean} loadingOlder
 * @property {ActivityRollback[]} errors - Changes that were rolled back, oldest first.
 * @property {ReadonlySet<string>} pending - Ids of items with a request in flight.
 */

/**
 * @typedef {{ kind: "add"; opId: number; item: ActivityItem }
 *   | { kind: "edit"; opId: number; id: string; body: string; editedAt: number }
 *   | { kind: "delete"; opId: number; id: string }
 *   | { kind: "react"; opId: number; id: string; emoji: string; userId: string; on: boolean }} Operation
 */

/**
 * @param {ActivityItem[]} items
 * @param {Operation} op
 * @returns {ActivityItem[]}
 */
function apply(items, op) {
  switch (op.kind) {
    case "add":
      return addItem(items, op.item);
    case "edit":
      return editItem(items, op.id, op.body, op.editedAt);
    case "delete":
      return removeItem(items, op.id);
    case "react":
      return toggleReaction(items, op.id, op.emoji, op.userId, op.on);
  }
}

/**
 * Create the state of an activity feed.
 *
 * Every handler may return a promise. A rejection rolls the change back.
 *
 * @param {object} options
 * @param {ReadonlyArray<ActivityItem>} [options.items]
 * @param {ActivityUser} options.user - The person using the feed.
 * @param {boolean} [options.hasOlder]
 * @param {(draft: { body: string; parentId?: string; clientId: string }) => ActivityItem | Promise<ActivityItem>} [options.onAdd]
 *   Return the saved item. Its id replaces the temporary one.
 * @param {(id: string, body: string) => unknown} [options.onEdit]
 * @param {(id: string) => unknown} [options.onDelete]
 * @param {(id: string, emoji: string, on: boolean) => unknown} [options.onReact]
 * @param {() => ActivityItem[] | Promise<ActivityItem[] | { items: ActivityItem[]; hasOlder?: boolean }> | { items: ActivityItem[]; hasOlder?: boolean }} [options.onLoadOlder]
 * @param {() => number} [options.now]
 */
export function createActivityFeed(options) {
  const { user, onAdd, onEdit, onDelete, onReact, onLoadOlder } = options;
  const now = options.now ?? Date.now;

  let committed = /** @type {ActivityItem[]} */ ([...(options.items ?? [])]);
  /** @type {Operation[]} */
  let ops = [];
  /** @type {Map<string, ActivityItem>} */
  const failed = new Map();
  let nextId = 1;
  let nextTemp = 1;
  /** @type {ActivityRollback[]} */
  let errors = [];
  let hasOlder = options.hasOlder ?? false;
  let loadingOlder = false;

  const store = writable(snapshot());

  /** @returns {ActivityFeedState} */
  function snapshot() {
    let items = committed;
    for (const op of ops) items = apply(items, op);
    for (const item of failed.values()) items = addItem(items, item);
    return {
      items,
      hasOlder,
      loadingOlder,
      errors,
      pending: new Set(
        ops.map((op) => (op.kind === "add" ? op.item.id : op.id)),
      ),
    };
  }

  function publish() {
    store.set(snapshot());
  }

  /**
   * @param {Operation} op
   * @param {unknown} error
   * @param {ActivityRollback["op"]} kind
   */
  function rollBack(op, error, kind) {
    ops = ops.filter((other) => other.opId !== op.opId);
    errors = [
      ...errors,
      {
        id: nextId++,
        op: kind,
        itemId: op.kind === "add" ? op.item.id : op.id,
        error,
      },
    ];
  }

  /**
   * Run `op` optimistically against `request`.
   * @param {Operation} op
   * @param {() => unknown} request
   * @param {(result: unknown) => void} [commit] - Applies the confirmed change to the committed items.
   * @returns {Promise<boolean>} Whether the server accepted it.
   */
  async function run(op, request, commit) {
    ops = [...ops, op];
    publish();
    try {
      const result = await request();
      ops = ops.filter((other) => other.opId !== op.opId);
      if (commit) commit(result);
      else committed = apply(committed, op);
      publish();
      return true;
    } catch (error) {
      if (op.kind === "add")
        ops = ops.filter((other) => other.opId !== op.opId);
      else rollBack(op, error, op.kind);
      publish();
      throw error;
    }
  }

  /** @param {Promise<boolean>} promise */
  function settle(promise) {
    return promise.catch(() => false);
  }

  /**
   * Send a drafted item: the first time, or again after it failed.
   * @param {ActivityItem} draft
   * @returns {Promise<boolean>}
   */
  function send(draft) {
    const clientId = draft.clientId ?? draft.id;
    failed.delete(draft.id);
    /** @type {Operation} */
    const op = {
      kind: "add",
      opId: nextId++,
      item: { ...draft, status: "sending" },
    };
    return settle(
      run(
        op,
        () =>
          onAdd?.({ body: draft.body, parentId: draft.parentId, clientId }) ?? {
            ...draft,
            status: undefined,
          },
        (saved) => {
          const item = /** @type {ActivityItem} */ (saved);
          committed = addItem(committed, {
            ...item,
            clientId,
            parentId: item.parentId ?? draft.parentId,
            status: undefined,
          });
        },
      ),
    ).then((ok) => {
      if (!ok) {
        failed.set(draft.id, { ...draft, status: "failed" });
        publish();
      }
      return ok;
    });
  }

  /**
   * Post a comment, or a reply when `parentId` is set. It shows at once.
   * One that fails stays with `status: "failed"`, so its text is not lost:
   * `retry` or `discard` it.
   * @param {string} body
   * @param {string} [parentId]
   * @returns {Promise<boolean>}
   */
  function add(body, parentId) {
    const clientId = `pending-${nextTemp++}`;
    return send({
      id: clientId,
      clientId,
      kind: "comment",
      author: user,
      createdAt: now(),
      body,
      reactions: [],
      replies: [],
      parentId,
      status: "sending",
    });
  }

  /**
   * Send a comment that failed again.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  function retry(id) {
    const draft = failed.get(id);
    return draft ? send(draft) : Promise.resolve(false);
  }

  /**
   * Forget a comment that failed.
   * @param {string} id
   */
  function discard(id) {
    failed.delete(id);
    publish();
  }

  /**
   * @param {string} id
   * @param {string} body
   * @returns {Promise<boolean>}
   */
  function edit(id, body) {
    return settle(
      run({ kind: "edit", opId: nextId++, id, body, editedAt: now() }, () =>
        onEdit?.(id, body),
      ),
    );
  }

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  function remove(id) {
    return settle(
      run({ kind: "delete", opId: nextId++, id }, () => onDelete?.(id)),
    );
  }

  /**
   * Toggle the user's reaction.
   * @param {string} id
   * @param {string} emoji
   * @returns {Promise<boolean>}
   */
  function react(id, emoji) {
    const reaction = findItem(snapshot().items, id)?.item.reactions?.find(
      (other) => other.emoji === emoji,
    );
    const on = !reaction?.userIds.includes(user.id);
    return settle(
      run(
        { kind: "react", opId: nextId++, id, emoji, userId: user.id, on },
        () => onReact?.(id, emoji, on),
      ),
    );
  }

  /**
   * Items that arrived from elsewhere: a poll, a socket.
   * @param {ReadonlyArray<ActivityItem>} incoming
   * @returns {ActivityItem[]} The ones the feed did not have.
   */
  function receive(incoming) {
    const merged = mergeItems(committed, incoming);
    committed = merged.items;
    publish();
    return merged.added;
  }

  /**
   * Fetch the next page of older items and put it before the rest.
   * @returns {Promise<boolean>}
   */
  async function loadOlder() {
    if (!onLoadOlder || loadingOlder || !hasOlder) return false;
    loadingOlder = true;
    publish();
    try {
      const result = await onLoadOlder();
      const page = Array.isArray(result) ? result : result.items;
      if (!Array.isArray(result) && result.hasOlder !== undefined) {
        hasOlder = result.hasOlder;
      } else if (page.length === 0) {
        hasOlder = false;
      }
      committed = mergeItems(committed, page).items;
      return true;
    } catch (error) {
      errors = [...errors, { id: nextId++, op: "older", error }];
      return false;
    } finally {
      loadingOlder = false;
      publish();
    }
  }

  /**
   * Drop a rollback notice.
   * @param {number} id
   */
  function dismiss(id) {
    errors = errors.filter((error) => error.id !== id);
    publish();
  }

  /**
   * Replace the committed items, as when switching to another thread.
   * @param {ReadonlyArray<ActivityItem>} items
   * @param {boolean} [older]
   */
  function set(items, older = false) {
    committed = [...items];
    ops = [];
    failed.clear();
    errors = [];
    hasOlder = older;
    publish();
  }

  return {
    subscribe: store.subscribe,
    add,
    send,
    retry,
    discard,
    edit,
    remove,
    react,
    receive,
    loadOlder,
    dismiss,
    set,
  };
}
