// @ts-check

import { writable } from "svelte/store";

/**
 * @typedef {import("./history.d.ts").HistoryCommand} HistoryCommand
 * @typedef {import("./history.d.ts").HistoryOptions} HistoryOptions
 * @typedef {import("./history.d.ts").History} History
 *
 * One step on the timeline. `redo` is the command's `do`.
 * @typedef {{
 *   label: string | undefined;
 *   key: string | undefined;
 *   cost: number;
 *   at: number;
 *   undo: () => void;
 *   redo: () => void;
 * }} Entry
 */

/** @param {string | undefined} label */
const defaultUndone = (label) => (label ? `Undid ${label}` : "Undid");

/** @param {string | undefined} label */
const defaultRedone = (label) => (label ? `Redid ${label}` : "Redid");

/**
 * Wrap a store so callers can read it but not set it.
 * @template T
 * @param {import("svelte/store").Writable<T>} store
 * @returns {import("svelte/store").Readable<T>}
 */
const readOnly = (store) => ({ subscribe: store.subscribe });

/**
 * An undo and redo timeline. A step is a pair of functions, so the timeline
 * serves command-style edits (`push`, `run`) and state snapshots
 * (`snapshots`) alike, and one history can hold both. Pure and SSR-safe: it
 * touches no DOM, only `svelte/store`.
 *
 * Steps that share a `key` and arrive within `coalesceMs` of the last one
 * fold into a single step, so a drag or a burst of typing undoes at once. A
 * folded step keeps the first `undo` and the last `do`, which is correct
 * when each command sets an absolute value ("move to x") and wrong when it
 * applies a delta ("move by 4"). Wrap deltas in `begin()` and `commit()`,
 * which compose every command, instead.
 *
 * @param {HistoryOptions} [options]
 * @returns {History}
 */
export function createHistory(options = {}) {
  const limit = options.limit ?? 100;
  const maxCost = options.maxCost ?? Number.POSITIVE_INFINITY;
  const defaultWindow = options.coalesceMs ?? 500;
  const now = options.now ?? Date.now;
  const announce = options.announce;
  const undoneText = options.undoneText ?? defaultUndone;
  const redoneText = options.redoneText ?? defaultRedone;

  /** @type {Entry[]} */
  let done = [];
  /** @type {Entry[]} */
  let undone = [];
  /** @type {Array<{ label: string | undefined, entries: Entry[] }>} */
  const groups = [];
  /** @type {Entry | null} The step a keyed push may still fold into. */
  let open = null;
  let doneCost = 0;
  let applying = 0;

  const canUndo = writable(false);
  const canRedo = writable(false);
  /** @type {import("svelte/store").Writable<string | undefined>} */
  const undoLabel = writable(undefined);
  /** @type {import("svelte/store").Writable<string | undefined>} */
  const redoLabel = writable(undefined);

  function sync() {
    canUndo.set(done.length > 0);
    canRedo.set(undone.length > 0);
    undoLabel.set(done[done.length - 1]?.label);
    redoLabel.set(undone[undone.length - 1]?.label);
  }

  /** @param {() => void} fn */
  function apply(fn) {
    applying++;
    try {
      fn();
    } finally {
      applying--;
    }
  }

  /**
   * The step a new keyed command could fold into.
   * @param {string | undefined} key
   * @param {number} windowMs
   * @param {Entry[]} list
   * @returns {Entry | null}
   */
  function foldTarget(key, windowMs, list) {
    if (key === undefined || !open || open.key !== key) return null;
    if (list[list.length - 1] !== open) return null;
    return now() - open.at <= windowMs ? open : null;
  }

  /** @param {Entry[]} list */
  function trim(list) {
    let drop = Math.max(0, list.length - limit);
    let cost = doneCost;
    while (cost > maxCost && drop < list.length - 1) {
      cost -= list[drop].cost;
      drop++;
    }
    if (drop === 0) return;
    for (let i = 0; i < drop; i++) doneCost -= list[i].cost;
    list.splice(0, drop);
  }

  /**
   * @param {HistoryCommand} command
   * @returns {boolean}
   */
  function push(command) {
    if (applying) return false;
    const key = command.key;
    const windowMs = command.coalesceMs ?? defaultWindow;
    const list = groups.length ? groups[groups.length - 1].entries : done;
    const time = now();
    undone = [];

    const target = foldTarget(key, windowMs, list);
    if (target) {
      const cost = command.cost ?? 0;
      if (list === done) doneCost += Math.max(target.cost, cost) - target.cost;
      target.redo = command.do;
      target.label = command.label ?? target.label;
      target.cost = Math.max(target.cost, cost);
      target.at = time;
      sync();
      return true;
    }

    /** @type {Entry} */
    const entry = {
      label: command.label,
      key,
      cost: command.cost ?? 0,
      at: time,
      undo: command.undo,
      redo: command.do,
    };
    list.push(entry);
    open = key === undefined ? null : entry;
    if (list === done) {
      doneCost += entry.cost;
      trim(done);
    }
    sync();
    return true;
  }

  /**
   * @param {Entry[]} entries
   * @param {string | undefined} label
   * @returns {Entry}
   */
  function compose(entries, label) {
    if (entries.length === 1) {
      const [only] = entries;
      return { ...only, label: label ?? only.label, key: undefined };
    }
    return {
      label: label ?? entries[entries.length - 1].label,
      key: undefined,
      cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
      at: now(),
      undo() {
        for (let i = entries.length - 1; i >= 0; i--) entries[i].undo();
      },
      redo() {
        for (const entry of entries) entry.redo();
      },
    };
  }

  /**
   * Fold into the open step when `key` continues it, and keep the window
   * open. Returns whether it did.
   * @param {string | undefined} key
   * @param {number} [coalesceMs]
   * @returns {boolean}
   */
  function extend(key, coalesceMs) {
    const list = groups.length ? groups[groups.length - 1].entries : done;
    const target = foldTarget(key, coalesceMs ?? defaultWindow, list);
    if (!target) return false;
    target.at = now();
    return true;
  }

  /** @param {string} [label] */
  function begin(label) {
    open = null;
    groups.push({ label, entries: [] });
  }

  /** @param {string} [label] */
  function commit(label) {
    const group = groups.pop();
    open = null;
    if (!group || group.entries.length === 0) return false;
    const entry = compose(group.entries, label ?? group.label);
    if (groups.length) {
      groups[groups.length - 1].entries.push(entry);
    } else {
      done.push(entry);
      doneCost += entry.cost;
      trim(done);
    }
    sync();
    return true;
  }

  function cancel() {
    const group = groups.pop();
    open = null;
    if (!group) return false;
    apply(() => {
      for (let i = group.entries.length - 1; i >= 0; i--) {
        group.entries[i].undo();
      }
    });
    return true;
  }

  return {
    canUndo: readOnly(canUndo),
    canRedo: readOnly(canRedo),
    undoLabel: readOnly(undoLabel),
    redoLabel: readOnly(redoLabel),

    push,
    extend,
    begin,
    commit,
    cancel,

    run(command) {
      command.do();
      return push(command);
    },

    seal() {
      open = null;
    },

    transaction(label, fn) {
      begin(label);
      try {
        const result = fn();
        commit();
        return result;
      } catch (error) {
        cancel();
        throw error;
      }
    },

    undo() {
      if (groups.length || applying) return false;
      const entry = done[done.length - 1];
      if (!entry) return false;
      apply(entry.undo);
      done.pop();
      doneCost -= entry.cost;
      undone.push(entry);
      open = null;
      sync();
      announce?.(undoneText(entry.label));
      return true;
    },

    redo() {
      if (groups.length || applying) return false;
      const entry = undone[undone.length - 1];
      if (!entry) return false;
      apply(entry.redo);
      undone.pop();
      done.push(entry);
      doneCost += entry.cost;
      open = null;
      trim(done);
      sync();
      announce?.(redoneText(entry.label));
      return true;
    },

    clear() {
      done = [];
      undone = [];
      groups.length = 0;
      doneCost = 0;
      open = null;
      sync();
    },

    snapshots(config) {
      const { apply: set, capture, cost } = config;
      const equals = config.equals ?? Object.is;
      let current = config.initial;

      return {
        get current() {
          return current;
        },

        record(next, meta = {}) {
          if (equals(next, current)) return false;
          const before = current;
          current = next;
          return push({
            ...meta,
            cost: meta.cost ?? cost?.(next),
            undo() {
              current = before;
              set(before);
            },
            do() {
              current = next;
              set(next);
            },
          });
        },

        checkpoint(meta = {}) {
          if (!capture) {
            throw new TypeError(
              "snapshots() needs `capture` to use checkpoint()",
            );
          }
          if (applying) return false;
          if (extend(meta.key, meta.coalesceMs)) return true;
          const prior = capture();
          /** @type {any} */
          let after;
          return push({
            ...meta,
            cost: meta.cost ?? cost?.(prior),
            undo() {
              after = capture();
              set(prior);
            },
            do() {
              set(after);
            },
          });
        },

        reset(state) {
          current = state;
        },
      };
    },
  };
}
