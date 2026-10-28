import type { ShortcutPlatformOptions } from "./keyboard-shortcut.js";

/**
 * Whether a keyboard event matches a shortcut. `mod` is Command on Apple
 * platforms and Control elsewhere. A symbol key such as `"?"` ignores Shift.
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string | ReadonlyArray<string>,
  options?: ShortcutPlatformOptions,
): boolean;

/**
 * Call `callback` when a shortcut is pressed anywhere on the page. Returns a
 * function that removes the listener. Nothing listens until you call it.
 * A shortcut without Command, Control, Alt or `mod` does not fire while the
 * user types in a field.
 */
export function onShortcut(
  shortcut: string | ReadonlyArray<string>,
  callback: (event: KeyboardEvent) => void,
): () => void;

export type KeyboardShortcutParams = {
  shortcut?: string | ReadonlyArray<string>;
  run: (event: KeyboardEvent) => void;
};

/**
 * Bind a shortcut to an element: `run` is called when it's pressed while the
 * element is connected, enabled, shown and not inert, and, while a modal
 * dialog is open, inside it. The element bound last wins a shared shortcut.
 */
export function keyboardShortcut(
  node: HTMLElement,
  params: KeyboardShortcutParams,
): {
  update: (params: KeyboardShortcutParams) => void;
  destroy: () => void;
};
