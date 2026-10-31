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

export type ShortcutPlatformOptions = {
  /**
   * Format or match for an Apple platform, where `mod` is Command.
   * Detected from `navigator` when unset.
   */
  apple?: boolean;
};

/**
 * Whether the browser runs on an Apple platform. `false` on the server,
 * including Node and Bun.
 */
export function isApplePlatform(): boolean;

/**
 * Build a script that marks `<html>` with the platform before first paint
 * (`data-ccs-platform="apple"` or `"other"`), so every `Kbd` shows that
 * platform's keys from the first paint. Returns the script body without
 * `<script>` tags. A Content Security Policy that blocks inline scripts
 * needs a nonce or a hash for it.
 */
export function platformScript(): string;

/**
 * Split a shortcut such as `"mod+shift+p"` into its modifiers and key.
 * Returns `null` for an empty shortcut, an unknown modifier, or a key that
 * is neither one character nor a named key such as `"escape"` or `"f2"`.
 */
export function parseShortcut(shortcut: string): ParsedShortcut | null;

/**
 * The keys of a shortcut in the order the platform shows them: Control,
 * Option, Shift, Command on Apple platforms, and Ctrl, Meta, Alt, Shift
 * elsewhere, then the key. Modifiers are `"ctrl"`, `"alt"`, `"shift"` and
 * `"meta"`; the key is lowercased with aliases resolved (`"escape"`).
 */
export function shortcutKeys(
  shortcut: string,
  options?: ShortcutPlatformOptions,
): string[];

/**
 * The key caps to display for a shortcut, in platform order: `⌃ ⌥ ⇧ ⌘`
 * on Apple platforms, `Ctrl Alt Shift` elsewhere.
 */
export function formatShortcut(
  shortcut: string,
  options?: ShortcutPlatformOptions,
): string[];

/** The `aria-keyshortcuts` value for one or more shortcuts. */
export function ariaKeyShortcuts(
  shortcut: string | ReadonlyArray<string>,
  options?: ShortcutPlatformOptions,
): string;

/**
 * Whether the platform is Apple's. `false` on the server and for the first
 * client render; the first subscriber in the browser reads the platform
 * after hydration.
 */
export const applePlatform: import("svelte/store").Readable<boolean>;

export type { KeyboardShortcutParams } from "./keyboard-shortcut-binding.js";

/** Load the shortcut binding code once, on first use. */
export function loadShortcutBinding(): Promise<
  typeof import("./keyboard-shortcut-binding.js")
>;

/**
 * `keyboardShortcut`, loaded on demand. A component with no `shortcut`
 * never loads the binding code; the shortcut answers once it loads.
 */
export function lazyKeyboardShortcut(
  node: HTMLElement,
  params: import("./keyboard-shortcut-binding.js").KeyboardShortcutParams,
): {
  update: (
    params: import("./keyboard-shortcut-binding.js").KeyboardShortcutParams,
  ) => void;
  destroy: () => void;
};
