/** The player's shortcuts, in the shortcut helpers' syntax. */
export const MEDIA_SHORTCUTS: ReadonlyArray<{
  id: string;
  shortcut: string | ReadonlyArray<string>;
  /** Uses arrow keys: applies only when the player or its video has focus. */
  surface?: boolean;
  /** Fires again while the key is held. */
  repeat?: boolean;
}>;

/**
 * What a key may do for the element that has focus: nothing (a text field,
 * a menu or a dialog), letters and symbols but not Space (a button, link or
 * slider), or everything (the player or its video).
 */
export function shortcutScope(
  target: EventTarget | null,
  root: Element | null,
): "none" | "keys" | "surface";

/** The shortcut id a keyboard event stands for, or `null`. */
export function mediaShortcutAction(
  event: KeyboardEvent,
  scope: "none" | "keys" | "surface",
  options?: { apple?: boolean },
): string | null;
