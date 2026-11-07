<script context="module">
  const WHITESPACE = /\s+/;

  /**
   * @param {ReadonlyArray<"Tab" | "ArrowRight">} keys
   * @param {boolean} rtl
   * @param {boolean} word
   */
  function defaultHint(keys, rtl, word) {
    const names = keys.map((key) =>
      key === "Tab" ? "Tab" : `${rtl ? "Left" : "Right"} Arrow`,
    );
    const accept = names.length > 0 ? `${names.join(" or ")} accepts` : "";
    const next = word ? "Control or Option plus arrow accepts one word" : "";
    return `Suggestions appear as you type. ${[accept, next, "Escape dismisses"]
      .filter(Boolean)
      .join(". ")}.`;
  }
</script>

<script>
  /**
   * Passed to a function source with the text so far.
   * @typedef {object} InlineSuggestContext
   * @property {AbortSignal} signal - Aborts when the user types on, moves the caret, or leaves the field.
   */

  /**
   * @typedef {object} InlineSuggestAcceptDetail
   * @property {string} text - The text inserted.
   * @property {"all" | "word"} kind - Whether all of the suggestion was accepted, or one word of it.
   * @property {"Tab" | "ArrowRight" | "Word" | "Button"} key - How: Tab, the arrow along the line, Ctrl or Alt plus that arrow, or the tap target.
   */

  /**
   * @event {InlineSuggestAcceptDetail} accept
   * @event {{ suggestion: string }} dismiss
   */

  /**
   * The `<textarea>` or `<input>` to complete in.
   * Pass the `ref` of a `TextArea` or `TextInput`.
   * @type {null | HTMLTextAreaElement | HTMLInputElement}
   */
  export let field = null;

  /**
   * Where suggestions come from. An array of candidates, in priority order:
   * the first one the text so far is a prefix of is offered, so
   * `["gmail.com", "github.com"]` completes `g` to `gmail.com`. Or a
   * function `(value, { signal }) => string | Promise<string>` that returns
   * the text to offer after `value`, not the whole text. It runs after
   * `debounce` ms of quiet, and only the newest answer is used.
   * @type {ReadonlyArray<string> | ((value: string, context: InlineSuggestContext) => string | null | undefined | Promise<string | null | undefined>)}
   */
  export let source = [];

  /**
   * For an array source: complete only what follows the last occurrence
   * of this text. `"@"` offers domains for the part after the `@`.
   */
  export let after = "";

  /**
   * For an array source: how far back the text to complete reaches.
   * @type {"value" | "line" | "word"}
   */
  export let scope = "value";

  /** Characters the text (or, with `after`, the part to complete) needs before a suggestion is offered. */
  export let minLength = 1;

  /** Milliseconds of quiet before a function source is called. */
  export let debounce = 150;

  /** Match a candidate against what was typed without regard to case. The suggestion is the candidate's tail, so the user's casing stays. */
  export let ignoreCase = true;

  /**
   * The keys that accept the whole suggestion. `Tab` accepts only while a
   * suggestion shows, with the caret at the end; `ArrowRight` is the arrow
   * along the line (left in a right-to-left field). Pass `["ArrowRight"]`
   * to leave Tab to move focus.
   * @type {ReadonlyArray<"Tab" | "ArrowRight">}
   */
  export let acceptKeys = ["Tab", "ArrowRight"];

  /** Let Ctrl or Alt plus the arrow along the line accept one word. */
  export let acceptWord = true;

  /**
   * Show a button that accepts the suggestion, for devices with no Tab key.
   * `"auto"` shows it when the primary pointer is coarse.
   * @type {"auto" | boolean}
   */
  export let acceptButton = "auto";

  /**
   * The suggestion showing now, or an empty string.
   * @type {string}
   * @bindable readonly
   */
  export let suggestion = "";

  /**
   * Specify the hint a screen reader reads with the field.
   * Defaults to a sentence built from `acceptKeys`.
   * @type {string | undefined}
   */
  export let hintText = undefined;

  /**
   * Specify the text announced when a suggestion appears.
   * @type {(suggestion: string) => string}
   */
  export let suggestionText = (suggestion) => `Suggestion: ${suggestion}`;

  /** Specify the text announced after a suggestion is accepted */
  export let acceptedText = "Suggestion accepted";

  /** Specify the label of the accept button */
  export let acceptText = "Accept";

  /** Set an id for the hint */
  export let id = uniqueId();

  import { createEventDispatcher, onMount } from "svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import { debounce as debounced } from "../utils/debounce.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    followScroll,
    ghostShiftsTyped,
    paintGhost,
    placeGhostLayer,
  } from "./ghost-layer.js";
  import {
    appendedText,
    canSuggest,
    completeFromList,
    firstWord,
    fitMaxLength,
    fragmentBeforeCaret,
    keyAction,
    typeThrough,
  } from "./suggest-engine.js";
  import { createSuggestSource } from "./suggest-source.js";

  const dispatch = createEventDispatcher();

  let focused = false;
  let composing = false;
  let dismissed = false;
  let rtl = false;
  let announcement = "";
  /** The value the suggestion continues. A different value means it is stale. */
  let shownFor = "";
  /** The last value a request was made for, so a key that moves nothing asks nothing. */
  let askedFor = /** @type {string | null} */ (null);
  let prevValue = "";
  /** The hint id last added to the field's `aria-describedby`. */
  let applied = "";

  /** @type {null | HTMLTextAreaElement | HTMLInputElement} */
  let bound = null;
  /** @type {() => void} */
  let detach = () => {};

  /** @type {null | HTMLElement} */
  let frame = null;
  /** @type {null | HTMLElement} */
  let layer = null;
  /** @type {null | HTMLElement} */
  let typedNode = null;
  /** @type {null | HTMLElement} */
  let ghostNode = null;
  /** @type {null | HTMLButtonElement} */
  let chip = null;
  let raf = 0;

  const asker = createSuggestSource((text, value) => {
    const el = field;
    if (!el || el.value !== value || dismissed || !focused) return;
    if (!canSuggest(el, { composing })) return;
    show(text, true);
  });

  const announceStatus = createStatusAnnouncer((text) => {
    announcement = text;
  });

  const announce = debounced(
    /** @param {unknown} text */ (text) => {
      announceStatus(String(text));
    },
    400,
  );

  $: hint = hintText ?? defaultHint(acceptKeys, rtl, acceptWord);
  $: hintId = `${id}-hint`;
  $: bind(field, hintId);
  // A new source is a new question for the text already in the field.
  $: if (bound) ask(source, after, scope, minLength, ignoreCase);

  onMount(() => () => {
    detach();
    asker.cancel();
    announce.cancel();
  });

  /** @param {...unknown} _ */
  function ask(..._) {
    askedFor = null;
    request();
  }

  /**
   * @param {null | HTMLTextAreaElement | HTMLInputElement} el
   * @param {string} describedBy
   */
  function bind(el, describedBy) {
    if (el === bound && el !== null) {
      syncAria(el, describedBy);
      return;
    }
    detach();
    detach = () => {};
    bound = null;
    clear();
    if (!el || typeof window === "undefined") return;
    bound = el;

    prevValue = el.value;
    focused = el.ownerDocument.activeElement === el;
    syncAria(el, describedBy);

    const container =
      /** @type {HTMLElement | null} */ (el.offsetParent) ?? el.parentElement;
    const doc = el.ownerDocument;
    const host = doc.createElement("div");
    host.className = "bx--inline-suggest";
    host.hidden = true;
    const box = doc.createElement("div");
    box.className = "bx--inline-suggest__layer";
    box.setAttribute("aria-hidden", "true");
    const typed = doc.createElement("span");
    typed.className = "bx--inline-suggest__typed";
    const ghost = doc.createElement("span");
    ghost.className = "bx--inline-suggest__ghost";
    box.append(typed, ghost);
    const button = doc.createElement("button");
    button.type = "button";
    button.tabIndex = -1;
    button.hidden = true;
    button.className = "bx--inline-suggest__accept";
    // The button must not take focus from the field: the caret, the
    // keyboard on a phone and the suggestion all depend on it.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => accept("all", "Button"));
    host.append(box, button);
    container?.appendChild(host);
    frame = host;
    layer = box;
    typedNode = typed;
    ghostNode = ghost;
    chip = button;

    /** @type {Array<[string, EventListener, boolean]>} */
    const listeners = [
      ["input", /** @type {EventListener} */ (handleInput), false],
      ["keydown", /** @type {EventListener} */ (handleKeydown), true],
      ["keyup", handleCaret, false],
      ["click", handleCaret, false],
      ["select", handleCaret, false],
      ["focus", handleFocus, false],
      ["blur", handleBlur, false],
      ["scroll", handleScroll, false],
      ["compositionstart", handleCompositionStart, false],
      ["compositionend", handleCompositionEnd, false],
    ];
    for (const [type, fn, capture] of listeners) {
      el.addEventListener(type, fn, capture);
    }
    const stopResize = observeResize(el, () => {
      if (suggestion) place();
    });
    // `TextInput` and `TextArea` write `aria-describedby` again whenever
    // their helper or error text changes. Put the hint back.
    const watcher =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => syncAria(el, hintId));
    watcher?.observe(el, {
      attributes: true,
      attributeFilter: ["aria-describedby"],
    });

    detach = () => {
      for (const [type, fn, capture] of listeners) {
        el.removeEventListener(type, fn, capture);
      }
      stopResize();
      watcher?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      el.removeAttribute("aria-autocomplete");
      el.removeAttribute("data-ccs-inline-suggest");
      const tokens = (el.getAttribute("aria-describedby") ?? "")
        .split(WHITESPACE)
        .filter((token) => token && token !== hintId);
      if (tokens.length > 0)
        el.setAttribute("aria-describedby", tokens.join(" "));
      else el.removeAttribute("aria-describedby");
      host.remove();
      frame = layer = typedNode = ghostNode = chip = null;
    };
    request();
  }

  /**
   * `aria-autocomplete="inline"` is the ARIA 1.1 value for text that is
   * suggested after the caret, and a textbox may carry it. The hint joins
   * the field's own description.
   * @param {HTMLTextAreaElement | HTMLInputElement} el
   * @param {string} describedBy
   */
  function syncAria(el, describedBy) {
    if (el.getAttribute("aria-autocomplete") !== "inline") {
      el.setAttribute("aria-autocomplete", "inline");
    }
    const current = el.getAttribute("aria-describedby") ?? "";
    const tokens = current
      .split(WHITESPACE)
      .filter((token) => token && (token === describedBy || token !== applied));
    if (!tokens.includes(describedBy)) tokens.push(describedBy);
    applied = describedBy;
    const next = tokens.join(" ");
    if (next !== current) el.setAttribute("aria-describedby", next);
  }

  function place() {
    const el = field;
    if (!el || !frame || !layer) return;
    rtl = placeGhostLayer(el, frame, layer).rtl;
    frame.style.direction = layer.style.direction;
    frame.classList.toggle(
      "bx--inline-suggest--multiline",
      el.localName === "textarea",
    );
  }

  /**
   * @param {string} text
   * @param {boolean} [spoken=false] Whether to announce it.
   */
  function show(text, spoken = false) {
    const el = field;
    if (!el) return;
    const next = text ? fitMaxLength(text, el.value.length, el.maxLength) : "";
    if (!next) {
      clear();
      return;
    }
    const appeared = !suggestion;
    suggestion = next;
    shownFor = el.value;
    render(appeared);
    if (spoken && suggestion) announce(suggestionText(next));
  }

  /** @param {boolean} [appeared=false] */
  function render(appeared = false) {
    const el = field;
    if (!el || !frame || !layer || !typedNode || !ghostNode || !chip) return;
    if (!suggestion) {
      frame.hidden = true;
      chip.hidden = true;
      paintGhost(typedNode, ghostNode, "", "");
      el.removeAttribute("data-ccs-inline-suggest");
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (appeared || frame.hidden) {
      frame.hidden = false;
      place();
    }
    paintGhost(typedNode, ghostNode, el.value, suggestion);
    // A suggestion that would push the typed text off the field's own text
    // has no place to sit, so none is offered. The field is not the one
    // that moves, so nothing else could be shown in its stead.
    if (ghostShiftsTyped(typedNode, ghostNode)) {
      suggestion = "";
      render();
      return;
    }
    followScroll(el, layer);
    if (el.value === "") el.setAttribute("data-ccs-inline-suggest", "");
    else el.removeAttribute("data-ccs-inline-suggest");

    const wantsChip =
      acceptButton === true ||
      (acceptButton === "auto" &&
        typeof matchMedia === "function" &&
        matchMedia("(pointer: coarse)").matches);
    chip.hidden = !wantsChip;
    if (wantsChip) {
      chip.textContent = acceptText;
      chip.setAttribute("aria-label", `${acceptText}: ${suggestion}`);
    }
    if (!raf) raf = requestAnimationFrame(tickScroll);
  }

  // No event says an `<input>`'s scroll position changed, so while a
  // suggestion shows the layer reads it once a frame and writes only on a
  // change.
  function tickScroll() {
    raf = 0;
    if (!suggestion || !field || !layer) return;
    followScroll(field, layer);
    raf = requestAnimationFrame(tickScroll);
  }

  function clear() {
    if (suggestion) {
      suggestion = "";
      render();
    }
    announce.cancel();
    if (announcement) announcement = "";
  }

  function request() {
    const el = field;
    if (
      !el ||
      !bound ||
      !focused ||
      dismissed ||
      !canSuggest(el, { composing })
    ) {
      asker.cancel();
      askedFor = null;
      clear();
      return;
    }
    const value = el.value;
    if (value === askedFor) return;
    askedFor = value;

    if (typeof source === "function") {
      if (value.length < minLength) {
        asker.cancel();
        clear();
        return;
      }
      asker.ask(source, value, debounce);
      return;
    }
    asker.cancel();
    const fragment = fragmentBeforeCaret(value, value.length, { scope, after });
    const text =
      fragment === null
        ? ""
        : completeFromList(source, fragment, { ignoreCase, minLength });
    if (text !== suggestion) show(text, true);
  }

  /** @param {InputEvent} event */
  function handleInput(event) {
    const el = field;
    if (!el) return;
    const next = el.value;
    const inserted = appendedText(prevValue, next);
    prevValue = next;
    if (composing || event.isComposing) {
      asker.cancel();
      askedFor = null;
      clear();
      return;
    }
    dismissed = false;
    // Typing the suggestion keeps what is left of it, with no new request.
    if (suggestion && inserted !== null) {
      const rest = typeThrough(suggestion, inserted, ignoreCase);
      if (rest) {
        asker.cancel();
        suggestion = rest;
        shownFor = next;
        askedFor = next;
        render();
        return;
      }
    }
    clear();
    askedFor = null;
    request();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const el = field;
    if (!el || !suggestion || composing || isImeComposition(event)) return;
    if (el.value !== shownFor || !canSuggest(el)) {
      // Changed from code, or the caret moved off the end: the suggestion is stale.
      clear();
      askedFor = null;
      return;
    }
    const action = keyAction(event, { rtl, acceptKeys, acceptWord });
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action === "dismiss") {
      dismiss();
      return;
    }
    accept(
      action === "word" ? "word" : "all",
      action === "word" ? "Word" : event.key === "Tab" ? "Tab" : "ArrowRight",
    );
  }

  function dismiss() {
    const text = suggestion;
    dismissed = true;
    asker.cancel();
    askedFor = null;
    clear();
    dispatch("dismiss", { suggestion: text });
  }

  /**
   * @param {"all" | "word"} kind
   * @param {"Tab" | "ArrowRight" | "Word" | "Button"} key
   */
  function accept(kind, key) {
    const el = field;
    if (!el || !suggestion || el.value !== shownFor) return;
    const text = kind === "word" ? firstWord(suggestion) : suggestion;
    if (!text) return;
    // The text goes in as typing would, so the browser's undo takes it back
    // and the field's own `input` handlers (and `bind:value`) see it. The
    // `input` event runs `handleInput`, which keeps what is left of a word.
    el.focus({ preventScroll: true });
    insertText(el, text);
    announce.cancel();
    announceStatus(acceptedText);
    dispatch("accept", { text, kind, key });
  }

  /**
   * `execCommand` is deprecated yet is the only way to edit a field and
   * keep its undo stack. Where it does nothing, the value is written and an
   * `input` event follows.
   * @param {HTMLTextAreaElement | HTMLInputElement} el
   * @param {string} text
   */
  function insertText(el, text) {
    const start = el.value.length;
    el.setSelectionRange(start, start);
    let done = false;
    try {
      done =
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, text);
    } catch {
      done = false;
    }
    if (done && el.value.length > start) return;
    el.setRangeText(text, start, start, "end");
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text,
      }),
    );
  }

  // The caret moved or the field was clicked: the end of the text is the
  // only place a suggestion belongs.
  function handleCaret() {
    const el = field;
    if (!el || composing) return;
    if (suggestion && !canSuggest(el)) {
      clear();
      askedFor = null;
    } else if (!suggestion) {
      request();
    }
  }

  function handleFocus() {
    focused = true;
    prevValue = field?.value ?? "";
    askedFor = null;
    request();
  }

  function handleBlur() {
    focused = false;
    asker.cancel();
    askedFor = null;
    dismissed = false;
    clear();
  }

  function handleScroll() {
    if (suggestion && field && layer) followScroll(field, layer);
  }

  // The IME draws its own candidates at the caret. Nothing is suggested,
  // and no key is taken, until it commits.
  function handleCompositionStart() {
    composing = true;
    asker.cancel();
    askedFor = null;
    clear();
  }

  function handleCompositionEnd() {
    composing = false;
    prevValue = field?.value ?? "";
    askedFor = null;
    request();
  }
</script>

<span id={hintId} class:bx--visually-hidden={true}>{hint}</span>
<div class:bx--visually-hidden={true} aria-live="polite" aria-atomic="true">
  {announcement}
</div>
