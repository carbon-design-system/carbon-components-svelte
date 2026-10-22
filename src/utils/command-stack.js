// @ts-check
// An undo stack of commands, each a pair of functions, with coalescing so
// a drag of many moves undoes as one step.

import { writable } from "svelte/store";

/**
 * @param {{ limit?: number }} [options]
 * @returns {import("./command-stack.d.ts").CommandStack}
 */
export function createCommandStack(options = {}) {
  const { limit = 100 } = options;
  /** @type {import("./command-stack.d.ts").Command[]} */
  let done = [];
  /** @type {import("./command-stack.d.ts").Command[]} */
  let undone = [];
  const canUndo = writable(false);
  const canRedo = writable(false);

  function sync() {
    canUndo.set(done.length > 0);
    canRedo.set(undone.length > 0);
  }

  return {
    canUndo,
    canRedo,
    execute(command) {
      command.do();
      const last = done[done.length - 1];
      // Consecutive commands with the same key fold into one step that
      // undoes back to before the first.
      if (command.key !== undefined && last && last.key === command.key) {
        const previous = last;
        done[done.length - 1] = {
          key: command.key,
          label: command.label ?? previous.label,
          do: () => {
            previous.do();
            command.do();
          },
          undo: () => {
            command.undo();
            previous.undo();
          },
        };
      } else {
        done.push(command);
        if (done.length > limit) done = done.slice(done.length - limit);
      }
      undone = [];
      sync();
    },
    undo() {
      const command = done.pop();
      if (!command) return false;
      command.undo();
      undone.push(command);
      sync();
      return true;
    },
    redo() {
      const command = undone.pop();
      if (!command) return false;
      command.do();
      done.push(command);
      sync();
      return true;
    },
    clear() {
      done = [];
      undone = [];
      sync();
    },
    /** Close the current coalescing group, so the next command starts a step. */
    seal() {
      const last = done[done.length - 1];
      if (last?.key !== undefined)
        done[done.length - 1] = { ...last, key: undefined };
    },
  };
}
