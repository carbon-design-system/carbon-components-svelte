<script>
  /**
   * @typedef {{ type: string | null; text: string }} CodeEditorToken
   */

  /**
   * @event {null} change
   * @restProps {textarea} Rest props are spread to the textarea.
   */

  /**
   * Specify the code.
   * Follows the field when the owning form resets.
   * @type {null | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the language the tokenizer colors the code as, such as `"js"`,
   * `"json"`, `"svelte"` or `"css"`.
   * An unknown language, or none, leaves the code plain.
   */
  export let language = "";

  /**
   * Specify the function that splits code into colored tokens. Pass `tokenize`
   * from `carbon-components-svelte/syntax`, which `CodeEditor` does not import
   * itself so the core stays free of the tokenizer, or any function that
   * returns tokens whose text joins back to the code.
   * Load `css/syntax.css` and `css/syntax-tokens.css` to color the tokens.
   * @type {((code: string, language: string) => CodeEditorToken[] | undefined) | undefined}
   */
  export let tokenize = undefined;

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Specify the number of lines the editor shows before it scrolls.
   * @type {number}
   */
  export let rows = 10;

  /**
   * Specify the size of the code.
   * `"md"` is 14px on 20px lines, `"sm"` is 12px on 16px lines like `CodeSnippet`.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Set to `false` to hide the line numbers */
  export let lineNumbers = true;

  /** Set to `false` to stop marking the line that holds the caret */
  export let highlightActiveLine = true;

  /**
   * Set to `true` to wrap long lines instead of scrolling sideways.
   * A wrapped editor paints every line, so it suits short code.
   */
  export let wrapText = false;

  /**
   * Specify what the Tab key inserts.
   * @type {"spaces" | "tabs"}
   */
  export let indent = "spaces";

  /** Specify the width of a tab stop, and the spaces one indent holds */
  export let tabSize = 2;

  /**
   * Set to `false` to let Tab move focus, as in a plain field.
   * Otherwise Tab indents and Shift+Tab outdents, and Escape followed by Tab
   * (or Shift+Tab) moves focus out of the editor.
   */
  export let indentWithTab = true;

  /** Set to `false` to stop Enter from keeping the indent of the line above */
  export let autoIndent = true;

  /**
   * Set to `true` to type closing brackets and quotes for the opening ones,
   * wrap a selection in them, and step over a closer that is already there.
   */
  export let autoClose = false;

  /** Set to `true` to disable the editor */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

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

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /**
   * Specify the text read to explain how to leave the editor.
   * Unused when `indentWithTab` is `false` or the editor is read-only.
   */
  export let escapeHintText = "Press Escape, then Tab, to move focus out.";

  /** Specify the text announced once Escape lets Tab move focus */
  export let tabFocusText = "Tab now moves focus.";

  /** Set an id for the textarea element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the textarea.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   * @type {null | HTMLTextAreaElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    indentEdit,
    lineAt,
    lineSegments,
    lineStarts,
    maxColumns,
    newlineEdit,
    paintCovers,
    paintWindow,
    pairBackspaceEdit,
    pairEdit,
  } from "../utils/code-edit.js";
  import { spliceTokens } from "../utils/code-tokens.js";
  import {
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formContext = getContext(FORM_CONTEXT_KEY);

  /** The textarea's first value, so the server renders it and Svelte never rewrites it. */
  const initialValue = value ?? "";

  /** Lines painted beyond the view, either side. */
  const OVERSCAN = 40;
  /** Lines of slack before a scroll repaints. */
  const MARGIN = 12;
  const MODIFIER_KEYS = new Set([
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "AltGraph",
  ]);
  const SAFE_TYPE = /^[a-z][a-z0-9-]*$/;
  /** Characters from which an edit lexes only its own lines. */
  const INCREMENTAL_MIN = 20000;
  /** Languages whose lines lex alone, bar the multi-line tokens `spliceTokens` guards. */
  const INCREMENTAL_LANGUAGES = new Set([
    "js",
    "javascript",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "typescript",
    "tsx",
    "json",
    "jsonc",
    "diff",
  ]);
  /** How long typing pauses before the whole text is lexed. */
  const CORRECTION_DELAY = 150;
  /** The longest the whole lex waits, during typing that never pauses. */
  const CORRECTION_MAX = 1000;

  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: hintId = `hint-${id}`;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = fluid || !!formContext?.isFluid;
  $: trapsTab = indentWithTab && !readonly && !disabled;
  $: describedBy = joinDescribedBy(
    resolveStatusDescribedBy({
      showInvalid,
      showWarn,
      invalidText,
      warnText,
      helperText,
      isFluid,
      errorId,
      warnId,
      helperId,
      includeErrorId: false,
    }),
    trapsTab ? hintId : undefined,
  );

  let ready = false;
  let focused = false;
  let tabEscaped = false;
  let announcement = "";
  /** True while an edit of ours runs, so its own events are left alone. */
  let applying = false;

  /** The text last painted. */
  let text = initialValue;
  let starts = lineStarts(text);
  /** @type {CodeEditorToken[] | undefined} */
  let tokens;
  let tokensText = initialValue;
  let tokensLanguage = "";
  /** @type {typeof tokenize} */
  let tokensSource;
  let tokensFresh = false;
  let lineCount = starts.length;
  let columns = 0;
  let columnsTabSize = 0;

  // Read from the DOM when it resizes or a prop that sets them changes, then
  // kept: reading a layout value on every keystroke forces a layout that the
  // browser would have run once, after the handler.
  let lineHeight = 0;
  let paddingTop = 0;
  let viewport = 0;
  let scrollTop = 0;
  let metricsKey = "";
  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  /** @type {null | HTMLDivElement} */
  let highlightRef = null;

  /** @type {HTMLElement[]} */
  let lineElements = [];
  /** @type {string[]} */
  let lineKeys = [];
  /** @type {HTMLElement[]} */
  let pool = [];
  let paintedFrom = 0;
  let paintedTo = 0;
  let paintedLineCount = 1;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let correctionTimer;
  let pendingSince = 0;
  /** @type {HTMLElement | null} */
  let activeElement = null;
  let activeLine = -1;

  $: digits = Math.max(2, String(lineCount).length);
  $: indentOptions = { indent, tabSize };

  // `sync` and `refresh` read these, which Svelte 3 and 4 cannot see through
  // a call, so name them here.
  $: if (ref) {
    value;
    tokenize;
    language;
    wrapText;
    tabSize;
    rows;
    size;
    lineNumbers;
    sync();
  }

  /**
   * Paint `value`. The textarea takes the same value from `bind:value`, which
   * Svelte 3 and 4 apply after this runs, so the text comes from `value`, not
   * the field. A textarea's undo history survives `bind:value` writing the
   * text it already holds, as it does after every keystroke.
   */
  function sync() {
    if (!ref) return;
    let wanted = value ?? "";
    if (wanted.includes("\r")) wanted = wanted.replace(/\r\n?/g, "\n");
    refresh(wanted);
  }

  /**
   * Paint what changed.
   * @param {string} current the code, as the field holds it
   */
  function refresh(current) {
    if (!ref) return;
    const key = `${size}${wrapText}${tabSize}${lineNumbers}${rows}`;
    const tokensStale =
      !tokensFresh || language !== tokensLanguage || tokenize !== tokensSource;
    // `value` echoes every keystroke back here, after `handleInput` has
    // painted it.
    if (ready && current === text && !tokensStale && key === metricsKey) {
      return;
    }
    if (current !== text) {
      text = current;
      starts = lineStarts(text);
      lineCount = starts.length;
      columnsTabSize = 0;
    }
    updateTokens(tokensStale);
    if (wrapText) columns = 0;
    else if (columnsTabSize !== tabSize) {
      columns = maxColumns(text, tabSize);
      columnsTabSize = tabSize;
    }
    if (key !== metricsKey || !lineHeight) {
      metricsKey = key;
      measure();
    }
    paint(true);
    markActiveLine();
  }

  /**
   * Lex the whole text, except after an edit to a large text in a language
   * whose lines stand alone, where lexing the edited lines is enough for now.
   * A whole lex then follows once typing pauses, which corrects whatever
   * the shortcut got wrong.
   * @param {boolean} stale the tokens are of another language or tokenizer
   */
  function updateTokens(stale) {
    if (!tokenize || !language || !text) {
      tokens = undefined;
    } else {
      if (
        !stale &&
        tokens &&
        text !== tokensText &&
        text.length >= INCREMENTAL_MIN &&
        INCREMENTAL_LANGUAGES.has(language.toLowerCase())
      ) {
        const lex = tokenize;
        const spliced = spliceTokens(tokens, tokensText, text, (code) =>
          lex(code, language),
        );
        if (spliced) {
          tokens = spliced;
          tokensText = text;
          scheduleCorrection();
          return;
        }
      }
      tokens = tokenize(text, language);
    }
    tokensText = text;
    tokensLanguage = language;
    tokensSource = tokenize;
    tokensFresh = true;
    cancelCorrection();
  }

  function scheduleCorrection() {
    const now = Date.now();
    if (!pendingSince) pendingSince = now;
    clearTimeout(correctionTimer);
    correctionTimer = setTimeout(
      correct,
      Math.max(
        0,
        Math.min(CORRECTION_DELAY, CORRECTION_MAX - (now - pendingSince)),
      ),
    );
  }

  function cancelCorrection() {
    clearTimeout(correctionTimer);
    pendingSince = 0;
  }

  function correct() {
    pendingSince = 0;
    if (!tokenize || !language) return;
    tokens = tokenize(text, language);
    tokensText = text;
    paint(true);
    markActiveLine();
  }

  function measure() {
    if (!ref || !scrollerRef) return;
    const styles = getComputedStyle(ref);
    const measured = Number.parseFloat(styles.lineHeight);
    lineHeight = measured > 0 ? measured : size === "sm" ? 16 : 20;
    paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    viewport = scrollerRef.clientHeight;
    scrollTop = scrollerRef.scrollTop;
  }

  function createLine() {
    const element = pool.pop() ?? document.createElement("div");
    if (!element.firstChild) {
      element.className = "bx--code-editor__line";
      element.append(
        Object.assign(document.createElement("span"), {
          className: "bx--code-editor__code",
        }),
      );
    }
    return element;
  }

  /** @param {HTMLElement} element */
  function release(element) {
    element.remove();
    if (pool.length < 200) pool.push(element);
  }

  /**
   * @param {HTMLElement} element
   * @param {(string | null)[]} segments
   */
  function fillLine(element, segments) {
    const code = /** @type {HTMLElement} */ (element.firstChild);
    code.textContent = "";
    for (let index = 0; index < segments.length; index += 2) {
      const type = segments[index];
      const part = /** @type {string} */ (segments[index + 1]);
      if (type && SAFE_TYPE.test(type)) {
        const span = document.createElement("span");
        span.className = `tok-${type}`;
        span.textContent = part;
        code.append(span);
      } else {
        code.append(part);
      }
    }
  }

  /**
   * Paint the lines in view plus some either side, and no others: the
   * textarea owns all the text, so only the colors need DOM, and an editor
   * of 5,000 lines holds about a hundred. A wrapped editor cannot tell which
   * lines are in view without laying them out, so it paints them all.
   * @param {boolean} force repaint even when the painted lines cover the view
   */
  function paint(force) {
    if (!highlightRef || lineHeight <= 0) return;
    let from = 0;
    let to = lineCount;
    if (!wrapText) {
      const view = paintWindow({
        scrollTop,
        viewport,
        lineHeight,
        paddingTop,
        total: lineCount,
        overscan: OVERSCAN,
      });
      if (
        !force &&
        paintedTo > paintedFrom &&
        paintCovers(
          { from: paintedFrom, to: paintedTo },
          view,
          lineCount,
          MARGIN,
        )
      ) {
        return;
      }
      ({ from, to } = view);
    }

    activeElement?.classList.remove("bx--code-editor__line--active");
    activeElement = null;
    const segments = lineSegments(text, starts, tokens, from, to);
    const keys = segments.map((segs) => segs.join("\u0001"));
    if (from === paintedFrom && lineElements.length > 0) {
      reconcile(segments, keys, lineCount - paintedLineCount);
    } else {
      repaint(from, to, segments, keys);
    }
    paintedFrom = from;
    paintedTo = to;
    paintedLineCount = lineCount;
    highlightRef.style.top = wrapText
      ? ""
      : `${paddingTop + from * lineHeight}px`;
    highlightRef.style.counterReset = `ccs-code-line ${from}`;
  }

  /**
   * The window moved: keep the nodes of lines that stay in it.
   * @param {number} from
   * @param {number} to
   * @param {(string | null)[][]} segments
   * @param {string[]} keys
   */
  function repaint(from, to, segments, keys) {
    /** @type {HTMLElement[]} */
    const nextElements = [];
    for (let line = from; line < to; line++) {
      const before = line - paintedFrom;
      const reused = line >= paintedFrom && line < paintedTo;
      const element = reused ? lineElements[before] : createLine();
      if (!reused || lineKeys[before] !== keys[line - from]) {
        fillLine(element, segments[line - from]);
      }
      nextElements.push(element);
    }
    const kept = new Set(nextElements);
    for (const element of lineElements) {
      if (!kept.has(element) && pool.length < 200) pool.push(element);
    }
    highlightRef?.replaceChildren(...nextElements);
    lineElements = nextElements;
    lineKeys = keys;
  }

  /**
   * The window is the same lines of a changed text. An edit changes a few
   * lines, or inserts or removes some and moves the rest, so keep the nodes
   * of the lines before and after the change, and redo only those between.
   * `delta` is how many lines the text gained.
   * @param {(string | null)[][]} segments
   * @param {string[]} keys
   * @param {number} delta
   */
  function reconcile(segments, keys, delta) {
    if (!highlightRef) return;
    const count = keys.length;
    const oldCount = lineElements.length;
    let head = 0;
    const limit = Math.min(oldCount, count);
    while (head < limit && lineKeys[head] === keys[head]) head++;
    let tail = 0;
    for (;;) {
      const at = count - 1 - tail;
      const old = at - delta;
      if (at < head || old < head || old >= oldCount) break;
      if (keys[at] !== lineKeys[old]) break;
      tail++;
    }
    const tailStart = Math.min(Math.max(count - tail - delta, head), oldCount);
    const middle = count - tail - head;
    const anchor = lineElements[tailStart] ?? null;

    const nextElements = lineElements.slice(0, head);
    for (let index = head; index < head + middle; index++) {
      let element = index < tailStart ? lineElements[index] : null;
      if (!element) {
        element = createLine();
        highlightRef.insertBefore(element, anchor);
      }
      fillLine(element, segments[index]);
      nextElements.push(element);
    }
    for (let index = head + middle; index < tailStart; index++) {
      release(lineElements[index]);
    }
    for (let index = 0; index < tail; index++) {
      nextElements.push(lineElements[tailStart + index]);
    }
    for (let index = tailStart + tail; index < oldCount; index++) {
      release(lineElements[index]);
    }
    lineElements = nextElements;
    lineKeys = keys;
  }

  function markActiveLine() {
    if (!ref) return;
    let line = -1;
    if (
      highlightActiveLine &&
      focused &&
      ref.selectionStart === ref.selectionEnd
    ) {
      line = lineAt(starts, ref.selectionEnd);
    }
    const element =
      line >= paintedFrom && line < paintedTo
        ? lineElements[line - paintedFrom]
        : null;
    if (element === activeElement && line === activeLine) return;
    activeElement?.classList.remove("bx--code-editor__line--active");
    element?.classList.add("bx--code-editor__line--active");
    activeElement = element;
    activeLine = line;
  }

  function handleScroll() {
    if (!scrollerRef) return;
    scrollTop = scrollerRef.scrollTop;
    paint(false);
  }

  function handleInput() {
    if (!ref) return;
    value = ref.value;
    refresh(ref.value);
  }

  function handleSelectionChange() {
    if (document.activeElement === ref) markActiveLine();
  }

  function handleFocus() {
    focused = true;
    document.addEventListener("selectionchange", handleSelectionChange);
    markActiveLine();
  }

  function handleBlur() {
    focused = false;
    tabEscaped = false;
    announcement = "";
    document.removeEventListener("selectionchange", handleSelectionChange);
    markActiveLine();
  }

  function handlePointerDown() {
    tabEscaped = false;
  }

  // A form reset restores the field without an input event. Svelte 5 would
  // sync it back on its own with `bind:value`; Svelte 3 and 4 would not, and
  // the field is read here instead.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  /**
   * Replace a range through `execCommand`, which keeps the browser's undo
   * stack (Ctrl+Z undoes the whole edit at once), and fall back to
   * `setRangeText` where it is missing or refuses, such as jsdom.
   * @param {import("../utils/code-edit.js").CodeEdit} edit
   */
  function applyEdit(edit) {
    if (!ref) return;
    applying = true;
    try {
      ref.setSelectionRange(edit.from, edit.to);
      let done = edit.insert === "" && edit.from === edit.to;
      if (!done && typeof document.execCommand === "function") {
        done =
          edit.insert === ""
            ? document.execCommand("delete")
            : document.execCommand("insertText", false, edit.insert);
      }
      if (!done) {
        ref.setRangeText(edit.insert, edit.from, edit.to, "end");
        ref.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: edit.insert ? "insertText" : "deleteContentBackward",
            data: edit.insert || null,
          }),
        );
      }
      ref.setSelectionRange(edit.start, edit.end);
    } finally {
      applying = false;
    }
    markActiveLine();
    // Svelte 3 and 4 write the bound value back to the field once the input
    // event has updated it, and some engines then move the caret to the end.
    // That flush is queued by now, so this runs after it.
    queueMicrotask(() => {
      if (
        ref &&
        (ref.selectionStart !== edit.start || ref.selectionEnd !== edit.end)
      ) {
        ref.setSelectionRange(edit.start, edit.end);
        markActiveLine();
      }
    });
  }

  /** @param {InputEvent} event */
  function handleBeforeInput(event) {
    if (!ref || readonly || applying || event.isComposing) return;
    const { inputType } = event;
    const { value: current, selectionStart: start, selectionEnd: end } = ref;
    /** @type {import("../utils/code-edit.js").CodeEdit | null} */
    let edit = null;
    if (
      autoIndent &&
      (inputType === "insertLineBreak" || inputType === "insertParagraph")
    ) {
      edit = newlineEdit(current, start, end, indentOptions);
    } else if (
      autoClose &&
      inputType === "insertText" &&
      event.data?.length === 1
    ) {
      edit = pairEdit(current, start, end, event.data);
    } else if (autoClose && inputType === "deleteContentBackward") {
      edit = pairBackspaceEdit(current, start, end);
    }
    if (!edit) return;
    event.preventDefault();
    applyEdit(edit);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!ref || isImeComposition(event)) return;
    if (event.key === "Escape") {
      if (trapsTab && !tabEscaped) {
        // The first Escape is spent on releasing Tab, so an Escape handler
        // above (a Modal) sees only the next one.
        tabEscaped = true;
        announcement = tabFocusText;
        event.stopPropagation();
      }
    } else if (
      event.key === "Tab" &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      if (!trapsTab || tabEscaped) return;
      event.preventDefault();
      const edit = indentEdit(
        ref.value,
        ref.selectionStart,
        ref.selectionEnd,
        indentOptions,
        event.shiftKey,
      );
      if (edit) applyEdit(edit);
    } else if (!MODIFIER_KEYS.has(event.key)) {
      tabEscaped = false;
      announcement = "";
    }
  }

  onMount(() => {
    const stopObserving = scrollerRef
      ? observeResize(scrollerRef, () => {
          measure();
          paint(false);
        })
      : () => {};
    ready = true;
    metricsKey = "";
    refresh(ref ? ref.value : initialValue);
    return () => {
      stopObserving();
      cancelCorrection();
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  });
</script>

<div
  class:bx--form-item={true}
  class:bx--code-editor={true}
  class:bx--code-editor--sm={size === "sm"}
  class:bx--code-editor--fluid={isFluid}
  class:bx--text-area--fluid={isFluid}
>
  {#if labelText || $$slots.labelChildren}
    <div class:bx--text-area__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    </div>
  {/if}
  <div
    class:bx--code-editor__wrapper={true}
    class:bx--text-area__wrapper={true}
    class:bx--code-editor__wrapper--readonly={readonly}
    class:bx--code-editor__wrapper--disabled={disabled}
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
      class:bx--code-editor__scroller={true}
      class:bx--code-editor__scroller--wrap={wrapText}
      class:bx--code-editor__scroller--numbered={lineNumbers}
      class:bx--code-editor__scroller--ready={ready}
      style:--ccs-code-editor-rows={rows}
      style:--ccs-code-editor-lines={lineCount}
      style:--ccs-code-editor-digits={digits}
      style:--ccs-code-editor-columns={wrapText ? undefined : columns}
      on:scroll={handleScroll}
    >
      <div class:bx--code-editor__content={true} style:tab-size={tabSize}>
        <textarea
          bind:this={ref}
          bind:value
          use:formReset={handleFormReset}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-errormessage={showInvalid && invalidText ? errorId : undefined}
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          wrap={wrapText ? "soft" : "off"}
          {disabled}
          {id}
          {name}
          {placeholder}
          {readonly}
          class:bx--code-editor__input={true}
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
          on:focus
          on:focus={handleFocus}
          on:blur
          on:blur={handleBlur}
          on:paste
          on:mousedown={handlePointerDown}
          on:beforeinput={handleBeforeInput}></textarea>
        <div
          bind:this={highlightRef}
          class:bx--code-editor__highlight={true}
          aria-hidden="true"
        ></div>
      </div>
    </div>
    {#if isFluid}
      <hr class:bx--text-area__divider={true} />
      {#if showInvalid}
        <div
          id={errorId}
          class:bx--form-requirement={true}
          role={invalidText ? "alert" : undefined}
        >
          {invalidText}
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
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if !isFluid && showInvalid && invalidText}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if !isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if trapsTab}
    <span id={hintId} class:bx--visually-hidden={true}>{escapeHintText}</span>
  {/if}
  <span class:bx--visually-hidden={true} role="status" aria-live="polite"
    >{announcement}</span
  >
</div>
