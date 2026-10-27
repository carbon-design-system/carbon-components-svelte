import type { Readable } from "svelte/store";

export type ParsedShortcut = {
  /** The key, lowercased, with aliases resolved (`"esc"` is `"escape"`). */
  key: string;
  /** Command on Apple platforms, Control elsewhere. */
  mod: boolean;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
};

export type ShortcutKey = {
  /** The text drawn on the key cap, such as `"⌘"` or `"Ctrl"`. */
  label: string;
  /** The text a screen reader says, such as `"Command"`. */
  name: string;
};

/** Whether the browser runs on an Apple platform. `false` on the server. */
export function isApplePlatform(): boolean;

/** Whether the page runs on an Apple platform. `false` until `syncPlatform()`. */
export const applePlatform: Readable<boolean>;

/** Read the platform from the browser into `applePlatform`. Client only. */
export function syncPlatform(): void;

/**
 * Split a shortcut such as `"mod+shift+p"` into its modifiers and key.
 * Returns `null` for an empty shortcut or an unknown modifier.
 */
export function parseShortcut(shortcut: string): ParsedShortcut | null;

/** The key caps for a shortcut in platform order. Empty when unparseable. */
export function shortcutKeys(shortcut: string, apple: boolean): ShortcutKey[];
