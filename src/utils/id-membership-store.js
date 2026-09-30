// @ts-check

/**
 * A set of ids whose subscribers listen to one id each. `select(id)` returns
 * a readable store of whether `id` is a member, notified only when that id
 * is added or removed. Replacing the set costs
 * O(min(subscribed ids, previous + next members)), so a list where every row
 * subscribes to its own id is not notified row by row when one id changes.
 *
 * @template {string | number} Id
 * @param {Iterable<Id>} [initial]
 */
export function createIdMembershipStore(initial = []) {
  /** @type {Set<Id>} */
  let members = new Set(initial);

  /** @type {Map<Id, Set<(value: boolean) => void>>} */
  const subscribers = new Map();

  /**
   * @param {Id} id
   * @param {boolean} value
   */
  function notify(id, value) {
    const callbacks = subscribers.get(id);
    if (!callbacks) return;
    // Copy: a callback may unsubscribe (or subscribe) while iterating.
    for (const callback of [...callbacks]) callback(value);
  }

  return {
    /**
     * Whether `id` is currently a member.
     * @param {Id} id
     * @returns {boolean}
     */
    has(id) {
      return members.has(id);
    },

    /**
     * Replace the members. The ids are copied, so callers may keep mutating
     * the iterable they pass.
     * @param {Iterable<Id>} ids
     */
    set(ids) {
      const previous = members;
      const next = new Set(ids);
      members = next;
      if (subscribers.size === 0) return;

      if (subscribers.size < previous.size + next.size) {
        for (const id of [...subscribers.keys()]) {
          const isMember = next.has(id);
          if (previous.has(id) !== isMember) notify(id, isMember);
        }
        return;
      }
      for (const id of previous) {
        if (!next.has(id)) notify(id, false);
      }
      for (const id of next) {
        if (!previous.has(id)) notify(id, true);
      }
    },

    /**
     * A readable store of whether `id` is a member.
     * @param {Id} id
     * @returns {import("svelte/store").Readable<boolean>}
     */
    select(id) {
      return {
        subscribe(callback) {
          let callbacks = subscribers.get(id);
          if (!callbacks) {
            callbacks = new Set();
            subscribers.set(id, callbacks);
          }
          // Wrap so two subscriptions with the same callback stay distinct.
          /** @param {boolean} value */
          const listener = (value) => callback(value);
          callbacks.add(listener);
          callback(members.has(id));
          return () => {
            const current = subscribers.get(id);
            if (!current) return;
            current.delete(listener);
            if (current.size === 0) subscribers.delete(id);
          };
        },
      };
    },
  };
}
