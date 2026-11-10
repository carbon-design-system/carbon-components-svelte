// @ts-check
import { hasModifierKey } from "../utils/has-modifier-key.js";
import { isImeComposition } from "../utils/ime-composition.js";
import { matchesShortcut } from "../utils/keyboard-shortcut.js";

/**
 * The player's shortcuts, as the shortcut helpers write them. They apply
 * only while focus is inside the player, never page-wide (WCAG 2.1.4).
 *
 * `surface` ones also use arrow keys, which a slider, a menu or a button
 * group already owns, so they apply only when the player or its video has
 * focus.
 * @type {ReadonlyArray<{ id: string, shortcut: string | ReadonlyArray<string>, surface?: boolean, repeat?: boolean }>}
 */
export const MEDIA_SHORTCUTS = Object.freeze([
  { id: "playPause", shortcut: ["space", "k"] },
  { id: "mute", shortcut: "m" },
  { id: "fullscreen", shortcut: "f" },
  { id: "captions", shortcut: "c" },
  { id: "back", shortcut: "j", repeat: true },
  { id: "forward", shortcut: "l", repeat: true },
  { id: "slower", shortcut: "<" },
  { id: "faster", shortcut: ">" },
  { id: "help", shortcut: "?" },
  { id: "seekBack", shortcut: "left", surface: true, repeat: true },
  { id: "seekForward", shortcut: "right", surface: true, repeat: true },
  { id: "volumeUp", shortcut: "up", surface: true, repeat: true },
  { id: "volumeDown", shortcut: "down", surface: true, repeat: true },
]);

const TEXT_INPUT =
  /^(button|checkbox|radio|range|reset|submit|color|file|image)$/;

/**
 * What the key may do for the element that has focus:
 * - `"none"`: nothing. A text field keeps its typing, and a menu or a
 *   dialog keeps its own keys and type-ahead.
 * - `"keys"`: letters and symbols, but not Space. A button, link or slider
 *   already acts on Space.
 * - `"surface"`: everything, arrow keys included: the player or its video.
 * @param {EventTarget | null} target
 * @param {Element | null} root
 * @returns {"none" | "keys" | "surface"}
 */
export function shortcutScope(target, root) {
  if (!(target instanceof HTMLElement)) return "none";
  if (target.isContentEditable) return "none";
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return "none";
  }
  if (target instanceof HTMLInputElement && !TEXT_INPUT.test(target.type)) {
    return "none";
  }
  if (target.closest('[role="menu"], [role="dialog"], [role="alertdialog"]')) {
    return "none";
  }
  if (target === root || target instanceof HTMLMediaElement) return "surface";
  return "keys";
}

/**
 * The shortcut a keyboard event stands for, or `null`.
 * @param {KeyboardEvent} event
 * @param {"none" | "keys" | "surface"} scope - From `shortcutScope`.
 * @param {{ apple?: boolean }} [options]
 * @returns {string | null}
 */
export function mediaShortcutAction(event, scope, options) {
  if (scope === "none") return null;
  if (event.defaultPrevented || isImeComposition(event)) return null;
  if (hasModifierKey(event)) return null;
  for (const entry of MEDIA_SHORTCUTS) {
    if (entry.surface && scope !== "surface") continue;
    if (event.repeat && !entry.repeat) continue;
    if (!matchesShortcut(event, entry.shortcut, options)) continue;
    // Space presses a focused button, link or slider; the shortcut would
    // press it twice.
    if (entry.id === "playPause" && event.key === " " && scope !== "surface") {
      return null;
    }
    return entry.id;
  }
  return null;
}
