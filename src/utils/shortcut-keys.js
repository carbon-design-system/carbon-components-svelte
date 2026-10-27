// @ts-check
import { writable } from "svelte/store";

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

/** @type {Record<string, "meta" | "ctrl" | "alt" | "shift" | "mod">} */
const MODIFIERS = {
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
};

/** @type {Record<string, string>} */
const KEY_ALIASES = {
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
};

/**
 * What a named key shows on an Apple platform and elsewhere, and what a
 * screen reader says for the glyph.
 * @type {Record<string, { apple: string, other: string, name: string, appleName?: string }>}
 */
const KEY_LABELS = {
  escape: { apple: "Esc", other: "Esc", name: "Escape" },
  enter: { apple: "↵", other: "Enter", name: "Enter", appleName: "Return" },
  " ": { apple: "Space", other: "Space", name: "Space" },
  tab: { apple: "⇥", other: "Tab", name: "Tab" },
  backspace: {
    apple: "⌫",
    other: "Backspace",
    name: "Backspace",
    appleName: "Delete",
  },
  delete: {
    apple: "⌦",
    other: "Delete",
    name: "Delete",
    appleName: "Forward Delete",
  },
  arrowup: { apple: "↑", other: "↑", name: "Up Arrow" },
  arrowdown: { apple: "↓", other: "↓", name: "Down Arrow" },
  arrowleft: { apple: "←", other: "←", name: "Left Arrow" },
  arrowright: { apple: "→", other: "→", name: "Right Arrow" },
  pageup: { apple: "Page Up", other: "Page Up", name: "Page Up" },
  pagedown: { apple: "Page Down", other: "Page Down", name: "Page Down" },
  home: { apple: "Home", other: "Home", name: "Home" },
  end: { apple: "End", other: "End", name: "End" },
};

/** How a screen reader should say a punctuation key. @type {Record<string, string>} */
const SYMBOL_NAMES = {
  "+": "Plus",
  ",": "Comma",
  "-": "Minus",
  ".": "Period",
  "/": "Slash",
  "?": "Question mark",
};

/**
 * Whether the browser runs on an Apple platform, where `mod` is Command.
 * Returns `false` on the server: Node 21+ defines `navigator`, so the guard
 * is on `window`.
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

const apple = writable(false);

/**
 * Whether the page runs on an Apple platform, as one store shared by every
 * `KeyboardShortcut`. It holds `false` until `syncPlatform()` runs on the
 * client, so the server and the first client render agree.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const applePlatform = { subscribe: apple.subscribe };

/**
 * Read the platform from the browser into `applePlatform`. Call it from
 * `onMount`: every subscriber updates in one flush, and a component created
 * later reads the value already there. The server never runs `onMount`, so
 * this store is never written there and one request cannot leak into the
 * next.
 */
export function syncPlatform() {
  apple.set(isApplePlatform());
}

/**
 * Split a shortcut such as `"mod+shift+p"` into its modifiers and key.
 * Returns `null` for an empty shortcut or an unknown modifier.
 * @param {string} shortcut
 * @returns {null | import("./shortcut-keys.js").ParsedShortcut}
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

  const parsed = {
    key: KEY_ALIASES[key] ?? key,
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
 * The key caps for a shortcut in platform order (`⌃ ⌥ ⇧ ⌘` on Apple
 * platforms, `Ctrl Meta Alt Shift` elsewhere), each with the text a screen
 * reader should say: "Command", not "place of interest sign".
 * @param {string} shortcut
 * @param {boolean} apple
 * @returns {import("./shortcut-keys.js").ShortcutKey[]}
 */
export function shortcutKeys(shortcut, apple) {
  const parsed = parseShortcut(shortcut);
  if (!parsed) return [];
  const meta = parsed.meta || (parsed.mod && apple);
  const ctrl = parsed.ctrl || (parsed.mod && !apple);
  /** @type {import("./shortcut-keys.js").ShortcutKey[]} */
  const keys = [];
  if (apple) {
    if (ctrl) keys.push({ label: "⌃", name: "Control" });
    if (parsed.alt) keys.push({ label: "⌥", name: "Option" });
    if (parsed.shift) keys.push({ label: "⇧", name: "Shift" });
    if (meta) keys.push({ label: "⌘", name: "Command" });
  } else {
    if (ctrl) keys.push({ label: "Ctrl", name: "Control" });
    if (meta) keys.push({ label: "Meta", name: "Meta" });
    if (parsed.alt) keys.push({ label: "Alt", name: "Alt" });
    if (parsed.shift) keys.push({ label: "Shift", name: "Shift" });
  }

  const named = KEY_LABELS[parsed.key];
  if (named) {
    keys.push({
      label: apple ? named.apple : named.other,
      name: (apple && named.appleName) || named.name,
    });
  } else if (parsed.key.length === 1) {
    keys.push({
      label: parsed.key.toUpperCase(),
      name: SYMBOL_NAMES[parsed.key] ?? parsed.key.toUpperCase(),
    });
  } else {
    const label = parsed.key.charAt(0).toUpperCase() + parsed.key.slice(1);
    keys.push({ label, name: label });
  }
  return keys;
}

/** @type {Record<string, string>} */
const ARIA_KEYS = {
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
};

/**
 * The `aria-keyshortcuts` value for one or more shortcuts, such as
 * `"Meta+K"` on Apple platforms and `"Control+K"` elsewhere.
 * @param {string | ReadonlyArray<string>} shortcut
 * @param {{ apple?: boolean }} [options]
 * @returns {string}
 */
export function ariaKeyShortcuts(shortcut, options = {}) {
  const apple = options.apple ?? isApplePlatform();
  const list = typeof shortcut === "string" ? [shortcut] : [...shortcut];
  return list
    .map((entry) => {
      const parsed = parseShortcut(entry);
      if (!parsed) return "";
      const parts = [];
      if (parsed.ctrl || (parsed.mod && !apple)) parts.push("Control");
      if (parsed.alt) parts.push("Alt");
      if (parsed.shift) parts.push("Shift");
      if (parsed.meta || (parsed.mod && apple)) parts.push("Meta");
      parts.push(
        ARIA_KEYS[parsed.key] ??
          (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key),
      );
      return parts.join("+");
    })
    .filter(Boolean)
    .join(" ");
}
