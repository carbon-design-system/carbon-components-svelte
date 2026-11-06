// @ts-check

import { isImeComposition } from "./ime-composition.js";
import { isApplePlatform, matchesShortcut } from "./keyboard-shortcut.js";

const NON_TEXT_INPUT =
  /^(button|checkbox|radio|range|reset|submit|color|file|image)$/;

const UNDO_KEYS = ["mod+z"];
// Control+Y is Redo on Windows and Linux. On macOS it is the Emacs "yank"
// binding that text fields use, so it is not bound there.
const REDO_KEYS_APPLE = ["mod+shift+z"];
const REDO_KEYS_OTHER = ["mod+shift+z", "ctrl+y"];

/**
 * Whether the browser keeps an undo stack for this element: a text input, a
 * textarea or an editable region. A read-only field has none, and neither do
 * a checkbox, a select or a button.
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function hasNativeUndo(target) {
  const element = /** @type {HTMLElement | null} */ (target);
  const tag = element?.tagName;
  if (!tag) return false;
  if (tag === "TEXTAREA") {
    return !(/** @type {HTMLTextAreaElement} */ (element).readOnly);
  }
  if (tag === "INPUT") {
    const input = /** @type {HTMLInputElement} */ (element);
    return !input.readOnly && !NON_TEXT_INPUT.test(input.type);
  }
  return !!element.isContentEditable;
}

/**
 * @param {unknown} value
 * @returns {value is import("./history.d.ts").History}
 */
function isHistory(value) {
  return typeof (/** @type {any} */ (value)?.undo) === "function";
}

/**
 * Svelte action: bind undo and redo to the keyboard inside `node`.
 *
 * Undo is Mod+Z, where Mod is Command on macOS and Control elsewhere. Redo
 * is Mod+Shift+Z, plus Control+Y on Windows and Linux. A handled key calls
 * `preventDefault`, so the browser's own undo stays out of the way.
 *
 * Text fields have a native undo of their own, and the `fields` option
 * decides who wins there: `"native"` (default) leaves the key to the browser;
 * `"fallthrough"` lets the browser try first and runs the app's undo when it
 * had nothing to undo; `"app"` always runs the app's, for fields whose edits
 * the history records. Outside a field the app always handles the key.
 * Keys pressed during an IME composition, or already handled with
 * `preventDefault`, are left alone. A held key repeats.
 *
 * The keys reach `node` only while focus is inside it. Removing or moving the
 * focused element drops focus to the page, so set `scope: "document"` for a
 * history that owns the whole page. SSR-safe: actions only run in the browser.
 *
 * @param {HTMLElement} node
 * @param {import("./history.d.ts").History | import("./history-keys.d.ts").HistoryKeysOptions} params
 * @returns {{ update: (params: import("./history.d.ts").History | import("./history-keys.d.ts").HistoryKeysOptions) => void, destroy: () => void }}
 */
export function historyKeys(node, params) {
  /** @type {import("./history-keys.d.ts").HistoryKeysOptions} */
  let options = normalize(params);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {(() => void) | undefined} */
  let stopWatching;

  /**
   * @param {import("./history.d.ts").History | import("./history-keys.d.ts").HistoryKeysOptions} next
   * @returns {import("./history-keys.d.ts").HistoryKeysOptions}
   */
  function normalize(next) {
    return isHistory(next)
      ? { history: next }
      : /** @type {import("./history-keys.d.ts").HistoryKeysOptions} */ (next);
  }

  function clearPending() {
    clearTimeout(timer);
    stopWatching?.();
    stopWatching = undefined;
  }

  /**
   * Let the browser try, then run the app's step if it did not. A native
   * undo fires `beforeinput` before the task ends; an empty stack fires
   * nothing. Chromium and WebKit keep one undo stack for the whole page, so
   * the event may land on another field, which is why this listens on the
   * document and not on the focused field.
   * @param {boolean} undo
   */
  function fallThrough(undo) {
    clearPending();
    const doc = node.ownerDocument;
    let handledNatively = false;
    /** @param {Event} event */
    const watch = (event) => {
      const { inputType } = /** @type {InputEvent} */ (event);
      if (inputType === "historyUndo" || inputType === "historyRedo") {
        handledNatively = true;
      }
    };
    doc.addEventListener("beforeinput", watch, true);
    stopWatching = () => doc.removeEventListener("beforeinput", watch, true);
    timer = setTimeout(() => {
      clearPending();
      if (!handledNatively) run(undo);
    }, 0);
  }

  /** @param {boolean} undo */
  function run(undo) {
    const { history } = options;
    if (undo) history.undo();
    else history.redo();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || isImeComposition(event)) return;
    const apple = isApplePlatform();
    const undo = matchesShortcut(event, options.undoKeys ?? UNDO_KEYS, {
      apple,
    });
    const redo =
      !undo &&
      matchesShortcut(
        event,
        options.redoKeys ?? (apple ? REDO_KEYS_APPLE : REDO_KEYS_OTHER),
        { apple },
      );
    if (!undo && !redo) return;

    const target = event.composedPath?.()[0] ?? event.target;
    if (hasNativeUndo(target)) {
      const fields = options.fields ?? "native";
      if (fields === "native") return;
      if (fields === "fallthrough") {
        fallThrough(undo);
        return;
      }
    }
    event.preventDefault();
    run(undo);
  }

  /** @type {EventTarget} */
  let listening = target();
  const listener = /** @type {EventListener} */ (
    /** @type {unknown} */ (handleKeydown)
  );
  listening.addEventListener("keydown", listener);

  function target() {
    return options.scope === "document" ? node.ownerDocument : node;
  }

  return {
    update(next) {
      options = normalize(next);
      const now = target();
      if (now === listening) return;
      listening.removeEventListener("keydown", listener);
      listening = now;
      listening.addEventListener("keydown", listener);
    },
    destroy() {
      clearPending();
      listening.removeEventListener("keydown", listener);
    },
  };
}
