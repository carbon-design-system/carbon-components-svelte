// @ts-check
// The binding half of the keyboard shortcuts: the window listener, key
// matching, and the guards for fields, modals and IME. Components load it
// on demand, only when they have a `shortcut` (see `lazyKeyboardShortcut`),
// so an app with no shortcut never ships it.
import { isImeComposition } from "./ime-composition.js";
import { isApplePlatform, parseShortcut } from "./keyboard-shortcut.js";
import { isModalDialog } from "./modal-dialog.js";
import { noop } from "./noop.js";
import { addPooledListener } from "./window-listener-pool.js";

const ALPHANUMERIC = /[a-z0-9]/;
const LATIN_KEY = /^[a-z0-9]$/;
const LETTER = /^[a-z]$/;
const DIGIT = /^[0-9]$/;
const NON_TEXT_INPUT =
  /^(button|checkbox|radio|range|reset|submit|color|file|image)$/;

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
