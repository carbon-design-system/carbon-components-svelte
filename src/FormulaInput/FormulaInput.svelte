<script>
  /**
   * @restProps {textarea}
   * @slot {{ item: import("./formula-suggest.js").CompletionItem, index: number, highlighted: boolean }} item
   */

  /**
   * @typedef {import("./formula-check.js").FormulaField} FormulaField
   * @typedef {import("./formula-functions.js").FormulaFunction} FormulaFunction
   * @typedef {import("./formula-lang.js").FormulaDiagnostic} FormulaDiagnostic
   * @typedef {import("./formula-eval.js").FormulaEvalResult} FormulaEvalResult
   * @typedef {import("./formula-suggest.js").CompletionItem} FormulaCompletionItem
   * @typedef {import("./formula-suggest.js").SignatureHelp} FormulaSignatureHelp
   * @typedef {import("./formula-functions.js").FormulaValue} FormulaValue
   */

  /**
   * Specify the formula text.
   * Follows the field when the owning form resets.
   * @type {null | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the fields a formula may refer to, as `{id}` or by a bare id.
   * When set, an unknown name is an error and a field's `type` is checked.
   * Leave unset to accept any name.
   * @type {ReadonlyArray<FormulaField> | undefined}
   */
  export let fields = undefined;

  /**
   * Specify the functions a formula may call. Pass
   * `[...defaultFunctions, myFunction]` to add one to the built-in set.
   * @type {ReadonlyArray<FormulaFunction>}
   */
  export let functions = defaultFunctions;

  /**
   * Specify a sample row, the values by field id, to calculate the result
   * preview against. Leave unset for no preview.
   * @type {Record<string, unknown> | undefined}
   */
  export let row = undefined;

  /**
   * Specify what the completions write for a field.
   * @type {"id" | "label"}
   */
  export let refBy = "id";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the number of lines at which the field scrolls instead of growing */
  export let maxRows = 6;

  /**
   * Set to `false` to stop marking and listing the formula's errors.
   * The completions, the signature help and the preview stay.
   */
  export let validate = true;

  /** Set to `false` to hide the result preview */
  export let preview = true;

  /** Specify how many completions to list */
  export let limit = 8;

  /**
   * Specify the most steps the preview may take. Default `10000`.
   * @type {number | undefined}
   */
  export let maxSteps = undefined;

  /**
   * Specify the most time in milliseconds the preview may take. Default `20`.
   * @type {number | undefined}
   */
  export let maxTime = undefined;

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Set to `true` to indicate an invalid state.
   * A formula with errors is invalid without it.
   */
  export let invalid = false;

  /**
   * Specify the text for the invalid state.
   * Shown instead of the formula's own error.
   */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set an id for the textarea element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the field.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Specify the label of the result preview */
  export let previewLabel = "Result";

  /** Specify the text of the preview when there is no result to show */
  export let previewEmptyText = "No result yet";

  /**
   * Specify how a result shows in the preview.
   * @type {(value: FormulaValue) => string}
   */
  export let formatPreview = formatResult;

  /** Specify the label of the list of completions */
  export let listLabel = "Suggestions";

  /**
   * Specify the text read when there are completions.
   * @type {(count: number) => string}
   */
  export let suggestionsText = defaultSuggestionsText;

  /**
   * Specify the text read when the caret enters a function's argument.
   * @type {(help: FormulaSignatureHelp) => string}
   */
  export let signatureText = defaultSignatureText;

  /**
   * Specify the error shown below the field: the error at the caret, or the
   * first one, and how many there are.
   * @type {(first: FormulaDiagnostic, count: number) => string}
   */
  export let diagnosticsText = defaultDiagnosticsText;

  /**
   * Specify the text read when F8 moves to an error.
   * @type {(index: number, count: number, error: FormulaDiagnostic) => string}
   */
  export let errorPositionText = defaultErrorPositionText;

  /**
   * Specify the keyboard hint the field is described by.
   * Set to `""` to remove it.
   */
  export let keyboardHint =
    "Press Control and Space for suggestions, and F8 for the next error.";

  /**
   * The formula's errors, in source order. Empty when `validate` is `false`.
   * @type {FormulaDiagnostic[]}
   * @bindable readonly
   */
  export let diagnostics = [];

  /**
   * The result of the formula against `row`. Unset without a row, or while
   * the formula has errors.
   * @type {FormulaEvalResult | undefined}
   * @bindable readonly
   */
  export let result = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   * @type {null | HTMLTextAreaElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { debounce } from "../utils/debounce.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { createFrameJob } from "../utils/frame-batch.js";
  import { highlightSegments } from "../utils/fuzzy-match.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { moveIndex } from "../utils/move-index.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    analyzeFormula,
    createFormulaEnv,
    resolveField,
  } from "./formula-check.js";
  import { evaluateFormula, formatResult } from "./formula-eval.js";
  import { defaultFunctions } from "./formula-functions.js";
  import { highlightRuns } from "./formula-highlight.js";
  import {
    completionContext,
    getCompletions,
    nextDiagnostic,
    shouldTypeOver,
    signatureHelp,
  } from "./formula-suggest.js";

  const dispatch = createEventDispatcher();

  /** @type {Record<string, string | undefined>} */
  const KIND_CLASS = {
    function: "bx--formula-input__function",
    field: "bx--formula-input__field",
    string: "bx--formula-input__string",
    number: "bx--formula-input__number",
    operator: "bx--formula-input__operator",
    punctuation: "bx--formula-input__punctuation",
    constant: "bx--formula-input__constant",
  };

  /** @param {number} count */
  function defaultSuggestionsText(count) {
    return `${count} suggestion${count === 1 ? "" : "s"} available`;
  }

  /** @param {FormulaSignatureHelp} help */
  function defaultSignatureText(help) {
    const param = help.fn.params[help.activeParam];
    return param
      ? `${help.signature.text}. ${param.name}${param.description ? `: ${param.description}` : ""}`
      : help.signature.text;
  }

  /**
   * @param {FormulaDiagnostic} first
   * @param {number} count
   */
  function defaultDiagnosticsText(first, count) {
    return count > 1
      ? `${first.message} (and ${count - 1} more error${count === 2 ? "" : "s"})`
      : first.message;
  }

  /**
   * @param {number} index
   * @param {number} count
   * @param {FormulaDiagnostic} error
   */
  function defaultErrorPositionText(index, count, error) {
    return `Error ${index} of ${count}: ${error.message}`;
  }

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  const formContext = getContext(FORM_CONTEXT_KEY);

  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  /** @type {null | HTMLDivElement} */
  let contentRef = null;
  /** @type {null | HTMLDivElement} */
  let layerRef = null;
  /** @type {null | HTMLElement} */
  let anchorEl = null;
  let ready = false;
  let focused = false;
  let composing = false;
  let caret = 0;
  let highlightedIndex = 0;
  let keyboardHighlight = true;
  /** Where the user asked for suggestions with Control and Space. */
  let explicitStart = -1;
  let dismissedKey = "";
  let signatureDismissedKey = "";
  let announcement = "";
  let announceFlip = false;
  let anchorLeft = 0;
  let anchorTop = 0;
  let anchorHeight = 20;

  // The first height is the lines the server can count, so the field does not
  // jump when it hydrates.
  const initialRows = Math.max(
    1,
    Math.min(maxRows, (value ?? "").split("\n").length),
  );

  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: previewId = `${id}-preview`;
  $: signatureId = `${id}-signature`;
  $: hintId = `${id}-hint`;
  $: menuId = `${id}-menu`;
  $: isFluid = fluid || !!formContext?.isFluid;

  $: source = value ?? "";
  $: env = createFormulaEnv(functions, fields ?? null);
  $: analysis = analyzeFormula(source, { env });
  $: diagnostics = validate ? analysis.diagnostics : [];
  $: hasErrors = diagnostics.length > 0;
  $: runs = ready
    ? highlightRuns(source, analysis.tokens, diagnostics, {
        isField: (/** @type {string} */ name) =>
          !!env.fields && !!resolveField(env, name),
      })
    : [];

  $: showPreview = preview && row !== undefined;
  $: result =
    showPreview && analysis.diagnostics.length === 0 && analysis.ast
      ? evaluateFormula(analysis.ast, { env, row, maxSteps, maxTime })
      : undefined;
  $: previewText = result
    ? result.ok
      ? formatPreview(result.value)
      : result.error.message
    : previewEmptyText;

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || hasErrors,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: atCaret = diagnostics.find((d) => d.start <= caret && caret <= d.end);
  $: ownText =
    hasErrors && !invalid
      ? diagnosticsText(atCaret ?? diagnostics[0], diagnostics.length)
      : "";
  $: messageText = invalid ? invalidText : ownText;
  $: errorMessageId = showInvalid && messageText ? errorId : undefined;

  $: context =
    focused && !composing && caret >= 0 && !readonly && !effectiveDisabled
      ? completionContext(source, analysis.tokens, caret)
      : null;
  $: wanted =
    !!context &&
    (context.kind === "field" ||
      context.query !== "" ||
      explicitStart === context.start);
  $: items =
    wanted && context ? getCompletions(context, env, { limit, refBy }) : [];
  $: itemsKey = items.map((item) => item.insert).join("\u0000");
  $: contextKey = context ? `${context.start}:${context.query}` : "";
  $: open = items.length > 0 && dismissedKey !== contextKey;

  let previousItemsKey = "";
  $: if (itemsKey !== previousItemsKey) {
    previousItemsKey = itemsKey;
    highlightedIndex = 0;
    keyboardHighlight = true;
  }
  $: highlightedId =
    open && highlightedIndex > -1 ? `${id}-option-${highlightedIndex}` : null;

  $: signature =
    focused && !composing && caret >= 0 && !effectiveDisabled
      ? signatureHelp(analysis.tokens, source, caret, env)
      : null;
  $: signatureKey = signature
    ? `${signature.fn.name}:${signature.argIndex}`
    : "";
  $: showSignature = !!signature && signatureDismissedKey !== signatureKey;
  $: signatureParts = signature ? splitSignature(signature) : null;

  $: describedBy =
    [
      resolveStatusDescribedBy({
        showInvalid,
        showWarn,
        invalidText: messageText,
        warnText,
        helperText,
        isFluid,
        errorId,
        warnId,
        helperId,
        // The formula's own error is not announced as an alert, so it is
        // read as a description.
        includeErrorId: ownText !== "",
      }),
      showPreview ? previewId : null,
      keyboardHint ? hintId : null,
      showSignature ? signatureId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const announce = debounce(
    /** @param {unknown} text */ (text) => {
      announcement = String(text);
    },
    400,
  );

  $: liveMessage = open
    ? suggestionsText(items.length)
    : showSignature && signature
      ? signatureText(signature)
      : "";
  $: announce(liveMessage);

  $: if (open || showSignature) placeAnchor(caret, runs);

  // A value that did not come from typing changes the height too. Measure it
  // in the next frame, once the field holds the text.
  let fittedSource = "";
  $: if (ref && source !== fittedSource) {
    fittedSource = source;
    fitJob.schedule();
  }

  /** @param {FormulaSignatureHelp} help */
  function splitSignature(help) {
    const { text, params } = help.signature;
    const range = params[help.activeParam];
    if (!range || range.end <= range.start) {
      return { before: text, active: "", after: "" };
    }
    return {
      before: text.slice(0, range.start),
      active: text.slice(range.start, range.end),
      after: text.slice(range.end),
    };
  }

  // Collapsing the textarea to measure it shortens the scroll box for a moment,
  // and the browser clamps its scroll position to the top. Put it back.
  function fit() {
    if (!ref) return;
    const top = scrollerRef?.scrollTop ?? 0;
    ref.style.height = "auto";
    ref.style.height = `${ref.scrollHeight}px`;
    if (scrollerRef) scrollerRef.scrollTop = top;
  }

  const fitJob = createFrameJob([
    () => {
      if (!ref) return undefined;
      const top = scrollerRef?.scrollTop ?? 0;
      ref.style.height = "auto";
      return top;
    },
    (/** @type {number | undefined} */ top) =>
      ref && top !== undefined ? { top, height: ref.scrollHeight } : undefined,
    (/** @type {{ top: number, height: number } | undefined} */ measured) => {
      if (!ref || !measured) return;
      ref.style.height = `${measured.height}px`;
      if (scrollerRef) scrollerRef.scrollTop = measured.top;
    },
  ]);

  /** @type {number | undefined} */
  let lastWidth;

  onMount(() => {
    ready = true;
    fit();

    const stopObserving = ref
      ? observeResize(ref, (entry) => {
          const { width } = entry.contentRect;
          if (width !== lastWidth) {
            lastWidth = width;
            fitJob.schedule();
          }
        })
      : () => {};

    document.fonts?.ready?.then(() => fitJob.schedule());

    return () => {
      stopObserving();
      fitJob.cancel();
      announce.cancel();
    };
  });

  function syncCaret() {
    if (!ref) return;
    caret = ref.selectionStart === ref.selectionEnd ? ref.selectionStart : -1;
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  /**
   * The caret's box in the layer, which holds the same text as the field.
   * @returns {DOMRect | null}
   */
  function caretRect() {
    if (!layerRef || typeof document === "undefined") return null;
    const position = Math.max(0, caret);
    const index = runs.findIndex(
      (run) => position >= run.start && position <= run.end,
    );
    const run = runs[index];
    const node = layerRef.children[index]?.firstChild;
    if (!run || !node) return layerRef.getBoundingClientRect();
    const range = document.createRange();
    // jsdom has no layout, and no ranges that measure.
    if (typeof range.getClientRects !== "function") return null;
    range.setStart(
      node,
      Math.min(position - run.start, node.textContent?.length ?? 0),
    );
    range.collapse(true);
    const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
    return rect && rect.height > 0
      ? rect
      : /** @type {Element} */ (node.parentElement).getBoundingClientRect();
  }

  /**
   * Move the point the popups hang from to the caret. Runs once the layer
   * shows the text, so a character just typed is in it.
   * @param {number} _caret
   * @param {unknown} _runs
   */
  function placeAnchor(_caret, _runs) {
    tick().then(() => {
      if (!contentRef) return;
      const rect = caretRect();
      if (!rect) return;
      const base = contentRef.getBoundingClientRect();
      anchorLeft = rect.left - base.left;
      anchorTop = rect.top - base.top;
      anchorHeight = rect.height || 20;
    });
  }

  /**
   * Scroll the field so the caret shows. The textarea is as tall as its text,
   * so it never scrolls itself, and the browser does not scroll the box around
   * it to a caret that moved past its edge.
   */
  function revealCaret() {
    tick().then(() => {
      if (!scrollerRef) return;
      const rect = caretRect();
      if (!rect || rect.height === 0) return;
      const box = scrollerRef.getBoundingClientRect();
      if (rect.bottom > box.bottom) {
        scrollerRef.scrollTop += rect.bottom - box.bottom + 8;
      } else if (rect.top < box.top) {
        scrollerRef.scrollTop -= box.top - rect.top + 8;
      }
    });
  }

  /**
   * Replace `[start, end)` as typing would, so the browser's undo restores
   * what was there. `execCommand` is deprecated yet is the only way to edit a
   * field and keep its undo stack; where it does nothing, the value is
   * written and an `input` event follows.
   * @param {HTMLTextAreaElement} el
   * @param {number} start
   * @param {number} end
   * @param {string} text
   */
  function replaceRange(el, start, end, text) {
    el.setSelectionRange(start, end);
    let done = false;
    try {
      done =
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, text);
    } catch {
      done = false;
    }
    if (done && el.value.slice(start, start + text.length) === text) return;

    el.setRangeText(text, start, end, "end");
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertReplacementText",
        data: text,
      }),
    );
  }

  /** @param {number} index */
  function accept(index) {
    const el = ref;
    const item = items[index];
    const at = context;
    if (!el || !item || !at) return;

    replaceRange(el, at.start, at.end, item.insert);
    const position = at.start + item.caret;
    el.setSelectionRange(position, position);
    syncCaret();
    // Svelte 3 and 4 write the bound value back after the input event, which
    // can move the caret. Put it back once that has flushed.
    tick().then(() => {
      if (!ref) return;
      ref.setSelectionRange(position, position);
      syncCaret();
    });
    dispatch("accept", { item });
  }

  /** @param {number} index */
  function pointerHighlight(index) {
    if (highlightedIndex === index) return;
    keyboardHighlight = false;
    highlightedIndex = index;
  }

  /** @param {boolean} backwards */
  function jumpToError(backwards) {
    const el = ref;
    if (!el || diagnostics.length === 0) return;
    const error = nextDiagnostic(
      diagnostics,
      backwards ? el.selectionStart : el.selectionEnd,
      backwards,
    );
    if (!error) return;
    el.setSelectionRange(error.start, Math.max(error.end, error.start));
    syncCaret();
    announceFlip = !announceFlip;
    announcement = `${errorPositionText(
      diagnostics.indexOf(error) + 1,
      diagnostics.length,
      error,
    )}${announceFlip ? "​" : ""}`;
    placeAnchor(caret, runs);
    tick().then(() => anchorEl?.scrollIntoView?.({ block: "nearest" }));
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event) || !ref) return;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey;

    if (
      (event.key === " " && event.ctrlKey && !event.metaKey && !event.altKey) ||
      (event.key === "ArrowDown" && event.altKey && !event.ctrlKey)
    ) {
      syncCaret();
      explicitStart =
        completionContext(source, analysis.tokens, caret)?.start ?? -1;
      dismissedKey = "";
      event.preventDefault();
      return;
    }

    if (
      open &&
      plain &&
      !event.shiftKey &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      keyboardHighlight = true;
      highlightedIndex = moveIndex(
        highlightedIndex,
        event.key === "ArrowDown" ? 1 : -1,
        items.length,
      );
      return;
    }

    if (
      open &&
      plain &&
      (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey))
    ) {
      event.preventDefault();
      accept(highlightedIndex);
      return;
    }

    if (
      event.key === "Escape" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      if (open) {
        dismissedKey = contextKey;
        event.preventDefault();
        event.stopPropagation();
      } else if (showSignature) {
        signatureDismissedKey = signatureKey;
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (
      event.key === "F8" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      jumpToError(event.shiftKey);
      return;
    }

    if (
      event.key === ")" &&
      plain &&
      ref.selectionStart === ref.selectionEnd &&
      shouldTypeOver(ref.value, ref.selectionStart, analysis.diagnostics)
    ) {
      event.preventDefault();
      ref.setSelectionRange(ref.selectionStart + 1, ref.selectionStart + 1);
      syncCaret();
    }
  }

  function handleInput() {
    fit();
    syncCaret();
    revealCaret();
  }

  function handleKeyup() {
    syncCaret();
    revealCaret();
  }

  function handleFocus() {
    focused = true;
    syncCaret();
  }

  function handleBlur() {
    focused = false;
    explicitStart = -1;
    dismissedKey = "";
    signatureDismissedKey = "";
  }

  function handleCompositionEnd() {
    composing = false;
    syncCaret();
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class:bx--form-item={true}
  class:bx--formula-input={true}
  class:bx--formula-input--fluid={isFluid}
  class:bx--text-area--fluid={isFluid}
>
  {#if labelText || $$slots.labelChildren}
    <div class:bx--text-area__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    </div>
  {/if}
  <div
    class:bx--formula-input__wrapper={true}
    class:bx--text-area__wrapper={true}
    class:bx--formula-input__wrapper--readonly={readonly}
    class:bx--formula-input__wrapper--disabled={effectiveDisabled}
    class:bx--text-area__wrapper--readonly={readonly}
    class:bx--text-area__wrapper--warn={showWarn}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
  >
    {#if showInvalid && !isFluid}
      <WarningFilled class="bx--text-area__invalid-icon" />
    {/if}
    {#if showWarn && !isFluid}
      <WarningAltFilled
        class="bx--text-area__invalid-icon
        bx--text-area__invalid-icon--warning"
      />
    {/if}
    <div
      bind:this={scrollerRef}
      class:bx--formula-input__scroller={true}
      class:bx--formula-input__scroller--ready={ready}
      style:--ccs-formula-input-max-rows={maxRows}
    >
      <div bind:this={contentRef} class:bx--formula-input__content={true}>
        <textarea
          bind:this={ref}
          bind:value
          use:formReset={handleFormReset}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={open ? `menu-${menuId}` : undefined}
          aria-activedescendant={highlightedId ?? undefined}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-errormessage={errorMessageId}
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          dir="ltr"
          rows={initialRows}
          disabled={effectiveDisabled}
          {id}
          {name}
          {placeholder}
          {readonly}
          class:bx--formula-input__input={true}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            describedBy,
            $$restProps["aria-describedby"],
          )}
          on:change
          on:input
          on:input={handleInput}
          on:keydown
          on:keydown={handleKeydown}
          on:keyup
          on:keyup={handleKeyup}
          on:focus
          on:focus={handleFocus}
          on:blur
          on:blur={handleBlur}
          on:paste
          on:mouseup={syncCaret}
          on:select={syncCaret}
          on:compositionstart={() => (composing = true)}
          on:compositionend={handleCompositionEnd}></textarea>
        <div
          bind:this={layerRef}
          class:bx--formula-input__layer={true}
          aria-hidden="true"
          hidden={!ready}
        >
          {#each runs as run, index (index)}<span
              class={KIND_CLASS[run.kind]}
              class:bx--formula-input__error={run.error}>{run.text}</span
            >{/each}
        </div>
        <span
          bind:this={anchorEl}
          class:bx--formula-input__anchor={true}
          aria-hidden="true"
          style:left="{anchorLeft}px"
          style:top="{anchorTop}px"
          style:block-size="{anchorHeight}px"
        ></span>
      </div>
    </div>
    {#if isFluid}
      <hr class:bx--text-area__divider={true} />
      {#if showInvalid}
        <div
          id={errorId}
          class:bx--form-requirement={true}
          role={invalid && invalidText ? "alert" : undefined}
        >
          {messageText}
          <WarningFilled class="bx--text-area__invalid-icon" />
        </div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>
          {warnText}
          <WarningAltFilled
            class="bx--text-area__invalid-icon
            bx--text-area__invalid-icon--warning"
          />
        </div>
      {/if}
    {/if}
  </div>
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
  {#if !isFluid && showInvalid && messageText}
    <div
      id={errorId}
      class:bx--form-requirement={true}
      role={invalid && invalidText ? "alert" : undefined}
    >
      {messageText}
    </div>
  {/if}
  {#if !isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if showPreview}
    <div id={previewId} class:bx--formula-input__preview={true}>
      <span>{previewLabel}</span>
      <span class:bx--formula-input__preview-value={true}>{previewText}</span>
    </div>
  {/if}
  {#if keyboardHint}
    <span id={hintId} class:bx--visually-hidden={true}>{keyboardHint}</span>
  {/if}
  <span class:bx--visually-hidden={true} role="status" aria-live="polite"
    >{announcement}</span
  >
  <FloatingPortal
    anchor={anchorEl}
    open={showSignature}
    direction="top"
    intrinsicWidth
    intrinsicAlign="start"
    gapTop={4}
    gapBottom={4}
  >
    {#if signature && signatureParts}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        id={signatureId}
        class:bx--formula-input__signature={true}
        on:mousedown|preventDefault
      >
        <div>
          {signatureParts.before}{#if signatureParts.active}<span
              class:bx--formula-input__param--active={true}
              >{signatureParts.active}</span
            >{/if}{signatureParts.after}
        </div>
        {#if signature.fn.params[signature.activeParam]?.description || signature.fn.description}
          <div class:bx--formula-input__signature-description={true}>
            {signature.fn.params[signature.activeParam]?.description ||
              signature.fn.description}
          </div>
        {/if}
      </div>
    {/if}
  </FloatingPortal>
  <FloatingPortal
    anchor={anchorEl}
    {open}
    direction="bottom"
    intrinsicWidth
    intrinsicAlign="start"
    gapTop={4}
    gapBottom={4}
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class:bx--formula-input__menu={true} on:mousedown|preventDefault>
      <ListBoxMenu
        id={menuId}
        aria-label={listLabel}
        tabindex={-1}
        {highlightedId}
        highlightScroll={keyboardHighlight}
        style="position: static; max-height: 20rem;"
      >
        {#each items as item, index (index)}
          <ListBoxMenuItem
            id="{id}-option-{index}"
            on:click={() => accept(index)}
            on:mouseenter={() => pointerHighlight(index)}
          >
            <slot
              name="item"
              {item}
              {index}
              highlighted={index === highlightedIndex}
            >
              <span class:bx--formula-input__item-label={true}
                >{#each highlightSegments(item.label, item.matched) as part, i (i)}<span
                    class:bx--formula-input__item-match={part.match}
                    >{part.text}</span
                  >{/each}</span
              >
              {#if item.detail}
                <span class:bx--formula-input__item-detail={true}
                  >{item.detail}</span
                >
              {/if}
            </slot>
          </ListBoxMenuItem>
        {/each}
      </ListBoxMenu>
    </div>
  </FloatingPortal>
</div>
