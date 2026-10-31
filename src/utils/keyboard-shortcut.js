// @ts-check
import { readable } from "svelte/store";

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;
const FUNCTION_KEY = /^f([1-9]|1[0-9]|2[0-4])$/;

// The name maps have no prototype, so a name such as "constructor" misses.

/** @type {Record<string, "meta" | "ctrl" | "alt" | "shift" | "mod">} */
const MODIFIERS = Object.assign(Object.create(null), {
  mod: "mod",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  super: "meta",
  win: "meta",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  opt: "alt",
  shift: "shift",
});

/** @type {Record<string, string>} */
const KEY_ALIASES = Object.assign(Object.create(null), {
  esc: "escape",
  return: "enter",
  space: " ",
  spacebar: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  del: "delete",
  plus: "+",
  comma: ",",
});

/** @type {Record<string, string>} */
const ARIA_KEYS = Object.assign(Object.create(null), {
  " ": "Space",
  escape: "Escape",
  enter: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
});

/**
 * Whether the browser runs on an Apple platform, where `mod` is Command.
 * Returns `false` on the server, including Node and Bun, which define a
 * `navigator` of their own.
 * @returns {boolean}
 */
export function isApplePlatform() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const platform =
    /** @type {{ userAgentData?: { platform?: string } }} */ (navigator)
      .userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent;
  return APPLE_PLATFORM.test(platform);
}

/**
 * Build a script that marks `<html>` with the platform before first paint:
 * `data-ccs-platform="apple"` or `"other"`. Inline it in `<head>` of a
 * server-rendered page, and every `Kbd` shows that platform's keys from the
 * first paint. Without it, a `Kbd` reserves room for both platforms' keys
 * and shows the other platforms' until it mounts.
 * Returns the script body without `<script>` tags. A Content Security Policy
 * that blocks inline scripts needs a nonce or a hash for it.
 * @returns {string}
 * @example
 * const script = `<script>${platformScript()}</script>`;
 */
export function platformScript() {
  return `(()=>{const n=navigator,p=(n.userAgentData&&n.userAgentData.platform)||n.platform||n.userAgent;document.documentElement.setAttribute("data-ccs-platform",${APPLE_PLATFORM}.test(p)?"apple":"other")})()`;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isKnownKey(key) {
  return key.length === 1 || key in ARIA_KEYS || FUNCTION_KEY.test(key);
}

/**
 * Split a shortcut such as `"mod+shift+p"` into its modifiers and key.
 * Returns `null` for an empty shortcut, an unknown modifier, or a key that
 * is neither one character nor a named key such as `"escape"` or `"f2"`
 * (`"⌘C"` is not a shortcut).
 * @param {string} shortcut
 * @returns {null | import("./keyboard-shortcut.js").ParsedShortcut}
 */
export function parseShortcut(shortcut) {
  const raw = String(shortcut ?? "")
    .trim()
    .toLowerCase();
  if (raw === "") return null;

  // A trailing "+" is the plus key: "mod++" or a bare "+".
  let key;
  let modifierPart;
  if (raw === "+") {
    key = "+";
    modifierPart = "";
  } else if (raw.endsWith("++")) {
    key = "+";
    modifierPart = raw.slice(0, -2);
  } else {
    const index = raw.lastIndexOf("+");
    key = raw.slice(index + 1);
    modifierPart = index === -1 ? "" : raw.slice(0, index);
  }

  key = KEY_ALIASES[key] ?? key;
  if (!isKnownKey(key)) return null;

  const parsed = {
    key,
    mod: false,
    meta: false,
    ctrl: false,
    alt: false,
    shift: false,
  };

  for (const part of modifierPart.split("+")) {
    const name = part.trim();
    if (name === "") continue;
    const modifier = MODIFIERS[name];
    if (!modifier) return null;
    parsed[modifier] = true;
  }

  return parsed;
}

/**
 * The keys of a shortcut in the order the platform shows them: Control,
 * Option, Shift, Command on Apple platforms, and Ctrl, Meta, Alt, Shift
 * elsewhere, then the key. Modifiers are `"ctrl"`, `"alt"`, `"shift"` and
 * `"meta"`; the key is lowercased with aliases resolved (`"escape"`).
 * @param {string} shortcut
 * @param {{ apple?: boolean }} [options]
 * @returns {string[]}
 */
export function shortcutKeys(shortcut, options = {}) {
  const parsed = parseShortcut(shortcut);
  if (!parsed) return [];
  const apple = options.apple ?? isApplePlatform();
  const meta = parsed.meta || (parsed.mod && apple);
  const ctrl = parsed.ctrl || (parsed.mod && !apple);
  const keys = [];
  if (ctrl) keys.push("ctrl");
  if (!apple && meta) keys.push("meta");
  if (parsed.alt) keys.push("alt");
  if (parsed.shift) keys.push("shift");
  if (apple && meta) keys.push("meta");
  keys.push(parsed.key);
  return keys;
}

// Read only by `formatShortcut`, for keys `parseShortcut` accepted. As a
// plain object it drops out of an app's bundle with `formatShortcut`.
/** @type {Record<string, [apple: string, other: string]>} */
const KEY_LABELS = {
  escape: ["Esc", "Esc"],
  enter: ["↵", "Enter"],
  " ": ["Space", "Space"],
  tab: ["⇥", "Tab"],
  backspace: ["⌫", "Backspace"],
  delete: ["⌦", "Delete"],
  arrowup: ["↑", "↑"],
  arrowdown: ["↓", "↓"],
  arrowleft: ["←", "←"],
  arrowright: ["→", "→"],
  pageup: ["Page Up", "Page Up"],
  pagedown: ["Page Down", "Page Down"],
  home: ["Home", "Home"],
  end: ["End", "End"],
};

/** @type {Record<string, [apple: string, other: string]>} */
const MODIFIER_LABELS = {
  ctrl: ["⌃", "Ctrl"],
  alt: ["⌥", "Alt"],
  shift: ["⇧", "Shift"],
  meta: ["⌘", "Meta"],
};

/**
 * The key caps to display for a shortcut, in platform order: `⌃ ⌥ ⇧ ⌘` on
 * Apple platforms, `Ctrl Alt Shift` elsewhere.
 * @param {string} shortcut
 * @param {{ apple?: boolean }} [options]
 * @returns {string[]}
 */
export function formatShortcut(shortcut, options = {}) {
  const apple = options.apple ?? isApplePlatform();
  const keys = shortcutKeys(shortcut, { apple });
  return keys.map((key, index) => {
    const named =
      index < keys.length - 1 ? MODIFIER_LABELS[key] : KEY_LABELS[key];
    if (named) return named[apple ? 0 : 1];
    return key.length === 1
      ? key.toUpperCase()
      : key.charAt(0).toUpperCase() + key.slice(1);
  });
}

/**
 * @param {string | ReadonlyArray<string>} shortcut
 * @returns {string[]}
 */
function toList(shortcut) {
  return typeof shortcut === "string" ? [shortcut] : [...(shortcut ?? [])];
}

/**
 * @param {string} key
 * @returns {string}
 */
function ariaKey(key) {
  if (key === "+") return "Plus";
  if (key in ARIA_KEYS) return ARIA_KEYS[key];
  return key.toUpperCase();
}

/**
 * The `aria-keyshortcuts` value for one or more shortcuts, such as
 * `"Meta+K"` on Apple platforms and `"Control+K"` elsewhere.
 * @param {string | ReadonlyArray<string>} shortcut
 * @param {{ apple?: boolean }} [options]
 * @returns {string}
 */
export function ariaKeyShortcuts(shortcut, options = {}) {
  const apple = options.apple ?? isApplePlatform();
  return toList(shortcut)
    .map((entry) => {
      const parsed = parseShortcut(entry);
      if (!parsed) return "";
      const parts = [];
      if (parsed.ctrl || (parsed.mod && !apple)) parts.push("Control");
      if (parsed.alt) parts.push("Alt");
      if (parsed.shift) parts.push("Shift");
      if (parsed.meta || (parsed.mod && apple)) parts.push("Meta");
      parts.push(ariaKey(parsed.key));
      return parts.join("+");
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Whether the platform is Apple's, as a store. `false` on the server and
 * for the first client render, so the server's markup and the hydrating
 * client's agree. The first subscriber in the browser reads the platform
 * in a microtask, after hydration, and every subscriber updates in one
 * flush. Any component that reads it, with or without a `Kbd`, gets the
 * platform.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const applePlatform = readable(false, (set) => {
  if (typeof window === "undefined") return;
  queueMicrotask(() => set(isApplePlatform()));
});

/** @type {undefined | Promise<typeof import("./keyboard-shortcut-binding.js")>} */
let binding;

/**
 * Load the binding code once, on first use.
 * @returns {Promise<typeof import("./keyboard-shortcut-binding.js")>}
 */
export function loadShortcutBinding() {
  binding ??= import("./keyboard-shortcut-binding.js");
  return binding;
}

/**
 * `keyboardShortcut`, loaded on demand: a component with no `shortcut`
 * never loads the binding code. The shortcut answers once the code loads,
 * a microtask or one network round trip after mount.
 * @param {HTMLElement} node
 * @param {import("./keyboard-shortcut-binding.js").KeyboardShortcutParams} params
 */
export function lazyKeyboardShortcut(node, params) {
  let latest = params;
  let destroyed = false;
  /** @type {undefined | ReturnType<typeof import("./keyboard-shortcut-binding.js").keyboardShortcut>} */
  let action;
  let loading = false;

  function load() {
    if (loading || action || !hasShortcut(latest)) return;
    loading = true;
    loadShortcutBinding().then((module) => {
      if (destroyed) return;
      action = module.keyboardShortcut(node, latest);
    });
  }

  load();
  return {
    /** @param {typeof params} next */
    update(next) {
      latest = next;
      if (action) action.update(next);
      else load();
    },
    destroy() {
      destroyed = true;
      action?.destroy();
    },
  };
}

/**
 * @param {undefined | { shortcut?: string | ReadonlyArray<string> }} params
 * @returns {boolean}
 */
function hasShortcut(params) {
  return toList(params?.shortcut ?? "").some(Boolean);
}
