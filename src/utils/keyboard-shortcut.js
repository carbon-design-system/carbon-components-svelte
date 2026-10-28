// @ts-check
import { readable } from "svelte/store";
import { isImeComposition } from "./ime-composition.js";
import { isModalDialog } from "./modal-dialog.js";
import { noop } from "./noop.js";
import { addPooledListener } from "./window-listener-pool.js";

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;
const ALPHANUMERIC = /[a-z0-9]/;
const LATIN_KEY = /^[a-z0-9]$/;
const LETTER = /^[a-z]$/;
const DIGIT = /^[0-9]$/;
const FUNCTION_KEY = /^f([1-9]|1[0-9]|2[0-4])$/;
const NON_TEXT_INPUT =
  /^(button|checkbox|radio|range|reset|submit|color|file|image)$/;

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
 * @param {string} key
 * @returns {boolean}
 */
function isSymbolKey(key) {
  return key.length === 1 && !ALPHANUMERIC.test(key);
}

/**
 * @param {KeyboardEvent} event
 * @param {string} key
 * @returns {boolean}
 */
function keyMatches(event, key) {
  const pressed = String(event.key ?? "").toLowerCase();
  if (pressed === key) return true;
  // Option on macOS and non-Latin layouts change `event.key` for a letter or
  // digit, so fall back to the physical key. Not when the layout already
  // gives a Latin letter or digit: Dvorak's O sits on QWERTY's S.
  if (LATIN_KEY.test(pressed)) return false;
  if (LETTER.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (DIGIT.test(key)) return event.code === `Digit${key}`;
  return false;
}

/**
 * @param {string | ReadonlyArray<string>} shortcut
 * @returns {string[]}
 */
function toList(shortcut) {
  return typeof shortcut === "string" ? [shortcut] : [...(shortcut ?? [])];
}

/**
 * Whether a keyboard event matches a shortcut. `mod` is Command on Apple
 * platforms and Control elsewhere. A symbol key such as `"?"` ignores Shift,
 * since typing the symbol may need it.
 * @param {KeyboardEvent} event
 * @param {string | ReadonlyArray<string>} shortcut
 * @param {{ apple?: boolean }} [options]
 * @returns {boolean}
 */
export function matchesShortcut(event, shortcut, options = {}) {
  const apple = options.apple ?? isApplePlatform();
  return toList(shortcut).some((entry) => {
    const parsed = parseShortcut(entry);
    if (!parsed) return false;
    const meta = parsed.meta || (parsed.mod && apple);
    const ctrl = parsed.ctrl || (parsed.mod && !apple);
    const shiftOk = parsed.shift
      ? event.shiftKey
      : isSymbolKey(parsed.key) || !event.shiftKey;
    return (
      event.metaKey === meta &&
      event.ctrlKey === ctrl &&
      event.altKey === parsed.alt &&
      shiftOk &&
      keyMatches(event, parsed.key)
    );
  });
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
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isEditable(target) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement && !NON_TEXT_INPUT.test(target.type))
  );
}

/**
 * @param {ReadonlyArray<string>} list
 * @returns {boolean}
 */
function isTyped(list) {
  return list.every((entry) => {
    const parsed = parseShortcut(entry);
    return !parsed || !(parsed.mod || parsed.meta || parsed.ctrl || parsed.alt);
  });
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

/**
 * @typedef {{
 *   list: string[];
 *   typed: boolean;
 *   run: (event: KeyboardEvent) => void;
 *   node?: HTMLElement;
 * }} Binding
 */

/** Shortcuts the app binds itself with `onShortcut`. */
/** @type {Set<Binding>} */
const explicit = new Set();

/** Shortcuts components bind to an element, such as a Button's click. */
/** @type {Set<Binding>} */
const bound = new Set();

/** @type {null | (() => void)} */
let releaseListener = null;

/**
 * @param {Set<Binding>} set
 * @param {Binding} binding
 * @returns {() => void}
 */
function listen(set, binding) {
  set.add(binding);
  if (!releaseListener) {
    releaseListener = addPooledListener("keydown", handleKeydown);
  }
  return () => {
    set.delete(binding);
    if (explicit.size || bound.size || !releaseListener) return;
    releaseListener();
    releaseListener = null;
  };
}

/**
 * @param {Element} node
 * @returns {boolean}
 */
function isShown(node) {
  if (typeof node.checkVisibility === "function") {
    return node.checkVisibility({ visibilityProperty: true });
  }
  return !node.closest("[hidden]");
}

/**
 * Whether a component's element can take its shortcut now: connected,
 * enabled, shown, and not inert.
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function isAvailable(node) {
  return (
    node.isConnected &&
    !node.matches(":disabled") &&
    node.getAttribute("aria-disabled") !== "true" &&
    !node.closest("[inert]") &&
    isShown(node)
  );
}

/**
 * The open modal dialog in front, if any: the last one shown. A modal
 * `<dialog>` counts too, though it sets no `aria-modal`.
 * @returns {null | Element}
 */
function frontModal() {
  const modals = document.querySelectorAll('[aria-modal="true"], dialog[open]');
  for (let i = modals.length - 1; i >= 0; i--) {
    const modal = modals[i];
    if (isModalDialog(modal) && !modal.closest("[inert]") && isShown(modal)) {
      return modal;
    }
  }
  return null;
}

/** @param {Event} event */
function handleKeydown(event) {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.defaultPrevented || event.repeat || isImeComposition(event)) {
    return;
  }
  const apple = isApplePlatform();
  const target = event.composedPath?.()[0] ?? event.target;
  const editable = isEditable(target);
  /** @param {Binding} binding */
  const matches = (binding) =>
    !(binding.typed && editable) &&
    matchesShortcut(event, binding.list, { apple });

  // The app's own bindings first: a component never takes a shortcut the
  // app handles itself.
  for (const binding of explicit) {
    if (!matches(binding)) continue;
    event.preventDefault();
    binding.run(event);
    return;
  }

  // Then the most recently bound element that can take it, in the front
  // modal while one is open.
  /** @type {undefined | Binding} */
  let winner;
  /** @type {undefined | null | Element} */
  let modal;
  for (const binding of bound) {
    const node = /** @type {HTMLElement} */ (binding.node);
    if (!matches(binding) || !isAvailable(node)) continue;
    if (modal === undefined) modal = frontModal();
    if (modal && !modal.contains(node)) continue;
    winner = binding;
  }
  if (!winner) return;
  event.preventDefault();
  winner.run(event);
}

/**
 * Call `callback` when a shortcut is pressed anywhere on the page. Returns a
 * function that removes the listener. Nothing listens until you call it.
 *
 * A shortcut without Command, Control, Alt or `mod`, such as `"/"`, does not
 * fire while the user types in a field. Key repeats, IME compositions and
 * events another handler already prevented are ignored. A shortcut bound
 * here takes precedence over the same shortcut on a component, such as a
 * Button's `shortcut`.
 * @param {string | ReadonlyArray<string>} shortcut
 * @param {(event: KeyboardEvent) => void} callback
 * @returns {() => void}
 */
export function onShortcut(shortcut, callback) {
  if (typeof window === "undefined") return noop;
  const list = toList(shortcut);
  return listen(explicit, { list, typed: isTyped(list), run: callback });
}

/**
 * Bind a shortcut to an element: `run` is called when it's pressed while the
 * element is connected, enabled, shown and not inert, and, while a modal
 * dialog is open, inside it. When several elements bind the same shortcut,
 * the one bound last wins. Components use it for their own `shortcut` prop.
 * @param {HTMLElement} node
 * @param {{
 *   shortcut?: string | ReadonlyArray<string>;
 *   run: (event: KeyboardEvent) => void;
 * }} params
 */
export function keyboardShortcut(node, params) {
  let release = noop;
  /** @type {undefined | Binding} */
  let binding;
  let current = "";

  /** @param {typeof params} next */
  function update(next) {
    const list = toList(next?.shortcut ?? "").filter(Boolean);
    const key = list.join(" ");
    if (binding && key === current) {
      binding.run = next.run;
      return;
    }
    release();
    current = key;
    binding = list.length
      ? { list, typed: isTyped(list), run: next.run, node }
      : undefined;
    release = binding ? listen(bound, binding) : noop;
  }

  update(params);
  return {
    update,
    destroy() {
      release();
    },
  };
}
