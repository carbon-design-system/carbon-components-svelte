// @ts-check
import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";
import { safeBrowserStorage } from "./storage.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * What a checklist keeps for a user: the tasks they checked or skipped, and
 * where the checklist stands. The tasks the app detects are not in it; the
 * app owns those through `task.completed`.
 *
 * @typedef {Object} ChecklistSnapshot
 * @property {string[]} done Ids of the tasks the user checked.
 * @property {string[]} skipped Ids of the optional tasks the user skipped.
 * @property {boolean} minimized `true` while a floating checklist is a launcher.
 * @property {boolean} dismissed `true` once the user closed the checklist.
 * @property {boolean} celebrated `true` once the "All set" state was shown.
 */

/**
 * Where a checklist store keeps its snapshot. `read` and `write` may be
 * asynchronous, as for progress synced with a server. `subscribe` reports
 * changes made elsewhere (another tab) and returns a function that stops
 * listening.
 *
 * @typedef {Object} ChecklistStorage
 * @property {() => ChecklistSnapshot | Promise<ChecklistSnapshot>} read
 * @property {(snapshot: ChecklistSnapshot) => void | Promise<void>} write
 * @property {(callback: (snapshot: ChecklistSnapshot) => void) => () => void} [subscribe]
 */

/**
 * @typedef {Object} ChecklistStoreState
 * @property {boolean} ready `true` once the user's progress is known: from
 *   `initial`, or after the storage was read.
 * @property {"hide" | "show"} pending What a checklist renders while `ready`
 *   is `false`.
 * @property {ReadonlySet<string>} done
 * @property {ReadonlySet<string>} skipped
 * @property {boolean} minimized
 * @property {boolean} dismissed
 * @property {boolean} celebrated
 */

/**
 * @typedef {Object} ChecklistStoreOptions
 * @property {ChecklistStorage} [storage] Defaults to `localChecklistStorage()`.
 * @property {Partial<ChecklistSnapshot>} [initial] Progress the server
 *   already knows, such as read from a cookie. The store is `ready` from the
 *   first render, so the server and the first client paint agree.
 * @property {"hide" | "show"} [pending] What a checklist renders until the
 *   stored progress is known, on the server and for the first client paint.
 *   `"hide"` (default) renders nothing, so a user who dismissed it never sees
 *   it flash. `"show"` renders the tasks unchecked.
 * @property {(error: unknown) => void} [onError] Called when a read or a write
 *   fails. The progress still holds for the session.
 */

/**
 * @typedef {Object} ChecklistStore
 * @property {import("svelte/store").Readable<ChecklistStoreState>["subscribe"]} subscribe
 * @property {(id: string) => void} check
 * @property {(id: string) => void} uncheck
 * @property {(id: string) => void} skip
 * @property {(id: string) => void} unskip
 * @property {() => void} minimize
 * @property {() => void} expand
 * @property {() => void} dismiss
 * @property {() => void} restore
 * @property {() => void} celebrate
 * @property {() => void} reset
 * @property {() => () => void} connect
 */

/** @param {unknown} value */
function toIds(value) {
  return Array.isArray(value)
    ? value.filter((id) => typeof id === "string")
    : [];
}

/**
 * Any value read from storage or a cookie becomes a usable snapshot.
 *
 * @param {unknown} value
 * @returns {ChecklistSnapshot}
 */
export function toChecklistSnapshot(value) {
  const raw =
    value && typeof value === "object" ? /** @type {any} */ (value) : {};
  return {
    done: toIds(raw.done),
    skipped: toIds(raw.skipped),
    minimized: raw.minimized === true,
    dismissed: raw.dismissed === true,
    celebrated: raw.celebrated === true,
  };
}

/**
 * @param {ReadonlySet<string>} a
 * @param {ReadonlySet<string>} b
 */
function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

const CHANGE_EVENT = "carbon:checklist-storage";

/**
 * Keep a checklist's progress in `localStorage` (or `sessionStorage`) as JSON
 * under `key`. A write also tells other stores on the page that share the key,
 * and the `storage` event tells those in other tabs. With storage off or no
 * `window`, reads are empty and writes do nothing.
 *
 * @param {string} [key]
 * @param {"localStorage" | "sessionStorage"} [type]
 * @returns {ChecklistStorage}
 */
export function localChecklistStorage(
  key = "carbon:onboarding",
  type = "localStorage",
) {
  const storage = safeBrowserStorage(type);

  function read() {
    const raw = storage.getItem(key);
    if (raw === null) return toChecklistSnapshot(undefined);
    try {
      return toChecklistSnapshot(JSON.parse(raw));
    } catch {
      return toChecklistSnapshot(undefined);
    }
  }

  return {
    read,
    write(snapshot) {
      storage.setItem(key, JSON.stringify(snapshot), (error) => {
        throw error;
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
      }
    },
    subscribe(callback) {
      const stopStorage = addPooledListener("storage", (event) => {
        const { key: changed, storageArea } = /** @type {StorageEvent} */ (
          event
        );
        if (storageArea && storageArea !== window[type]) return;
        // A null key means another document called clear().
        if (changed === null || changed === key) callback(read());
      });
      const stopLocal = addPooledListener(CHANGE_EVENT, (event) => {
        if (/** @type {CustomEvent} */ (event).detail === key) callback(read());
      });
      return () => {
        stopStorage();
        stopLocal();
      };
    },
  };
}

/**
 * Read a checklist's progress from a cookie header, as a server does before
 * it renders. Pass the result to `createChecklistStore({ initial })`.
 *
 * @param {string | null | undefined} cookieHeader
 * @param {string} [name]
 * @returns {ChecklistSnapshot | undefined} `undefined` when the cookie is
 *   missing or unreadable, so a new visitor stays `pending`.
 */
export function parseChecklistCookie(cookieHeader, name = "carbon-onboarding") {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return toChecklistSnapshot(
        JSON.parse(decodeURIComponent(part.slice(separator + 1))),
      );
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Keep a checklist's progress in a cookie, so the server can render it as the
 * user left it: nothing flashes and the page does not shift. Read it on the
 * server with `parseChecklistCookie`. The cookie is first-party and readable
 * by script, so keep only task ids in it.
 *
 * @param {{ name?: string, maxAge?: number, path?: string }} [options]
 * @returns {ChecklistStorage}
 */
export function cookieChecklistStorage(options = {}) {
  const { name = "carbon-onboarding", maxAge = 31536000, path = "/" } = options;
  return {
    read() {
      const snapshot =
        typeof document === "undefined"
          ? undefined
          : parseChecklistCookie(document.cookie, name);
      return snapshot ?? toChecklistSnapshot(undefined);
    },
    write(snapshot) {
      if (typeof document === "undefined") return;
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(JSON.stringify(snapshot))}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax${secure}`;
    },
  };
}

/**
 * Remember what a user did in a getting-started checklist: the tasks they
 * checked or skipped, whether they minimized or dismissed it, and whether
 * they saw "All set".
 *
 * The store never reads its storage while it is created, so the server and
 * the first client render agree. A checklist calls `connect()` in `onMount`,
 * which reads the storage once and keeps listening for other tabs. Until
 * then it follows `pending`. Create the store inside a component, not at
 * module scope, so server-rendered requests don't share one.
 *
 * @param {ChecklistStoreOptions} [options]
 * @returns {ChecklistStore}
 */
export function createChecklistStore(options = {}) {
  const {
    storage = localChecklistStorage(),
    initial,
    pending = "hide",
    onError,
  } = options;

  const start = toChecklistSnapshot(initial);
  /** @type {ReadonlySet<string>} */
  let done = new Set(start.done);
  /** @type {ReadonlySet<string>} */
  let skipped = new Set(start.skipped);
  let minimized = start.minimized;
  let dismissed = start.dismissed;
  let celebrated = start.celebrated;
  let ready = initial !== undefined;
  let refs = 0;
  let loaded = false;
  let resets = 0;
  /** @type {undefined | (() => void)} */
  let stop;

  const state = writable(snapshot());

  /** @returns {ChecklistStoreState} */
  function snapshot() {
    return { ready, pending, done, skipped, minimized, dismissed, celebrated };
  }

  /** @returns {ChecklistSnapshot} */
  function persisted() {
    return {
      done: [...done],
      skipped: [...skipped],
      minimized,
      dismissed,
      celebrated,
    };
  }

  /**
   * @param {ChecklistSnapshot} next
   * @param {boolean} nextReady
   * @returns {boolean} `true` when something changed.
   */
  function commit(next, nextReady) {
    const nextDone = sameSet(done, new Set(next.done))
      ? done
      : new Set(next.done);
    const nextSkipped = sameSet(skipped, new Set(next.skipped))
      ? skipped
      : new Set(next.skipped);
    if (
      nextReady === ready &&
      nextDone === done &&
      nextSkipped === skipped &&
      next.minimized === minimized &&
      next.dismissed === dismissed &&
      next.celebrated === celebrated
    ) {
      return false;
    }
    done = nextDone;
    skipped = nextSkipped;
    minimized = next.minimized;
    dismissed = next.dismissed;
    celebrated = next.celebrated;
    ready = nextReady;
    state.set(snapshot());
    return true;
  }

  /** @param {unknown} error */
  function fail(error) {
    if (onError) onError(error);
  }

  function persist() {
    try {
      const result = storage.write(persisted());
      if (result && typeof result.then === "function") result.then(null, fail);
    } catch (error) {
      fail(error);
    }
  }

  /**
   * Change the snapshot and save it. A change that changes nothing is not
   * saved.
   *
   * @param {Partial<ChecklistSnapshot>} change
   */
  function update(change) {
    if (commit({ ...persisted(), ...change }, ready)) persist();
  }

  /** @param {ChecklistSnapshot} next */
  function receive(next) {
    commit(next, true);
  }

  function load() {
    const started = resets;
    /** @param {ChecklistSnapshot} read */
    function apply(read) {
      // A reset made while an async read ran wins over it. The first read adds
      // to what the server and the user already did; a later one replaces it,
      // since the other tab may have reset.
      if (started !== resets) return commit(persisted(), true);
      commit(
        loaded
          ? read
          : {
              done: [...new Set([...done, ...read.done])],
              skipped: [...new Set([...skipped, ...read.skipped])],
              minimized: minimized || read.minimized,
              dismissed: dismissed || read.dismissed,
              celebrated: celebrated || read.celebrated,
            },
        true,
      );
      loaded = true;
    }
    try {
      const result = storage.read();
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        /** @type {Promise<ChecklistSnapshot>} */ (result).then(
          (read) => apply(toChecklistSnapshot(read)),
          (error) => {
            fail(error);
            apply(toChecklistSnapshot(undefined));
          },
        );
      } else {
        apply(toChecklistSnapshot(result));
      }
    } catch (error) {
      fail(error);
      apply(toChecklistSnapshot(undefined));
    }
  }

  /**
   * @param {ReadonlySet<string>} set
   * @param {string} id
   */
  const add = (set, id) => [...new Set([...set, id])];
  /**
   * @param {ReadonlySet<string>} set
   * @param {string} id
   */
  const drop = (set, id) => [...set].filter((item) => item !== id);

  return {
    subscribe: state.subscribe,
    check: (id) => update({ done: add(done, id), skipped: drop(skipped, id) }),
    uncheck: (id) => update({ done: drop(done, id) }),
    skip: (id) => update({ skipped: add(skipped, id) }),
    unskip: (id) => update({ skipped: drop(skipped, id) }),
    minimize: () => update({ minimized: true }),
    expand: () => update({ minimized: false }),
    dismiss: () => update({ dismissed: true }),
    restore: () => update({ dismissed: false, minimized: false }),
    celebrate: () => update({ celebrated: true }),
    reset() {
      resets++;
      update({
        done: [],
        skipped: [],
        minimized: false,
        dismissed: false,
        celebrated: false,
      });
    },
    connect() {
      refs++;
      if (refs === 1) {
        load();
        stop = storage.subscribe?.(receive);
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        refs--;
        if (refs === 0) {
          stop?.();
          stop = undefined;
        }
      };
    },
  };
}

const CONTEXT_KEY = "carbon:ChecklistStore";

/**
 * Share a checklist store with the `OnboardingChecklist` below the calling
 * component, and with anything that reads it, such as a "Setup guide" menu
 * item that calls `store.restore()`. Call it while a component initializes.
 *
 * @param {ChecklistStore} store
 */
export function setChecklistStore(store) {
  setContext(CONTEXT_KEY, store);
}

/**
 * The store `setChecklistStore` shared with this component, if any.
 *
 * @returns {ChecklistStore | undefined}
 */
export function getChecklistStore() {
  return getContext(CONTEXT_KEY);
}

/**
 * @typedef {Object} ChecklistCta
 * @property {string} text
 * @property {string} [href] Renders a link. Without it, a button.
 */

/**
 * @typedef {Object} ChecklistTask
 * @property {string} id Unique within the checklist; the key of the user's
 *   progress.
 * @property {string} title
 * @property {string} [description]
 * @property {string} [section] Tasks with the same section are grouped under
 *   its heading, in order of first appearance.
 * @property {ChecklistCta} [cta] The link or button that starts the task.
 * @property {boolean} [completed] Set by the app when it detects the task is
 *   done (or not). The task is then app-owned: the user can't check it.
 *   Leave it unset for a task the user checks.
 * @property {boolean} [optional] The user can skip the task.
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {ChecklistTask} task
 * @property {boolean} appOwned `true` when the app detects the task.
 * @property {"complete" | "incomplete" | "skipped"} status
 */

/**
 * @typedef {Object} ChecklistSection
 * @property {string | undefined} title
 * @property {ChecklistItem[]} items
 * @property {number} complete
 * @property {number} total
 */

/**
 * @typedef {Object} ChecklistProgress
 * @property {ChecklistItem[]} items
 * @property {ChecklistSection[]} sections
 * @property {number} complete
 * @property {number} skipped
 * @property {number} total Tasks that count: every task but the skipped ones.
 * @property {boolean} allSet
 */

/**
 * Combine the app's tasks with what the user did. A task with a boolean
 * `completed` is app-owned and the stored progress is ignored for it; any
 * other task is complete when the user checked it. A skipped task leaves the
 * total, so "3 of 5 complete" never counts a task the user chose not to do.
 * Ids in the store that no task has (a task removed in a release) are ignored.
 *
 * @param {ReadonlyArray<ChecklistTask>} tasks
 * @param {Pick<ChecklistStoreState, "done" | "skipped">} state
 * @returns {ChecklistProgress}
 */
export function resolveChecklist(tasks, state) {
  let complete = 0;
  let skipped = 0;
  /** @type {ChecklistItem[]} */
  const items = [];
  /** @type {Map<string, ChecklistSection>} */
  const bySection = new Map();
  /** @type {ChecklistSection[]} */
  const sections = [];

  for (const task of tasks) {
    const appOwned = typeof task.completed === "boolean";
    const isComplete = appOwned ? !!task.completed : state.done.has(task.id);
    const isSkipped =
      !isComplete && task.optional === true && state.skipped.has(task.id);
    /** @type {ChecklistItem} */
    const item = {
      task,
      appOwned,
      status: isComplete ? "complete" : isSkipped ? "skipped" : "incomplete",
    };
    items.push(item);
    if (isComplete) complete++;
    if (isSkipped) skipped++;

    const key = task.section ?? "";
    let section = bySection.get(key);
    if (!section) {
      section = { title: task.section, items: [], complete: 0, total: 0 };
      bySection.set(key, section);
      sections.push(section);
    }
    section.items.push(item);
    if (isComplete) section.complete++;
    if (!isSkipped) section.total++;
  }

  const total = items.length - skipped;
  return {
    items,
    sections,
    complete,
    skipped,
    total,
    allSet: items.length > 0 && complete === total,
  };
}
