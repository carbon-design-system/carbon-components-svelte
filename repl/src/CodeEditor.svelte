<script>
  /**
   * Zero-dependency code editor: a real <textarea> (input, IME, selection,
   * undo, accessibility) stacked over a <pre> with one text node that the
   * CSS Custom Highlight API colors. No-wrap only in this spike.
   *
   * @event {string} input - The edited value.
   * @event save - Cmd/Ctrl+S.
   * @event {{ ms: number; ranges: number; tokens: number; lines: number }} paint
   */
  import { tokenize } from "carbon-components-svelte/src/syntax/tokenize.js";
  import { createEventDispatcher, onMount } from "svelte";
  import { createPainter, tokenStarts } from "./editor/paint.js";
  import {
    indent,
    lineAt,
    lineStarts,
    newline,
    outdent,
    toggleComment,
  } from "./editor/text.js";

  /** @type {string} */
  export let value = "";

  /** Tokenizer language (`svelte`, `js`, `json`, …). */
  export let language = "svelte";

  /** @type {{ severity: "error" | "warning"; start?: number; end?: number }[]} */
  export let diagnostics = [];

  export let label = "Code";

  const dispatch = createEventDispatcher();
  const MARGIN_LINES = 20;
  const PAD_TOP = 8;
  const PAD_X = 12;

  /** @type {HTMLDivElement} */
  let scroller;
  /** @type {HTMLTextAreaElement} */
  let textarea;
  /** @type {HTMLPreElement} */
  let paintEl;
  /** @type {HTMLSpanElement} */
  let measureEl;
  /** @type {Text} */
  let textNode;
  /** @type {ReturnType<typeof createPainter> | undefined} */
  let painter;

  let current = value;
  let starts = lineStarts(value);
  let lineCount = starts.length;
  /** @type {{ tokens: { type: string | null; text: string }[]; starts: Int32Array }} */
  let tokenized = { tokens: [], starts: new Int32Array() };
  let lineHeight = 20;
  let charWidth = 8.4;
  let gutterPx = 0;
  let activeLine = 0;
  let focused = false;
  let composing = false;
  let escapeArmed = false;
  let painted = [-1, -1];
  let frame = 0;
  // Cached viewport metrics: reading scrollTop/clientHeight right after a text
  // change would force a synchronous layout on every keystroke.
  let viewTop = 0;
  let viewLeft = 0;
  let viewHeight = 600;
  let viewWidth = 600;
  let revealFrame = 0;

  $: gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  $: digits = String(lineCount).length;

  // External changes (file switch, example load) replace the document. The
  // parent's `value` lags the textarea while typing (edits flush on compile),
  // and a parent re-render can re-run this statement with that stale value,
  // so only an actual change of the prop counts.
  let lastValue = value;
  $: if (textNode) onValue(value);
  $: if (painter) retokenize(language);
  $: if (painter) repaint(true, diagnostics);

  function onValue(next) {
    if (next === lastValue) return;
    lastValue = next;
    if (next !== current) replace(next);
  }

  function replace(next) {
    current = next;
    textarea.value = next;
    textarea.setSelectionRange(0, 0);
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
    viewTop = 0;
    viewLeft = 0;
    sync();
    updateActiveLine();
  }

  /** Mirror the textarea into the paint layer and recolor. */
  function sync() {
    const t0 = performance.now();
    textNode.data = `${current} `;
    starts = lineStarts(current);
    if (starts.length !== lineCount) lineCount = starts.length;
    const t1 = performance.now();
    const ranges = retokenize(language);
    const t3 = performance.now();
    dispatch("paint", {
      ms: t3 - t0,
      text: t1 - t0,
      tokenize: timings.tokenize,
      ranges: timings.paint,
      count: ranges,
      tokens: tokenized.tokens.length,
      lines: lineCount,
    });
  }

  const timings = { tokenize: 0, paint: 0 };

  function retokenize(lang) {
    if (!textNode) return 0;
    const t0 = performance.now();
    const tokens = tokenize(current, lang) ?? [{ type: null, text: current }];
    tokenized = { tokens, starts: tokenStarts(tokens) };
    const t1 = performance.now();
    const count = repaint(true);
    timings.tokenize = t1 - t0;
    timings.paint = performance.now() - t1;
    return count;
  }

  function diagnosticRanges() {
    return diagnostics.filter((d) => d.start !== undefined);
  }

  /** Paint the visible lines (± margin); skip if already covered. */
  function repaint(force) {
    if (!painter?.supported) return 0;
    const first = Math.max(
      0,
      Math.floor((viewTop - PAD_TOP) / lineHeight) - MARGIN_LINES,
    );
    const last = Math.min(
      lineCount - 1,
      Math.ceil((viewTop + viewHeight) / lineHeight) + MARGIN_LINES,
    );
    if (!force && first >= painted[0] && last <= painted[1]) return 0;
    const from = starts[first] ?? 0;
    const to = last + 1 < starts.length ? starts[last + 1] : current.length;
    painted = [first, last];
    return painter.paint(tokenized, from, to, diagnosticRanges());
  }

  function updateActiveLine() {
    activeLine = lineAt(starts, textarea.selectionEnd);
  }

  /** Visual column of `offset` (tabs expand to tab stops of 2). */
  function column(offset) {
    const lineStart = starts[lineAt(starts, offset)];
    let col = 0;
    for (let i = lineStart; i < offset; i++)
      col = current[i] === "\t" ? col + 2 - (col % 2) : col + 1;
    return col;
  }

  /**
   * Keep the caret visible inside the scroller (monospace, no wrap). Uses the
   * cached viewport so it never forces a layout; only writes scroll offsets.
   */
  function revealCaret() {
    const offset = textarea.selectionEnd;
    const y = PAD_TOP + lineAt(starts, offset) * lineHeight;
    const x = gutterPx + PAD_X + column(offset) * charWidth;
    if (y < viewTop) scroller.scrollTop = y - PAD_TOP;
    else if (y + lineHeight > viewTop + viewHeight) {
      scroller.scrollTop = y + lineHeight + PAD_TOP - viewHeight;
    }
    if (x < viewLeft + gutterPx + PAD_X) {
      scroller.scrollLeft = x - gutterPx - PAD_X;
    } else if (x + charWidth > viewLeft + viewWidth - PAD_X) {
      scroller.scrollLeft = x + charWidth + PAD_X - viewWidth;
    }
  }

  function scheduleReveal() {
    cancelAnimationFrame(revealFrame);
    revealFrame = requestAnimationFrame(revealCaret);
  }

  function onInput() {
    current = textarea.value;
    sync();
    updateActiveLine();
    dispatch("input", current);
    if (!composing) scheduleReveal();
  }

  /** Apply an edit through the textarea so native undo keeps working. */
  function apply(edit) {
    textarea.setSelectionRange(edit.from, edit.to);
    const ok = edit.insert
      ? document.execCommand("insertText", false, edit.insert)
      : document.execCommand("delete");
    if (!ok) {
      textarea.setRangeText(edit.insert, edit.from, edit.to, "end");
      onInput();
    }
    textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    updateActiveLine();
    scheduleReveal();
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.isComposing || composing) return;
    const mod = e.metaKey || e.ctrlKey;
    const { selectionStart: s, selectionEnd: end } = textarea;

    if (e.key === "Escape") {
      escapeArmed = true;
      return;
    }
    if (e.key === "Tab" && !mod && !e.altKey) {
      if (escapeArmed) {
        escapeArmed = false;
        return; // Escape, then Tab: let focus leave the editor.
      }
      e.preventDefault();
      apply(e.shiftKey ? outdent(current, s, end) : indent(current, s, end));
      return;
    }
    escapeArmed = false;
    if (e.key === "Enter" && !mod && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      apply(newline(current, s, end));
    } else if (e.key === "/" && mod) {
      e.preventDefault();
      apply(toggleComment(current, s, end, language));
    } else if (e.key === "s" && mod) {
      e.preventDefault();
      dispatch("save");
    }
  }

  function measure() {
    lineHeight =
      Number.parseFloat(getComputedStyle(paintEl).lineHeight) || lineHeight;
    charWidth = measureEl.getBoundingClientRect().width / 100 || charWidth;
    gutterPx =
      paintEl.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft -
      PAD_X;
  }

  onMount(() => {
    textNode = document.createTextNode("");
    paintEl.append(textNode);
    painter = createPainter(textNode);
    textarea.value = current;
    measure();
    document.fonts?.ready.then(() => {
      measure();
      repaint(true);
    });
    const onSelection = () => {
      if (document.activeElement === textarea) updateActiveLine();
    };
    document.addEventListener("selectionchange", onSelection);
    const resize = new ResizeObserver(([entry]) => {
      viewHeight = entry.contentRect.height;
      viewWidth = entry.contentRect.width;
      repaint(false);
    });
    resize.observe(scroller);
    sync();
    return () => {
      resize.disconnect();
      document.removeEventListener("selectionchange", onSelection);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrame);
      painter?.clear();
    };
  });

  function onScroll() {
    viewTop = scroller.scrollTop;
    viewLeft = scroller.scrollLeft;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => repaint(false));
  }
</script>

<div class="ce" class:ce--composing={composing} class:ce--focused={focused}>
  <div class="ce-scroller" bind:this={scroller} on:scroll={onScroll}>
    <div class="ce-content" style:--ce-digits={digits}>
      <pre class="ce-gutter" aria-hidden="true">{gutter}</pre>
      <div class="ce-stack">
        <div
          class="ce-active-line"
          aria-hidden="true"
          style:transform="translateY({activeLine * lineHeight}px)"
          style:height="{lineHeight}px"
        ></div>
        <pre
          class="ce-text ce-paint"
          aria-hidden="true"
          bind:this={paintEl}
        ></pre>
        <textarea
          bind:this={textarea}
          class="ce-text ce-input"
          aria-label={label}
          aria-multiline="true"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          wrap="off"
          on:input={onInput}
          on:keydown={onKeydown}
          on:focus={() => (focused = true)}
          on:blur={() => (focused = false)}
          on:compositionstart={() => (composing = true)}
          on:compositionend={() => {
            composing = false;
            onInput();
          }}
          on:scroll={() => {
            // The textarea is as large as its content; never scroll it internally.
            textarea.scrollTop = 0;
            textarea.scrollLeft = 0;
          }}
        ></textarea>
      </div>
    </div>
    <span class="ce-text ce-measure" aria-hidden="true" bind:this={measureEl}
      >{"0".repeat(100)}</span
    >
  </div>
</div>

<style>
  .ce {
    position: relative;
    flex: 1;
    min-height: 0;
    background: var(--cds-field-01, #f4f4f4);
  }

  .ce-scroller {
    position: absolute;
    inset: 0;
    overflow: auto;
  }

  .ce-content {
    display: flex;
    min-width: 100%;
    min-height: 100%;
    width: max-content;
  }

  .ce-text,
  .ce-gutter {
    margin: 0;
    font-family: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
    letter-spacing: 0;
    tab-size: 2;
    white-space: pre;
  }

  .ce-gutter {
    position: sticky;
    left: 0;
    z-index: 2;
    flex: none;
    box-sizing: content-box;
    width: calc(var(--ce-digits) * 1ch);
    padding: 0.5rem 0.75rem 0.5rem 1rem;
    text-align: right;
    color: var(--cds-text-03, #a8a8a8);
    background: var(--cds-field-01, #f4f4f4);
    border-right: 1px solid var(--cds-ui-03, #e0e0e0);
    user-select: none;
  }

  .ce-stack {
    position: relative;
    flex: 1 0 auto;
    display: grid;
    grid-template: 1fr / 1fr;
  }

  .ce-paint,
  .ce-input {
    grid-area: 1 / 1;
    box-sizing: border-box;
    padding: 0.5rem 0.75rem;
    border: 0;
    overflow-wrap: normal;
    word-break: normal;
  }

  .ce-paint {
    position: relative;
    z-index: 1;
    color: var(--cds-text-01, #161616);
    pointer-events: none;
  }

  .ce-input {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    resize: none;
    outline: 0;
    color: transparent;
    caret-color: var(--cds-text-01, #161616);
    background: transparent;
  }

  .ce-input::selection {
    color: transparent;
    background: rgb(15 98 254 / 25%);
  }

  .ce--composing .ce-input {
    color: var(--cds-text-01, #161616);
  }

  .ce--composing .ce-paint {
    color: transparent;
  }

  .ce-active-line {
    position: absolute;
    top: 0.5rem;
    left: 0;
    right: 0;
    visibility: hidden;
    background: var(--cds-highlight, #d0e2ff);
    opacity: 0.45;
  }

  .ce--focused .ce-active-line {
    visibility: visible;
  }

  .ce--focused .ce-scroller {
    box-shadow: inset 0 0 0 2px var(--cds-focus, #0f62fe);
  }

  .ce-measure {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }
</style>
