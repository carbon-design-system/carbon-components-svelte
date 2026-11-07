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
  del: "Del",
  forwardDel: "Fwd Del",
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
 * @typedef {"command" | "option" | "shift" | "control" | "return" | "tab" | "arrowUp" | "arrowDown" | "arrowLeft" | "arrowRight"} KbdIcon
 */

/**
 * Icons on Apple platforms, for the symbols macOS menus show. Carbon
 * icons, so the keys draw the same in every browser: IBM Plex has no ⌘.
 * @type {Record<string, KbdIcon>}
 */
const APPLE_ICONS = {
  ctrl: "control",
  alt: "option",
  shift: "shift",
  meta: "command",
  enter: "return",
  tab: "tab",
};

/**
 * Short words on Apple platforms for the keys Carbon has no icon for, so
 * they sit with the icons. Screen readers hear the full names.
 * @type {Record<string, KbdTranslationId>}
 */
const APPLE_WORDS = {
  backspace: "del",
  delete: "forwardDel",
};

/**
 * What screen readers hear for each Apple icon or short word.
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

/** @type {Record<string, KbdIcon>} */
const ARROWS = {
  arrowup: "arrowUp",
  arrowdown: "arrowDown",
  arrowleft: "arrowLeft",
  arrowright: "arrowRight",
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
 * The keys of a shortcut as a `Kbd` shows them: the text or the icon on
 * each key, and the name a screen reader hears for it. A key with an icon
 * has an empty `label`. Empty when the shortcut doesn't parse.
 * @param {string} shortcut
 * @param {boolean} apple
 * @param {(id: KbdTranslationId) => string} translate
 * @returns {Array<{ label: string; name: string; icon?: KbdIcon }>}
 */
export function kbdKeys(shortcut, apple, translate) {
  return shortcutKeys(shortcut, { apple }).map((key) => {
    const icon = (apple && APPLE_ICONS[key]) || ARROWS[key];
    const nameId = (apple && APPLE_NAMES[key]) || NAMES[key];
    if (icon) return { label: "", name: translate(nameId), icon };
    const word = (apple && APPLE_WORDS[key]) || WORDS[key];
    const label = word
      ? translate(word)
      : key.length === 1
        ? key.toUpperCase()
        : key.charAt(0).toUpperCase() + key.slice(1);
    return { label, name: nameId ? translate(nameId) : label };
  });
}
