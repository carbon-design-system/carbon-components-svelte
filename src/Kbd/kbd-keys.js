// @ts-check
import { shortcutKeys } from "../utils/keyboard-shortcut.js";

/** @typedef {import("./Kbd.svelte").KbdTranslationId} KbdTranslationId */

/**
 * The English key names, by translation id.
 * @type {Record<KbdTranslationId, string>}
 */
export const KBD_TRANSLATIONS = {
  ctrl: "Ctrl",
  control: "Control",
  alt: "Alt",
  option: "Option",
  shift: "Shift",
  meta: "Meta",
  command: "Command",
  enter: "Enter",
  return: "Return",
  escape: "Esc",
  escapeName: "Escape",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  forwardDelete: "Forward Delete",
  space: "Space",
  arrowUp: "Up Arrow",
  arrowDown: "Down Arrow",
  arrowLeft: "Left Arrow",
  arrowRight: "Right Arrow",
  pageUp: "Page Up",
  pageDown: "Page Down",
  home: "Home",
  end: "End",
};

/**
 * Symbols on Apple platforms, as macOS menus show them.
 * @type {Record<string, string>}
 */
const APPLE_SYMBOLS = {
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
  meta: "⌘",
  enter: "↵",
  tab: "⇥",
  backspace: "⌫",
  delete: "⌦",
};

/**
 * What screen readers hear for each Apple symbol.
 * @type {Record<string, KbdTranslationId>}
 */
const APPLE_NAMES = {
  ctrl: "control",
  alt: "option",
  shift: "shift",
  meta: "command",
  enter: "return",
  tab: "tab",
  backspace: "delete",
  delete: "forwardDelete",
};

/** @type {Record<string, string>} */
const ARROWS = {
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

/**
 * The words shown on keys elsewhere.
 * @type {Record<string, KbdTranslationId>}
 */
const WORDS = {
  ctrl: "ctrl",
  alt: "alt",
  shift: "shift",
  meta: "meta",
  enter: "enter",
  escape: "escape",
  tab: "tab",
  backspace: "backspace",
  delete: "delete",
  " ": "space",
  pageup: "pageUp",
  pagedown: "pageDown",
  home: "home",
  end: "end",
};

/**
 * Names read for keys whose shown text is short or a symbol.
 * @type {Record<string, KbdTranslationId>}
 */
const NAMES = {
  ctrl: "control",
  escape: "escapeName",
  arrowup: "arrowUp",
  arrowdown: "arrowDown",
  arrowleft: "arrowLeft",
  arrowright: "arrowRight",
};

/**
 * The keys of a shortcut as a `Kbd` shows them: the text on each key, and
 * the name a screen reader hears for it. Empty when the shortcut doesn't
 * parse.
 * @param {string} shortcut
 * @param {boolean} apple
 * @param {(id: KbdTranslationId) => string} translate
 * @returns {Array<{ label: string; name: string }>}
 */
export function kbdKeys(shortcut, apple, translate) {
  return shortcutKeys(shortcut, { apple }).map((key) => {
    const word = WORDS[key];
    const label =
      (apple && APPLE_SYMBOLS[key]) ||
      ARROWS[key] ||
      (word && translate(word)) ||
      (key.length === 1
        ? key.toUpperCase()
        : key.charAt(0).toUpperCase() + key.slice(1));
    const nameId = (apple && APPLE_NAMES[key]) || NAMES[key];
    return { label, name: nameId ? translate(nameId) : label };
  });
}
