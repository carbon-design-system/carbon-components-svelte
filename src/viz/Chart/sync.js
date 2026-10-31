// @ts-check
// Shared state between charts that declare the same `syncId`: hover for
// one crosshair across a dashboard, and when asked, the zoom range, the
// brush, and the selection, so a click in one chart reaches the others.

/**
 * @typedef {import("./sync.d.ts").SyncMessage} SyncMessage
 * @typedef {(message: SyncMessage, source: object) => void} SyncListener
 */

/** @type {Map<string, Set<SyncListener>>} */
const channels = new Map();

/**
 * Join the channel `id`. `listener` hears what the other members publish:
 * a hover x, or `null` when it clears, with whether the member's tooltip is
 * shown; a zoom range; a brush range; a selection. `publish` tells them
 * about this member. A member never hears itself.
 *
 * @param {string} id
 * @param {(message: SyncMessage) => void} listener
 * @returns {{ publish: (message: SyncMessage) => void, leave: () => void }}
 */
export function joinSync(id, listener) {
  const source = {};
  /** @type {SyncListener} */
  const entry = (message, from) => {
    if (from !== source) listener(message);
  };
  let members = channels.get(id);
  if (!members) {
    members = new Set();
    channels.set(id, members);
  }
  members.add(entry);

  return {
    publish(message) {
      for (const member of channels.get(id) ?? []) member(message, source);
    },
    leave() {
      const current = channels.get(id);
      current?.delete(entry);
      if (current?.size === 0) channels.delete(id);
    },
  };
}
