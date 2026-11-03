// @ts-check

import { applyMaskEdit, conformMaskText, createMask } from "./input-mask.js";

/**
 * @typedef {import("./input-mask.js").MaskChange} MaskChange
 * @typedef {import("./mask.js").MaskParams} MaskParams
 * @typedef {HTMLInputElement | HTMLTextAreaElement} Field
 * @typedef {{ value: string, start: number, end: number }} Snapshot
 * @typedef {{
 *   composing: boolean,
 *   snapshot: Snapshot | null,
 *   pending: MaskChange | null,
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
 * left to the browser and re-masked once they have happened.
 * @param {InputEvent} event
 * @returns {MaskChange | null}
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
 * Svelte action: mask what is typed into a text field.
 *
 * Put it on the `<input>`, or on any element around one or more fields,
 * such as the `<div>` that wraps a `TextInput`: the action listens on the
 * element and acts on the fields inside it, so it needs no `bind:ref` and
 * survives a component handing its ref over again.
 *
 * Edits are taken in `beforeinput` and applied as one edit that the browser
 * records, so undo and redo keep working. What the browser edited by itself
 * (IME, drop, spell-check, a keyboard whose `beforeinput` cannot be
 * canceled) is re-masked afterwards. SSR-safe: nothing runs until mount.
 *
 * @param {HTMLElement} node
 * @param {MaskParams} params
 * @returns {{ update: (params: MaskParams) => void, destroy: () => void }}
 */
export function mask(node, params) {
  let options = params;
  let spec = createMask(options).options;
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
    const result = createMask(spec).format(field.value);
    const state = stateOf(field);
    const key = `${result.value}\u0000${result.rawValue}\u0000${result.complete}`;
    if (state.reported === key) return;
    state.reported = key;
    options.onchange?.({ ...result, field });
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
   * Re-mask whatever the field holds. True if it had to change.
   * @param {Field} field
   */
  function normalize(field) {
    const start = field.selectionStart ?? field.value.length;
    const result = conformMaskText(spec, field.value, start);
    const focused = field.ownerDocument.activeElement === field;
    if (result.value === field.value) {
      report(field);
      return false;
    }
    commit(field, result.value, focused ? result.caret : null);
    return true;
  }

  /**
   * @param {Field} field
   * @param {MaskChange} change
   * @param {Snapshot} snapshot
   */
  function edit(field, change, snapshot) {
    const result = applyMaskEdit(spec, snapshot, change);
    if (!result.changed) return;
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
    // Capture phase: a fix goes out as its own event, and the unmasked one
    // never reaches the component.
    if (normalize(field)) event.stopImmediatePropagation();
  }

  /** @param {Event} event */
  function onCompositionStart(event) {
    const field = fieldOf(event.target);
    if (field) stateOf(field).composing = true;
  }

  /** @param {Event} event */
  function onCompositionEnd(event) {
    const field = fieldOf(event.target);
    if (!field) return;
    stateOf(field).composing = false;
    normalize(field);
  }

  /** @param {Event} event */
  function onSettle(event) {
    const field = fieldOf(event.target);
    if (field && !applying && !stateOf(field).composing) normalize(field);
  }

  /** Attributes the mask owns while it is on, only where the field has none. @param {Field} field */
  function setAttributes(field) {
    const state = stateOf(field);
    clearAttributes(field);
    /** @type {Record<string, string>} */
    const wanted = { spellcheck: "false", "data-ccs-mask": "" };
    if (createMask(spec).isNumeric()) wanted.inputmode = "numeric";
    for (const [name, value] of Object.entries(wanted)) {
      if (field.hasAttribute(name)) continue;
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
    ["focusin", onSettle, true],
    ["focusout", onSettle, true],
    ["change", onSettle, true],
  ];
  for (const [type, handler, capture] of listeners) {
    node.addEventListener(type, handler, capture);
  }

  for (const field of fields()) {
    setAttributes(field);
    normalize(field);
  }

  return {
    update(next) {
      const was = spec;
      options = next;
      spec = createMask(next).options;
      const changed =
        was.pattern !== spec.pattern || !!was.eager !== !!spec.eager;
      for (const field of fields()) {
        setAttributes(field);
        if (changed) {
          stateOf(field).reported = null;
          normalize(field);
        }
      }
    },
    destroy() {
      for (const [type, handler, capture] of listeners) {
        node.removeEventListener(type, handler, capture);
      }
      for (const field of fields()) clearAttributes(field);
    },
  };
}
