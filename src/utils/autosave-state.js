// @ts-check

/**
 * @typedef {"idle" | "unsaved" | "saving" | "saved" | "error" | "offline"} AutosaveStatus
 */

/**
 * The machine's own state. A revision counts edits, so "dirty" is a
 * comparison and an edit made during a save cannot be lost to the save's
 * result.
 *
 * @typedef {object} AutosaveMachineState
 * @property {number} revision Edits so far.
 * @property {number} sentRevision The revision the last save started with.
 * @property {number} savedRevision The newest revision a save confirmed.
 * @property {boolean} saving A request is in flight.
 * @property {boolean} retrying A failed save waits for its next attempt, or
 *   for the network.
 * @property {boolean} failed The last settled save failed for good. Stays
 *   until a save succeeds, so an edit does not hide it.
 * @property {unknown} error What the failed save threw.
 * @property {number} attempts Failed attempts since the last success.
 * @property {boolean} online
 * @property {number | undefined} savedAt When a save last succeeded.
 */

/**
 * @typedef {{ type: "change" }
 *   | { type: "start" }
 *   | { type: "success", at: number }
 *   | { type: "failure", error: unknown, retry: boolean }
 *   | { type: "online" }
 *   | { type: "offline" }
 *   | { type: "reset" }} AutosaveEvent
 */

/**
 * @param {{ online?: boolean, savedAt?: number }} [options]
 * @returns {AutosaveMachineState}
 */
export function createAutosaveState({ online = true, savedAt } = {}) {
  return {
    revision: 0,
    sentRevision: 0,
    savedRevision: 0,
    saving: false,
    retrying: false,
    failed: false,
    error: undefined,
    attempts: 0,
    online,
    savedAt,
  };
}

/**
 * Whether there is a value no save has confirmed: waiting, in flight or
 * failed.
 * @param {AutosaveMachineState} state
 */
export function isAutosaveDirty(state) {
  return state.revision > state.savedRevision;
}

/**
 * What to show. One rule picks it, most urgent first:
 *
 * 1. `offline`: something is unsaved and the network is gone. It beats
 *    `saving`, because a request that cannot finish is not progress.
 * 2. `saving`: a request is in flight, or a failed one will be tried again.
 *    A failure that is still being retried is not shown as an error.
 * 3. `error`: retries ran out. It stays through edits, until a save works.
 * 4. `unsaved`: an edit waits for its debounce.
 * 5. `saved`, once any save has worked, otherwise `idle`.
 *
 * @param {AutosaveMachineState} state
 * @returns {AutosaveStatus}
 */
export function autosaveStatus(state) {
  const dirty = isAutosaveDirty(state);
  const busy = state.saving || state.retrying;
  if (!state.online && (dirty || busy || state.failed)) return "offline";
  if (busy) return "saving";
  if (state.failed) return "error";
  if (dirty) return "unsaved";
  return state.savedAt === undefined ? "idle" : "saved";
}

/**
 * The pure transition. It never reads a clock or a timer: the driver passes
 * the time in `success` and decides, in `failure`, whether to try again.
 *
 * @param {AutosaveMachineState} state
 * @param {AutosaveEvent} event
 * @returns {AutosaveMachineState}
 */
export function autosaveReduce(state, event) {
  switch (event.type) {
    case "change":
      return { ...state, revision: state.revision + 1 };

    case "start":
      return {
        ...state,
        saving: true,
        retrying: false,
        sentRevision: state.revision,
        // A save after a failure (the Retry button, or an edit followed by a
        // debounced save) is a fresh chain of attempts. A retry inside that
        // chain keeps counting, or the chain would never end.
        attempts: state.failed && !state.retrying ? 0 : state.attempts,
      };

    case "success":
      // Only the revision the request carried is saved. An edit made while
      // it was in flight stays dirty.
      return {
        ...state,
        saving: false,
        retrying: false,
        failed: false,
        error: undefined,
        attempts: 0,
        savedRevision: Math.max(state.savedRevision, state.sentRevision),
        savedAt: event.at,
      };

    case "failure":
      if (!state.online) {
        // The network went away under the request. That is not the save's
        // fault: do not count it, and wait for `online`.
        return { ...state, saving: false, retrying: true };
      }
      return {
        ...state,
        saving: false,
        attempts: state.attempts + 1,
        retrying: event.retry,
        failed: event.retry ? state.failed : true,
        error: event.retry ? state.error : event.error,
      };

    case "online":
      return state.online ? state : { ...state, online: true };

    case "offline":
      return state.online ? { ...state, online: false } : state;

    case "reset":
      return {
        ...state,
        sentRevision: state.revision,
        savedRevision: state.revision,
        saving: false,
        retrying: false,
        failed: false,
        error: undefined,
        attempts: 0,
        savedAt: undefined,
      };
  }
  return state;
}
