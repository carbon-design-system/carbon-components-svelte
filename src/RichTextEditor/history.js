// @ts-check

/**
 * @template S
 * @typedef {Object} History
 * @property {(kind: string, capture: () => S) => void} record Call before a change. Captures the state before it, unless this change continues a run of the same `kind` (typing) that is still open.
 * @property {(state: S) => void} push Add a step of its own: the state before a command.
 * @property {() => void} seal End the open run, so the next change starts a new step.
 * @property {(capture: () => S) => S | undefined} undo Returns the state to restore, after pushing the current one for redo.
 * @property {(capture: () => S) => S | undefined} redo
 * @property {() => void} clear
 * @property {() => boolean} canUndo
 * @property {() => boolean} canRedo
 */

/**
 * Undo history for an editor that owns its DOM. Browsers' own undo stack
 * breaks once a script edits the DOM, and `beforeinput` fires before the
 * browser changes anything, so the state to go back to is captured there.
 *
 * Typing is grouped: consecutive changes of one kind within `delay`
 * milliseconds share a step, and `seal()` ends the group (a caret move, a
 * command). Capturing only at group starts keeps the per-keystroke cost to a
 * timestamp check, which is what holds typing latency flat in a long
 * document.
 *
 * @template S
 * @param {{ limit?: number, delay?: number, now?: () => number }} [options]
 * @returns {History<S>}
 */
export function createHistory(options = {}) {
  const limit = options.limit ?? 100;
  const delay = options.delay ?? 700;
  const now = options.now ?? (() => Date.now());
  /** @type {S[]} */
  let undoStack = [];
  /** @type {S[]} */
  let redoStack = [];
  /** @type {string | null} */
  let openKind = null;
  let lastAt = 0;

  return {
    record(kind, capture) {
      const time = now();
      if (openKind === kind && time - lastAt <= delay) {
        lastAt = time;
        return;
      }
      openKind = kind;
      lastAt = time;
      undoStack.push(capture());
      if (undoStack.length > limit) undoStack.shift();
      redoStack = [];
    },
    push(state) {
      undoStack.push(state);
      if (undoStack.length > limit) undoStack.shift();
      redoStack = [];
      openKind = null;
    },
    seal() {
      openKind = null;
    },
    undo(capture) {
      const previous = undoStack.pop();
      if (previous === undefined) return undefined;
      redoStack.push(capture());
      openKind = null;
      return previous;
    },
    redo(capture) {
      const next = redoStack.pop();
      if (next === undefined) return undefined;
      undoStack.push(capture());
      openKind = null;
      return next;
    },
    clear() {
      undoStack = [];
      redoStack = [];
      openKind = null;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
  };
}
