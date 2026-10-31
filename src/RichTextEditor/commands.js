// @ts-check

import Code from "../icons/Code.svelte";
import LinkIcon from "../icons/LinkIcon.svelte";
import ListBulleted from "../icons/ListBulleted.svelte";
import ListNumbered from "../icons/ListNumbered.svelte";
import Quotes from "../icons/Quotes.svelte";
import Redo from "../icons/Redo.svelte";
import TextBold from "../icons/TextBold.svelte";
import TextClearFormat from "../icons/TextClearFormat.svelte";
import TextIndentLess from "../icons/TextIndentLess.svelte";
import TextIndentMore from "../icons/TextIndentMore.svelte";
import TextItalic from "../icons/TextItalic.svelte";
import TextStrikethrough from "../icons/TextStrikethrough.svelte";
import TextUnderline from "../icons/TextUnderline.svelte";
import Undo from "../icons/Undo.svelte";

/**
 * @typedef {"undo" | "redo" | "h2" | "h3" | "bold" | "italic" | "underline" | "strike" | "code" | "ul" | "ol" | "outdent" | "indent" | "blockquote" | "link" | "clear"} RichTextCommand
 */

/**
 * A toolbar item.
 *
 * @typedef {Object} CommandSpec
 * @property {string} label Default accessible name.
 * @property {any} [icon] Icon component. Without one, `glyph` is drawn.
 * @property {string} [glyph]
 * @property {boolean} toggle Whether the item has a pressed state.
 * @property {boolean} [mirror] Whether the icon points back or forward, and mirrors in RTL.
 * @property {string} [state] Key in `queryState()` that marks it pressed.
 * @property {{ key?: string, code?: string, shift?: boolean, alt?: boolean, mac?: boolean }[]} [shortcuts] First entry that fits the platform is the one shown. A `mac` of `false` limits it to other platforms.
 */

/** @type {Record<RichTextCommand, CommandSpec>} */
export const COMMANDS = {
  undo: {
    label: "Undo",
    icon: Undo,
    toggle: false,
    mirror: true,
    shortcuts: [{ key: "z" }],
  },
  redo: {
    label: "Redo",
    icon: Redo,
    toggle: false,
    mirror: true,
    shortcuts: [
      { key: "z", shift: true },
      { key: "y", mac: false },
    ],
  },
  h2: {
    label: "Heading 2",
    glyph: "H2",
    toggle: true,
    state: "h2",
    shortcuts: [{ code: "Digit2", alt: true }],
  },
  h3: {
    label: "Heading 3",
    glyph: "H3",
    toggle: true,
    state: "h3",
    shortcuts: [{ code: "Digit3", alt: true }],
  },
  bold: {
    label: "Bold",
    icon: TextBold,
    toggle: true,
    state: "strong",
    shortcuts: [{ key: "b" }],
  },
  italic: {
    label: "Italic",
    icon: TextItalic,
    toggle: true,
    state: "em",
    shortcuts: [{ key: "i" }],
  },
  underline: {
    label: "Underline",
    icon: TextUnderline,
    toggle: true,
    state: "u",
    shortcuts: [{ key: "u" }],
  },
  strike: {
    label: "Strikethrough",
    icon: TextStrikethrough,
    toggle: true,
    state: "s",
    shortcuts: [{ key: "x", shift: true }],
  },
  code: {
    label: "Code",
    icon: Code,
    toggle: true,
    state: "code",
    shortcuts: [{ key: "e" }],
  },
  ul: {
    label: "Bulleted list",
    icon: ListBulleted,
    toggle: true,
    state: "ul",
    shortcuts: [{ code: "Digit8", shift: true }],
  },
  ol: {
    label: "Numbered list",
    icon: ListNumbered,
    toggle: true,
    state: "ol",
    shortcuts: [{ code: "Digit7", shift: true }],
  },
  outdent: {
    label: "Decrease indent",
    icon: TextIndentLess,
    toggle: false,
    mirror: true,
  },
  indent: {
    label: "Increase indent",
    icon: TextIndentMore,
    toggle: false,
    mirror: true,
  },
  blockquote: {
    label: "Quote",
    icon: Quotes,
    toggle: true,
    state: "blockquote",
    shortcuts: [{ code: "Digit9", shift: true }],
  },
  link: {
    label: "Link",
    icon: LinkIcon,
    toggle: false,
    shortcuts: [{ key: "k" }],
  },
  clear: {
    label: "Clear formatting",
    icon: TextClearFormat,
    toggle: false,
    shortcuts: [{ code: "Backslash" }],
  },
};

/** @type {readonly (RichTextCommand | "|")[]} */
export const DEFAULT_TOOLBAR = [
  "undo",
  "redo",
  "|",
  "h2",
  "h3",
  "|",
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "|",
  "ul",
  "ol",
  "outdent",
  "indent",
  "|",
  "blockquote",
  "link",
  "|",
  "clear",
];

/**
 * The command a keydown triggers.
 *
 * @param {KeyboardEvent} event
 * @param {boolean} mac Whether the platform's modifier is Command.
 * @returns {RichTextCommand | undefined}
 */
export function commandForKey(event, mac) {
  const mod = mac
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  if (!mod) return undefined;
  for (const [name, spec] of Object.entries(COMMANDS)) {
    for (const shortcut of spec.shortcuts ?? []) {
      if ("mac" in shortcut && shortcut.mac !== mac) continue;
      if (!!shortcut.shift !== event.shiftKey) continue;
      if (!!shortcut.alt !== event.altKey) continue;
      if (
        shortcut.code
          ? event.code === shortcut.code
          : event.key.toLowerCase() === shortcut.key
      ) {
        return /** @type {RichTextCommand} */ (name);
      }
    }
  }
  return undefined;
}

const DIGIT_PREFIX = /^Digit/;

/** @type {Record<string, string>} */
const CODE_LABELS = { Backslash: "\\" };

/**
 * A command's shortcut as shown to people, for example `Ctrl+Shift+X` or
 * `⌘⇧X`.
 *
 * @param {RichTextCommand} command
 * @param {boolean} mac
 * @returns {string | undefined}
 */
export function shortcutLabel(command, mac) {
  const shortcut = (COMMANDS[command].shortcuts ?? []).find(
    (s) => !("mac" in s) || s.mac === mac,
  );
  if (!shortcut) return undefined;
  const key = shortcut.code
    ? (CODE_LABELS[shortcut.code] ?? shortcut.code.replace(DIGIT_PREFIX, ""))
    : (shortcut.key ?? "").toUpperCase();
  return mac
    ? `${shortcut.alt ? "⌥" : ""}${shortcut.shift ? "⇧" : ""}⌘${key}`
    : `Ctrl+${shortcut.alt ? "Alt+" : ""}${shortcut.shift ? "Shift+" : ""}${key}`;
}

/**
 * The value of `aria-keyshortcuts` for a command.
 *
 * @param {RichTextCommand} command
 * @param {boolean} mac
 * @returns {string | undefined}
 */
export function ariaShortcut(command, mac) {
  const shortcut = (COMMANDS[command].shortcuts ?? []).find(
    (s) => !("mac" in s) || s.mac === mac,
  );
  if (!shortcut) return undefined;
  const key = shortcut.code
    ? (CODE_LABELS[shortcut.code] ?? shortcut.code.replace(DIGIT_PREFIX, ""))
    : (shortcut.key ?? "").toUpperCase();
  return [
    mac ? "Meta" : "Control",
    shortcut.alt && "Alt",
    shortcut.shift && "Shift",
    key,
  ]
    .filter(Boolean)
    .join("+");
}
