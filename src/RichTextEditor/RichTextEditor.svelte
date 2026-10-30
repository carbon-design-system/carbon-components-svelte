<script>
  /**
   * @event {string} input - Dispatched on each edit with the new HTML.
   * @event {string} change - Dispatched with the HTML when the editor loses focus after an edit.
   * @slot {{}} labelChildren
   * @restProps {div}
   */

  /**
   * Specify the content as HTML. The editor keeps to `p`, `h2`, `h3`,
   * `blockquote`, `ul`, `ol`, `li`, `br`, `strong`, `em`, `u`, `s`, `code`
   * and `a[href]`: anything else is dropped or unwrapped when it goes in.
   * Sanitize on the server too: a form post never passes through the editor.
   * Follows the field when the owning form resets.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the size of the field.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Choose the toolbar's commands, in order, with `"|"` between groups. A
   * command left out has no button and no keyboard shortcut. Use `false` for
   * an editor with no formatting.
   * @type {readonly (import("./commands.js").RichTextCommand | "|")[] | false}
   */
  export let toolbar = DEFAULT_TOOLBAR;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the number of rows the field is tall at least */
  export let rows = 4;

  /**
   * Maximum number of rows before the field scrolls.
   * Unset means the field grows without a cap.
   * @type {number | undefined}
   */
  export let maxRows = undefined;

  /**
   * Specify the max count.
   * Counts characters by default; see `counterMode`.
   * The editor does not stop typing at the limit; it flags the count.
   * @type {number | undefined}
   */
  export let maxCount = undefined;

  /**
   * Specify what `maxCount` limits.
   * @type {"character" | "word"}
   */
  export let counterMode = "character";

  /**
   * Override the counter text read by screen readers.
   * @type {((count: number, max: number) => string) | undefined}
   * @default `${count} of ${max} characters`, or `${count} of ${max} words` when `counterMode` is `"word"`
   */
  export let counterText = undefined;

  /** Set to `true` to disable the editor and its toolbar */
  export let disabled = false;

  /** Set to `true` to use the read-only variant, which has no toolbar */
  export let readonly = false;

  /** Set to `true` to require some text before the form can submit */
  export let required = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the text for the invalid state */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the message shown when `required` blocks a form with no text */
  export let requiredText = "Enter some text";

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Specify the accessible name of the toolbar */
  export let toolbarLabelText = "Text formatting";

  /**
   * Rename toolbar buttons.
   * @type {Partial<Record<import("./commands.js").RichTextCommand, string>>}
   */
  export let commandText = {};

  /**
   * Replace the text of the link dialog.
   * @type {Partial<{ label: string; urlLabel: string; textLabel: string; apply: string; remove: string; invalid: string }>}
   */
  export let linkText = {};

  /** Set an id for the editable element */
  export let id = uniqueId();

  /**
   * Specify a name to submit the HTML with the form.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the editable element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { graphemeCount } from "../utils/grapheme-count.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { wordCount } from "../utils/word-count.js";
  import RichTextEditorToolbar from "./RichTextEditorToolbar.svelte";
  import { commandForKey, DEFAULT_TOOLBAR } from "./commands.js";
  import {
    closestTextBlock,
    createEditing,
    getRange,
    restoreSelection,
    saveSelection,
  } from "./editing.js";
  import { createHistory } from "./history.js";
  import {
    htmlToText,
    isEmptyHtml,
    normalizeHref,
    sanitizeHtml,
    textToHtml,
  } from "./sanitize.js";

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);

  const APPLE_PLATFORM = /Mac|iPhone|iPad/i;

  const DEFAULT_LINK_TEXT = {
    label: "Link",
    urlLabel: "URL",
    textLabel: "Text",
    apply: "Apply",
    remove: "Remove link",
    invalid: "Enter a valid URL",
  };

  // The server renders this, and the browser parses it once before the editor
  // takes the element over. Not reactive: `value` changes reach the DOM
  // through `syncFromValue`, never through Svelte.
  const initialHtml = sanitizeHtml(value);
  // Restored when the owning form resets.
  const initialValue = value;

  /** The sanitized HTML the DOM holds, as last read from it. */
  let currentHtml = initialHtml;
  /** The last string written to `value`, or read from it. */
  let lastValue = value;
  let empty = isEmptyHtml(initialHtml);
  let mounted = false;
  let focused = false;
  let composing = false;
  let mac = false;
  /** A value that arrived mid-composition, applied when it ends. */
  let deferredValue = /** @type {string | undefined} */ (undefined);
  let valueAtFocus = value;
  let requiredInvalid = false;
  let canUndo = false;
  let canRedo = false;
  let active = /** @type {Set<string>} */ (new Set());

  let linkOpen = false;
  let linkExisting = false;
  let linkAskText = false;
  let linkHref = "";
  let linkLabel = "";
  let linkInvalid = false;
  /** @type {null | import("./editing.js").SavedSelection} */
  let linkSelection = null;
  /** @type {null | HTMLElement} */
  let linkReturnFocus = null;

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLInputElement} */
  let validityRef = null;
  /** @type {null | ReturnType<typeof createEditing>} */
  let editing = null;
  /** @type {null | import("./editing.js").SavedSelection} */
  let savedSelection = null;
  /** @type {boolean} */
  let draggingInside = false;
  let frame = 0;

  /** @type {import("./history.js").History<{ html: string; selection: import("./editing.js").SavedSelection | null }>} */
  const history = createHistory();

  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);
  $: isFluid = fluid || !!formContext?.isFluid;
  $: interactive = !disabled && !readonly;
  $: items = toolbar === false ? [] : toolbar;
  $: allowed = new Set(items.filter((item) => item !== "|"));
  $: showToolbar = allowed.size > 0 && !readonly;
  // Toolbar buttons fill the toolbar, which is as tall as the field's size.
  /** @type {"xs" | "small" | "field" | "default"} */
  let buttonSize = "field";
  $: buttonSize =
    effectiveSize === "xs"
      ? "xs"
      : effectiveSize === "sm"
        ? "small"
        : effectiveSize === "xl"
          ? "default"
          : "field";
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: labelId = `label-${id}`;
  $: counterId = `counter-${id}`;
  $: hasMaxCount = typeof maxCount === "number";
  $: count = hasMaxCount ? measure(currentHtml, counterMode) : 0;
  $: overCount =
    typeof maxCount === "number" && count > maxCount && interactive;
  $: resolvedCounterText =
    counterText ??
    ((c, m) =>
      `${c} of ${m} ${counterMode === "word" ? "words" : "characters"}`);
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || requiredInvalid,
    warn,
    disabled,
    readonly,
  }));
  $: statusText = invalid ? invalidText : requiredInvalid ? requiredText : "";
  $: describedBy = joinDescribedBy(
    resolveStatusDescribedBy({
      showInvalid,
      showWarn,
      invalidText: statusText,
      warnText,
      helperText,
      isFluid,
      errorId,
      warnId,
      helperId,
      includeErrorId: false,
    }),
    hasMaxCount && counterId,
    $$restProps["aria-describedby"],
  );
  $: resolvedLinkText = { ...DEFAULT_LINK_TEXT, ...linkText };
  $: ariaLabel = $$restProps["aria-label"];

  /**
   * @param {string} html
   * @param {"character" | "word"} mode
   */
  function measure(html, mode) {
    const text = htmlToText(html);
    return mode === "word" ? wordCount(text) : graphemeCount(text);
  }

  $: syncFromValue(value);

  /** @param {string} next */
  function syncFromValue(next) {
    if (!mounted || !ref || next === lastValue) return;
    if (composing) {
      deferredValue = next;
      return;
    }
    lastValue = next;
    deferredValue = undefined;
    write(sanitizeHtml(next));
    history.clear();
    syncHistoryFlags();
  }

  /**
   * Replace the document, keeping the caret near where it was.
   * @param {string} html
   */
  function write(html) {
    if (!ref) return;
    const selection = focused ? saveSelection(ref) : null;
    ref.innerHTML = html || "<p><br></p>";
    if (selection) restoreSelection(ref, selection);
    currentHtml = html;
    empty = html === "";
    refreshState();
  }

  function syncHistoryFlags() {
    canUndo = history.canUndo();
    canRedo = history.canRedo();
  }

  function capture() {
    return {
      html: /** @type {HTMLElement} */ (ref).innerHTML,
      selection: ref ? saveSelection(ref) : null,
    };
  }

  /**
   * The top-level block the caret is in.
   * @returns {Element | null}
   */
  function caretBlock() {
    const anchor = ref && window.getSelection()?.anchorNode;
    if (!ref || !anchor || !ref.contains(anchor)) return null;
    let node = anchor;
    while (node.parentNode && node.parentNode !== ref) node = node.parentNode;
    return node.parentNode === ref && node.nodeType === 1
      ? /** @type {Element} */ (node)
      : null;
  }

  /**
   * Tidy the DOM after an edit and report the new HTML.
   * @param {boolean} [full] Check every block, not only the caret's.
   */
  function commit(full = false) {
    if (!ref || !editing) return;
    editing.flushPending();
    editing.normalize(full ? null : caretBlock());
    let html = ref.innerHTML;
    if (editing.isEmpty()) html = "";
    else if (html.includes("​")) html = sanitizeHtml(html);
    empty = html === "";
    if (html !== currentHtml) {
      currentHtml = html;
      lastValue = html;
      value = html;
      requiredInvalid = false;
      dispatch("input", html);
    }
    refreshState();
  }

  /**
   * Run an edit that is its own undo step. The state before it is captured
   * first, and kept only when the edit did something.
   * @param {() => boolean} edit
   */
  function mutate(edit) {
    if (!ref) return false;
    const before = capture();
    if (!edit()) return false;
    history.seal();
    history.push(before);
    history.seal();
    syncHistoryFlags();
    commit();
    return true;
  }

  function refreshState() {
    if (!ref || typeof requestAnimationFrame === "undefined") return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!ref || !editing) return;
      const next = editing.queryState();
      if (next.size !== active.size || [...next].some((k) => !active.has(k))) {
        active = next;
      }
    });
  }

  /** Put the selection back in the editor when focus is elsewhere. */
  function restoreCaret() {
    if (!ref || getRange(ref)) return;
    if (savedSelection) restoreSelection(ref, savedSelection);
    if (!getRange(ref)) {
      const selection = window.getSelection();
      selection?.selectAllChildren(ref);
      selection?.collapseToEnd();
    }
  }

  /** @param {import("./commands.js").RichTextCommand} command */
  function run(command) {
    if (!ref || !editing || !interactive || !allowed.has(command)) return;
    const returnTo = /** @type {HTMLElement | null} */ (document.activeElement);
    restoreCaret();
    if (command === "link") return openLink();
    execute(command);
    // A key press on a toolbar button leaves focus there, whatever the
    // browser did to the selection.
    if (returnTo && returnTo !== document.activeElement) {
      returnTo.focus({ preventScroll: true });
    }
  }

  /** @param {import("./commands.js").RichTextCommand} command */
  function execute(command) {
    if (!ref || !editing) return;
    if (command === "undo") return undo();
    if (command === "redo") return redo();

    const range = getRange(ref);
    const caretMark =
      range?.collapsed &&
      (command === "bold" ||
        command === "italic" ||
        command === "underline" ||
        command === "strike" ||
        command === "code");

    /** @type {Partial<Record<import("./commands.js").RichTextCommand, () => boolean>>} */
    const edits = {
      bold: () => !!editing?.toggleMark("strong"),
      italic: () => !!editing?.toggleMark("em"),
      underline: () => !!editing?.toggleMark("u"),
      strike: () => !!editing?.toggleMark("s"),
      code: () => !!editing?.toggleMark("code"),
      h2: () => !!editing?.setBlock("h2"),
      h3: () => !!editing?.setBlock("h3"),
      ul: () => !!editing?.toggleList("ul"),
      ol: () => !!editing?.toggleList("ol"),
      indent: () => !!editing?.indent(),
      outdent: () => !!editing?.outdent(),
      blockquote: () => !!editing?.toggleBlockquote(),
      clear: () => !!editing?.clearFormatting(),
    };
    const edit = edits[command];
    if (!edit) return;
    if (caretMark) {
      // A caret mark changes no text, so it is not an undo step.
      edit();
      refreshState();
    } else {
      mutate(edit);
    }
  }

  function undo() {
    if (!ref || composing) return;
    const state = history.undo(capture);
    if (!state) return;
    apply(state);
  }

  function redo() {
    if (!ref || composing) return;
    const state = history.redo(capture);
    if (!state) return;
    apply(state);
  }

  /** @param {{ html: string; selection: import("./editing.js").SavedSelection | null }} state */
  function apply(state) {
    if (!ref) return;
    ref.innerHTML = state.html;
    restoreSelection(ref, state.selection);
    syncHistoryFlags();
    commit(true);
  }

  function openLink() {
    if (!ref || !editing) return;
    const range = getRange(ref);
    if (!range) return;
    const existing = editing.getLink();
    linkSelection = saveSelection(ref);
    linkReturnFocus = /** @type {HTMLElement | null} */ (
      document.activeElement
    );
    linkExisting = !!existing;
    linkHref = existing?.getAttribute("href") ?? "";
    linkAskText = range.collapsed && !existing;
    linkLabel = "";
    linkInvalid = false;
    linkOpen = true;
  }

  /** @param {{ restoreFocus?: boolean }} [options] */
  function closeLink({ restoreFocus = true } = {}) {
    linkOpen = false;
    linkInvalid = false;
    if (restoreFocus) {
      (linkReturnFocus?.isConnected ? linkReturnFocus : ref)?.focus({
        preventScroll: true,
      });
    }
    linkReturnFocus = null;
  }

  /** @param {CustomEvent<{ href: string; text: string }>} event */
  function handleApplyLink(event) {
    if (!ref || !editing) return;
    const href = normalizeHref(event.detail.href);
    if (!href) {
      linkInvalid = true;
      return;
    }
    const text = event.detail.text;
    restoreSelection(ref, linkSelection);
    const returnTo = linkReturnFocus;
    closeLink({ restoreFocus: false });
    mutate(() => !!editing?.setLink(href, text));
    (returnTo?.isConnected ? returnTo : ref).focus({ preventScroll: true });
  }

  function handleRemoveLink() {
    if (!ref || !editing) return;
    restoreSelection(ref, linkSelection);
    const returnTo = linkReturnFocus;
    closeLink({ restoreFocus: false });
    mutate(() => !!editing?.removeLink());
    (returnTo?.isConnected ? returnTo : ref).focus({ preventScroll: true });
  }

  /** @param {CustomEvent<{ trigger: string }>} event */
  function handleCloseLink(event) {
    if (!linkOpen) return;
    // A click elsewhere moves focus on its own.
    closeLink({ restoreFocus: event.detail.trigger !== "outside-click" });
  }

  /**
   * The inputs that go through the editor's own undo history.
   * @param {string} inputType
   */
  function recordFor(inputType) {
    if (!ref) return;
    const range = getRange(ref);
    const kind =
      inputType === "insertText" || inputType === "insertCompositionText"
        ? "insert"
        : inputType.startsWith("delete")
          ? "delete"
          : inputType;
    if (kind !== "insert" && kind !== "delete") history.seal();
    if (range && !range.collapsed) history.seal();
    history.record(kind, capture);
    syncHistoryFlags();
  }

  /** @param {InputEvent} event */
  function handleBeforeInput(event) {
    if (!interactive) {
      event.preventDefault();
      return;
    }
    // A composition is the IME's: leave the DOM alone until it ends.
    if (event.isComposing || composing) return;

    switch (event.inputType) {
      case "historyUndo":
        event.preventDefault();
        undo();
        return;
      case "historyRedo":
        event.preventDefault();
        redo();
        return;
      case "formatBold":
        event.preventDefault();
        run("bold");
        return;
      case "formatItalic":
        event.preventDefault();
        run("italic");
        return;
      case "formatUnderline":
        event.preventDefault();
        run("underline");
        return;
      case "formatStrikeThrough":
        event.preventDefault();
        run("strike");
        return;
      case "insertFromPaste":
      case "insertFromPasteAsQuotation":
      case "insertFromYank":
      case "insertFromDrop":
        // The paste and drop handlers insert these. This is the fallback
        // for an engine that fires `beforeinput` first.
        if (!event.dataTransfer) return;
        event.preventDefault();
        insertTransfer(event.dataTransfer);
        return;
      case "insertReplacementText":
        return;
      default:
        if (
          event.inputType.startsWith("insert") ||
          event.inputType.startsWith("delete")
        ) {
          recordFor(event.inputType);
        }
    }
  }

  function handleInput(/** @type {Event} */ event) {
    if (composing || /** @type {InputEvent} */ (event).isComposing) return;
    commit();
  }

  function handleCompositionStart() {
    composing = true;
    recordFor("insertCompositionText");
  }

  function handleCompositionEnd() {
    composing = false;
    commit();
    if (deferredValue !== undefined) syncFromValue(deferredValue);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!interactive || !ref || !editing || isImeComposition(event)) return;

    const command = commandForKey(event, mac);
    if (command && allowed.has(command)) {
      event.preventDefault();
      run(command);
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "Home" ||
      event.key === "End" ||
      event.key === "PageUp" ||
      event.key === "PageDown"
    ) {
      history.seal();
      return;
    }

    const range = getRange(ref);
    if (!range) return;

    if (event.key === "Tab" && allowed.has("indent")) {
      if (!inListItem(range)) return;
      // Tab moves between list levels; where it can't, it leaves the editor.
      const ok = mutate(() =>
        event.shiftKey ? !!editing?.outdent() : !!editing?.indent(),
      );
      if (ok) event.preventDefault();
      return;
    }

    if (
      (event.key === "Enter" && !event.shiftKey) ||
      event.key === "Backspace"
    ) {
      const block = closestTextBlock(range.startContainer, ref);
      // A plain top-level paragraph is the browser's to edit.
      if (!block || (block.nodeName === "P" && block.parentNode === ref)) {
        return;
      }
      const edit =
        event.key === "Enter"
          ? () => !!editing?.enter()
          : () => !!editing?.backspace();
      if (mutate(edit)) event.preventDefault();
    }
  }

  /** @param {Range} range */
  function inListItem(range) {
    const block = ref && closestTextBlock(range.startContainer, ref);
    return block?.nodeName === "LI";
  }

  /**
   * Insert what a paste or drop carries, as the schema.
   * @param {DataTransfer} data
   */
  function insertTransfer(data) {
    const html = data.getData("text/html");
    const text = data.getData("text/plain");
    const clean = html ? sanitizeHtml(html, { edges: true }) : textToHtml(text);
    if (!clean) return;
    mutate(() => !!editing?.insertHtml(clean));
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (!interactive || !event.clipboardData) return;
    event.preventDefault();
    insertTransfer(event.clipboardData);
  }

  /** The selection as sanitized HTML and as text. */
  function selectionContents() {
    const range = ref && getRange(ref);
    if (!range || range.collapsed) return null;
    const holder = document.createElement("div");
    holder.appendChild(range.cloneContents());
    return { html: sanitizeHtml(holder.innerHTML), text: range.toString() };
  }

  /** @param {ClipboardEvent} event */
  function handleCopy(event) {
    const contents = selectionContents();
    if (!contents || !event.clipboardData) return;
    // The browser would copy computed styles along with the markup.
    event.preventDefault();
    event.clipboardData.setData("text/html", contents.html);
    event.clipboardData.setData("text/plain", contents.text);
  }

  /** @param {ClipboardEvent} event */
  function handleCut(event) {
    if (!interactive) return;
    const contents = selectionContents();
    if (!contents || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData("text/html", contents.html);
    event.clipboardData.setData("text/plain", contents.text);
    mutate(() => !!editing?.deleteSelection());
  }

  /** @param {DragEvent} event */
  function handleDrop(event) {
    // A drag that started in the editor moves text: the browser does that,
    // and `commit` cleans up what it leaves.
    if (!interactive || draggingInside || !event.dataTransfer) return;
    event.preventDefault();
    const point = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (point) {
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(point);
    }
    insertTransfer(event.dataTransfer);
  }

  function handleSelectionChange() {
    if (!ref) return;
    const selection = saveSelection(ref);
    if (selection) {
      savedSelection = selection;
      editing?.flushPending();
    }
    refreshState();
  }

  function handleFocusin() {
    document.addEventListener("selectionchange", handleSelectionChange);
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef?.contains(next)) return;
    document.removeEventListener("selectionchange", handleSelectionChange);
  }

  function handleEditorFocus() {
    focused = true;
    valueAtFocus = value;
    history.seal();
  }

  function handleEditorBlur() {
    focused = false;
    history.seal();
    if (value !== valueAtFocus) dispatch("change", value);
  }

  /** @param {MouseEvent} event */
  function handleLabelClick(event) {
    event.preventDefault();
    if (interactive) ref?.focus();
  }

  function handleFormReset() {
    value = initialValue;
  }

  /** @param {Event} event */
  function handleInvalid(event) {
    // The browser's bubble would point at an element nobody can see.
    event.preventDefault();
    requiredInvalid = true;
    ref?.focus();
  }

  onMount(() => {
    mac = APPLE_PLATFORM.test(
      /** @type {any} */ (navigator).userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent,
    );
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(frame);
      }
    };
  });

  // Takes the element over from Svelte once, after the first render.
  /** @param {HTMLDivElement} node */
  function adopt(node) {
    // Server-rendered markup may carry comment nodes from the framework.
    if (!Array.from(node.childNodes).every((child) => child.nodeType === 1)) {
      node.innerHTML = initialHtml || "<p><br></p>";
    }
    editing = createEditing(node);
    mounted = true;
    return {
      destroy() {
        editing = null;
        mounted = false;
      },
    };
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={rootRef}
  use:formReset={handleFormReset}
  class:bx--form-item={true}
  class:bx--rich-text-editor={true}
  class:bx--rich-text-editor--fluid={isFluid}
  class:bx--rich-text-editor--xs={effectiveSize === "xs"}
  class:bx--rich-text-editor--sm={effectiveSize === "sm"}
  class:bx--rich-text-editor--xl={effectiveSize === "xl"}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focusin={handleFocusin}
  on:focusout={handleFocusout}
>
  {#if labelText || $$slots.labelChildren || hasMaxCount}
    <div class:bx--text-area__label-wrapper={true}>
      {#if labelText || $$slots.labelChildren}
        <div
          id={labelId}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
          on:click={handleLabelClick}
        >
          <slot name="labelChildren">{labelText}</slot>
        </div>
      {/if}
      {#if hasMaxCount}
        <div
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--text-area__label-counter={true}
          class:bx--text-area__label-counter--error={overCount}
        >
          <span aria-hidden="true">{count}/{maxCount}</span>
          <span id={counterId} class:bx--visually-hidden={true}>
            {resolvedCounterText(count, maxCount ?? 0)}
          </span>
        </div>
      {/if}
    </div>
  {/if}
  <div
    class:bx--rich-text-editor__box={true}
    class:bx--rich-text-editor__box--focused={focused}
    class:bx--rich-text-editor__box--invalid={showInvalid}
    class:bx--rich-text-editor__box--warn={showWarn}
    class:bx--rich-text-editor__box--disabled={disabled}
    class:bx--rich-text-editor__box--readonly={readonly}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
  >
    {#if showToolbar}
      <RichTextEditorToolbar
        {items}
        {active}
        {canUndo}
        {canRedo}
        {disabled}
        {buttonSize}
        {commandText}
        {mac}
        controls={id}
        aria-label={toolbarLabelText}
        linkText={resolvedLinkText}
        {linkOpen}
        {linkExisting}
        {linkAskText}
        bind:linkHref
        bind:linkLabel
        {linkInvalid}
        on:command={(event) => run(event.detail.command)}
        on:applylink={handleApplyLink}
        on:removelink={handleRemoveLink}
        on:closelink={handleCloseLink}
        on:exit={() => ref?.focus()}
      />
    {/if}
    <div class:bx--rich-text-editor__surface={true}>
      {#if showInvalid && !isFluid}
        <WarningFilled class="bx--text-area__invalid-icon" />
      {/if}
      {#if showWarn && !isFluid}
        <WarningAltFilled
          class="bx--text-area__invalid-icon bx--text-area__invalid-icon--warning"
        />
      {/if}
      {#if placeholder && empty}
        <div class:bx--rich-text-editor__placeholder={true} aria-hidden="true">
          {placeholder}
        </div>
      {/if}
      <div
        bind:this={ref}
        use:adopt
        {id}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={!ariaLabel && (labelText || $$slots.labelChildren)
          ? labelId
          : undefined}
        aria-label={ariaLabel}
        aria-placeholder={placeholder || undefined}
        aria-required={required ? "true" : undefined}
        aria-readonly={readonly ? "true" : undefined}
        aria-disabled={disabled ? "true" : undefined}
        aria-invalid={showInvalid || overCount ? "true" : undefined}
        aria-errormessage={showInvalid && statusText ? errorId : undefined}
        contenteditable={mounted && interactive ? "true" : undefined}
        spellcheck="true"
        tabindex={readonly && !disabled ? 0 : undefined}
        class:bx--rich-text-editor__content={true}
        style:--ccs-rich-text-editor-rows={rows}
        style:--ccs-rich-text-editor-max-rows={maxRows}
        {...$$restProps}
        aria-describedby={describedBy}
        on:beforeinput={handleBeforeInput}
        on:input={handleInput}
        on:keydown={handleKeydown}
        on:keydown
        on:compositionstart={handleCompositionStart}
        on:compositionend={handleCompositionEnd}
        on:paste={handlePaste}
        on:copy={handleCopy}
        on:cut={handleCut}
        on:dragstart={() => (draggingInside = true)}
        on:dragend={() => (draggingInside = false)}
        on:drop={handleDrop}
        on:mousedown={() => history.seal()}
        on:focus={handleEditorFocus}
        on:focus
        on:blur={handleEditorBlur}
        on:blur
      >
        {@html initialHtml || "<p><br></p>"}
      </div>
    </div>
    {#if isFluid}
      {#if showInvalid}
        <div
          id={errorId}
          class:bx--form-requirement={true}
          role={statusText ? "alert" : undefined}
        >
          {statusText}
          <WarningFilled class="bx--text-area__invalid-icon" />
        </div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>
          {warnText}
          <WarningAltFilled
            class="bx--text-area__invalid-icon bx--text-area__invalid-icon--warning"
          />
        </div>
      {/if}
    {/if}
  </div>
  {#if name || required}
    <input
      bind:this={validityRef}
      type="text"
      tabindex="-1"
      aria-hidden="true"
      class:bx--visually-hidden={true}
      {name}
      {required}
      {disabled}
      value={currentHtml}
      on:invalid={handleInvalid}
    />
  {/if}
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if !isFluid && showInvalid && statusText}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {statusText}
    </div>
  {/if}
  {#if !isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
</div>
