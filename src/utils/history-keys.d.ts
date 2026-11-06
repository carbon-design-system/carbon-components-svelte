import type { History } from "./history.js";

export interface HistoryKeysOptions {
  /** The history to undo and redo. */
  history: History;
  /**
   * Who handles Mod+Z when focus is in a text field, which has an undo of
   * its own. `"native"` leaves it to the browser. `"fallthrough"` lets the
   * browser try first and undoes the history when the field had nothing to
   * undo. `"app"` always undoes the history, for fields whose edits it
   * records.
   * @default "native"
   */
  fields?: "native" | "fallthrough" | "app";
  /**
   * Where to listen. `"node"` handles keys pressed while focus is inside the
   * element. `"document"` handles every key on the page, including when
   * nothing has focus.
   * @default "node"
   */
  scope?: "node" | "document";
  /**
   * The undo shortcuts, in `matchesShortcut` form.
   * @default ["mod+z"]
   */
  undoKeys?: string | ReadonlyArray<string>;
  /**
   * The redo shortcuts. The default is Mod+Shift+Z, plus Control+Y on
   * Windows and Linux.
   */
  redoKeys?: string | ReadonlyArray<string>;
}

/**
 * Binds undo and redo to the keyboard inside `node`. Pass a history, or an
 * options object. SSR-safe.
 */
export function historyKeys(
  node: HTMLElement,
  params: History | HistoryKeysOptions,
): {
  update: (params: History | HistoryKeysOptions) => void;
  destroy: () => void;
};
