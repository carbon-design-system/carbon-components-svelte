// @ts-check

import { createNumberFormat } from "./number-format.js";

/**
 * @typedef {import("./number-format.js").NumberChange} NumberChange
 * @typedef {import("./number-field.js").NumberFieldParams} NumberFieldParams
 * @typedef {HTMLInputElement | HTMLTextAreaElement} Field
 * @typedef {{ value: string, start: number, end: number }} Snapshot
 * @typedef {{
 *   composing: boolean,
 *   snapshot: Snapshot | null,
 *   pending: NumberChange | null,
 *   composition: Snapshot | null,
 *   reported: string | null,
 *   added: string[],
 * }} FieldState
 */

// Types with a selection API. `email` and `number` fields have none.
const TEXT_TYPES = new Set(["text", "tel", "search", "url", "password"]);

/** @param {unknown} el @returns {el is Field} */
function isField(el) {
  if (!el || typeof el !== "object") return false;
  const { tagName, type } = /** @type {Field} */ (el);
  return (
    tagName === "TEXTAREA" || (tagName === "INPUT" && TEXT_TYPES.has(type))
  );
}

/**
 * The edit a `beforeinput` stands for, or `null` for the ones the engine
 * does not map (a drop, a spell-check replacement, a composition). Those are
 * left to the browser and read again once they have happened.
 * @param {InputEvent} event
 * @returns {NumberChange | null}
 */
function toChange(event) {
  const back = /** @type {const} */ ("backward");
  const fwd = /** @type {const} */ ("forward");
  switch (event.inputType) {
    case "insertText":
    case "insertFromPaste":
    case "insertFromPasteAsQuotation": {
      const text = event.data ?? event.dataTransfer?.getData("text/plain");
      return typeof text === "string" ? { type: "insert", text } : null;
    }
    case "deleteContentBackward":
    case "deleteByCut":
      return { type: "delete", direction: back, unit: "char" };
    case "deleteContentForward":
      return { type: "delete", direction: fwd, unit: "char" };
    case "deleteWordBackward":
      return { type: "delete", direction: back, unit: "word" };
    case "deleteWordForward":
      return { type: "delete", direction: fwd, unit: "word" };
    case "deleteSoftLineBackward":
    case "deleteHardLineBackward":
      return { type: "delete", direction: back, unit: "line" };
    case "deleteSoftLineForward":
    case "deleteHardLineForward":
      return { type: "delete", direction: fwd, unit: "line" };
    default:
      return null;
  }
}

/**
 * Svelte action: format the number typed into a text field for a locale,
 * with its grouping, decimal mark, currency or unit, as it is typed.
 *
 * Put it on the `<input>`, or on any element around one or more fields, such
 * as the `<div>` that wraps a `TextInput`: the action listens on the element
 * and acts on the fields inside it, so it needs no `bind:ref` and survives a
 * component handing its ref over again.
 *
 * The caret is kept among the digits, so typing in the middle, Backspace
 * across a group mark and a selection replace all land where a person expects.
 * Edits are taken in `beforeinput` and applied as one edit that the browser
 * records, so undo and redo keep working. Nothing is touched while an IME
 * composes; the text is read again when it ends. A field left with `1.5` in
 * it is written `1.50` when the format asks for two fraction digits.
 * SSR-safe: nothing runs until mount.
 *
 * @param {HTMLElement} node
 * @param {NumberFieldParams} params
 * @returns {{ update: (params: NumberFieldParams) => void, destroy: () => void }}
 */
export function numberFormat(node, params) {
  let options = params;
  let spec = createNumberFormat(options);
  let applying = false;

  /** @type {WeakMap<Field, FieldState>} */
  const states = new WeakMap();

  /** @param {Field} field */
  function stateOf(field) {
    let state = states.get(field);
    if (!state) {
      state = {
        composing: false,
        snapshot: null,
        pending: null,
        composition: null,
        reported: null,
        added: [],
      };
      states.set(field, state);
    }
    return state;
  }

  /** @param {EventTarget | null} target @returns {Field | null} */
  function fieldOf(target) {
    if (!isField(target) || !node.contains(target)) return null;
    const selector = options.selector;
    if (selector && target !== node && !target.matches(selector)) return null;
    return target;
  }

  /** @returns {Field[]} */
  function fields() {
    if (isField(node)) return [node];
    return Array.from(
      node.querySelectorAll(options.selector ?? "input, textarea"),
    ).filter(isField);
  }

  /** @param {Field} field */
  function report(field) {
    const { raw } = spec.scan(field.value);
    const value = spec.toValue(raw);
    const state = stateOf(field);
    if (state.reported === `${value}\u0000${field.value}`) return;
    state.reported = `${value}\u0000${field.value}`;
    options.onchange?.({
      value,
      number: value === "" ? null : Number(value),
      text: field.value,
      field,
    });
  }

  /**
   * Write `next` as the smallest edit that gets there, through
   * `execCommand` so the browser's undo stack records it and the field
   * fires the `input` event a typed character would. Where `execCommand`
   * does nothing (an unfocused field, jsdom) the value is set and the
   * event dispatched.
   * @param {Field} field
   * @param {string} next
   * @param {number | null} caret
   */
  function commit(field, next, caret) {
    const prev = field.value;
    if (prev !== next) {
      const limit = Math.min(prev.length, next.length);
      let head = 0;
      while (head < limit && prev[head] === next[head]) head++;
      let tail = 0;
      while (
        tail < limit - head &&
        prev[prev.length - 1 - tail] === next[next.length - 1 - tail]
      ) {
        tail++;
      }
      const text = next.slice(head, next.length - tail);
      applying = true;
      try {
        field.setSelectionRange(head, prev.length - tail);
        let done = false;
        try {
          done =
            typeof document.execCommand === "function" &&
            document.execCommand(text ? "insertText" : "delete", false, text);
        } catch {
          done = false;
        }
        if (!done || field.value !== next) {
          const changed = field.value !== next;
          field.value = next;
          if (changed) {
            field.dispatchEvent(
              new InputEvent("input", {
                bubbles: true,
                inputType: text
                  ? "insertReplacementText"
                  : "deleteContentBackward",
                data: text || null,
              }),
            );
          }
        }
      } finally {
        applying = false;
      }
    }
    if (caret !== null && field.ownerDocument.activeElement === field) {
      field.setSelectionRange(caret, caret);
    }
    report(field);
  }

  /**
   * Read whatever the field holds again and write it in the format. True if
   * it had to change. `final` is for a field that is being left.
   * @param {Field} field
   * @param {boolean} [final]
   */
  function normalize(field, final = false) {
    const start = field.selectionStart ?? field.value.length;
    const result = spec.conform(field.value, start, final);
    const focused = field.ownerDocument.activeElement === field;
    if (result.value === field.value) {
      report(field);
      return false;
    }
    commit(field, result.value, focused && !final ? result.caret : null);
    return true;
  }

  /**
   * @param {Field} field
   * @param {NumberChange} change
   * @param {Snapshot} snapshot
   */
  function edit(field, change, snapshot) {
    const result = spec.applyEdit(snapshot, change);
    if (!result.changed) {
      // Refused, or only the caret moves (over a decimal mark).
      if (field.ownerDocument.activeElement === field) {
        field.setSelectionRange(result.caret, result.caret);
      }
      return;
    }
    commit(field, result.value, result.caret);
  }

  /** @param {Event} raw */
  function onBeforeInput(raw) {
    const event = /** @type {InputEvent} */ (raw);
    const field = fieldOf(event.target);
    if (!field || applying || field.readOnly || field.disabled) return;
    const state = stateOf(field);
    state.pending = null;
    state.snapshot = null;
    if (
      state.composing ||
      event.isComposing ||
      event.inputType.includes("Composition")
    ) {
      return;
    }
    const change = toChange(event);
    if (!change) return;
    const snapshot = {
      value: field.value,
      start: Math.min(field.selectionStart ?? 0, field.selectionEnd ?? 0),
      end: Math.max(field.selectionStart ?? 0, field.selectionEnd ?? 0),
    };
    if (!event.cancelable) {
      // Some Android keyboards: let the browser edit, then undo and redo it.
      state.snapshot = snapshot;
      state.pending = change;
      return;
    }
    event.preventDefault();
    edit(field, change, snapshot);
  }

  /** @param {Event} raw */
  function onInput(raw) {
    const event = /** @type {InputEvent} */ (raw);
    const field = fieldOf(event.target);
    if (!field || applying) return;
    const state = stateOf(field);
    if (state.composing || event.isComposing) return;
    const { pending, snapshot } = state;
    state.pending = null;
    state.snapshot = null;
    if (pending && snapshot) {
      // The edit is already in the field: take the event away from the
      // component, put the old text back and make the edit again.
      event.stopImmediatePropagation();
      field.value = snapshot.value;
      edit(field, pending, snapshot);
      return;
    }
    // Capture phase: a fix goes out as its own event, and the unformatted
    // one never reaches the component.
    if (normalize(field)) event.stopImmediatePropagation();
  }

  /**
   * What a composition put in the field, given the text and selection it
   * started from. `null` when the field no longer has the text around it.
   * @param {Snapshot} before
   * @param {string} now
   * @returns {string | null}
   */
  function composed(before, now) {
    const head = before.value.slice(0, before.start);
    const tail = before.value.slice(before.end);
    if (
      now.length < head.length + tail.length ||
      !now.startsWith(head) ||
      !now.endsWith(tail)
    ) {
      return null;
    }
    return now.slice(head.length, now.length - tail.length);
  }

  /** @param {Event} event */
  function onCompositionStart(event) {
    const field = fieldOf(event.target);
    if (!field) return;
    const state = stateOf(field);
    state.composing = true;
    state.composition = {
      value: field.value,
      start: Math.min(field.selectionStart ?? 0, field.selectionEnd ?? 0),
      end: Math.max(field.selectionStart ?? 0, field.selectionEnd ?? 0),
    };
  }

  /**
   * An IME is done, or Firefox, which delivers some plain `insertText`
   * edits (a paste, a key) as a composition. What it put in the field is
   * taken as the text of one insert at the selection it started from, so
   * `1e5` pasted into a number field is refused, as it is in Chromium.
   * @param {Event} event
   */
  function onCompositionEnd(event) {
    const field = fieldOf(event.target);
    if (!field) return;
    const state = stateOf(field);
    const before = state.composition;
    state.composing = false;
    state.composition = null;
    const text = before ? composed(before, field.value) : null;
    if (before && text !== null && !field.readOnly && !field.disabled) {
      applying = true;
      try {
        field.value = before.value;
      } finally {
        applying = false;
      }
      edit(field, { type: "insert", text }, before);
      return;
    }
    normalize(field);
  }

  /** Focus: format what is there. @param {Event} event */
  function onFocusIn(event) {
    const field = fieldOf(event.target);
    if (field && !applying && !stateOf(field).composing) normalize(field);
  }

  /**
   * Leaving the field, or its `change` (which comes first, and is captured
   * here before the component sees it): pad the fraction digits.
   * @param {Event} event
   */
  function onSettle(event) {
    const field = fieldOf(event.target);
    if (field && !applying && !stateOf(field).composing) normalize(field, true);
  }

  /** Attributes the format owns while it is on, only where the field has none. @param {Field} field */
  function setAttributes(field) {
    const state = stateOf(field);
    clearAttributes(field);
    // The decimal pad has no minus key on iOS, so a field that takes a
    // negative number asks for the full keyboard.
    /** @type {Record<string, string>} */
    const wanted = {
      spellcheck: "false",
      autocomplete: "off",
      inputmode: spec.allowNegative ? "text" : "decimal",
      "data-ccs-number-format": spec.direction,
    };
    for (const [name, value] of Object.entries(wanted)) {
      if (name !== "data-ccs-number-format" && field.hasAttribute(name))
        continue;
      field.setAttribute(name, value);
      state.added.push(name);
    }
  }

  /** @param {Field} field */
  function clearAttributes(field) {
    const state = stateOf(field);
    for (const name of state.added) field.removeAttribute(name);
    state.added = [];
  }

  /** @type {Array<[string, EventListener, boolean]>} */
  const listeners = [
    ["beforeinput", onBeforeInput, true],
    ["input", onInput, true],
    ["compositionstart", onCompositionStart, true],
    ["compositionend", onCompositionEnd, true],
    ["focusin", onFocusIn, true],
    ["focusout", onSettle, true],
    ["change", onSettle, true],
  ];
  for (const [type, handler, capture] of listeners) {
    node.addEventListener(type, handler, capture);
  }

  /** A field that is not focused is shown as it is when left. */
  function settleAll() {
    for (const field of fields()) {
      setAttributes(field);
      normalize(field, field.ownerDocument.activeElement !== field);
    }
  }
  settleAll();

  return {
    update(next) {
      options = next;
      spec = createNumberFormat(next);
      for (const field of fields()) stateOf(field).reported = null;
      settleAll();
    },
    destroy() {
      for (const [type, handler, capture] of listeners) {
        node.removeEventListener(type, handler, capture);
      }
      for (const field of fields()) clearAttributes(field);
    },
  };
}
