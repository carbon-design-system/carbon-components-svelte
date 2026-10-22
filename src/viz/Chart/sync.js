// @ts-check
// Shared hover between charts that declare the same `syncId`, so a dashboard
// shows one crosshair across all of them.

/** @typedef {(x: number | null, source: object) => void} SyncListener */

/** @type {Map<string, Set<SyncListener>>} */
const channels = new Map();

/**
 * Join the channel `id`. `listener` hears the data-space x published by the
 * other members, or `null` when their hover clears. `publish` tells them about
 * this member's hover. A member never hears itself.
 *
 * @param {string} id
 * @param {(x: number | null) => void} listener
 * @returns {{ publish: (x: number | null) => void, leave: () => void }}
 */
export function joinSync(id, listener) {
  const source = {};
  /** @type {SyncListener} */
  const entry = (x, from) => {
    if (from !== source) listener(x);
  };
  let members = channels.get(id);
  if (!members) {
    members = new Set();
    channels.set(id, members);
  }
  members.add(entry);

  return {
    publish(x) {
      for (const member of channels.get(id) ?? []) member(x, source);
    },
    leave() {
      const current = channels.get(id);
      current?.delete(entry);
      if (current?.size === 0) channels.delete(id);
    },
  };
}
