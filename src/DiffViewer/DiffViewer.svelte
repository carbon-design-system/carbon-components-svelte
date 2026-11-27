<script>
  /**
   * @typedef {{ type: string | null; text: string }} DiffViewerToken
   */

  /**
   * @restProps {div}
   * @event {{ index: number; total: number }} navigate - Dispatched when the current change moves by `next`, `previous` or `goTo`, or by a key or button.
   */

  /**
   * Specify the text before the change. Ignored when `patch` is set.
   */
  export let oldText = "";

  /**
   * Specify the text after the change. Ignored when `patch` is set.
   */
  export let newText = "";

  /**
   * Specify a unified diff, such as the output of `git diff`, to show
   * instead of comparing `oldText` and `newText`. Shows the first file of
   * the patch. The patch holds only the lines near each change, so the rest
   * of the file can't be expanded.
   * @type {string | undefined}
   */
  export let patch = undefined;

  /**
   * Specify how the two sides are laid out.
   * `"split"` puts the old text beside the new; `"unified"` lists removed and
   * added lines one above the other.
   * @type {"split" | "unified"}
   * @bindable writable
   */
  export let view = "split";

  /**
   * Set to `false` to show every unchanged line instead of folding the ones
   * more than `context` lines from a change.
   */
  export let collapseUnchanged = true;

  /**
   * Specify how many unchanged lines to keep around each change.
   */
  export let context = 3;

  /**
   * Set to `true` to treat lines that differ only in whitespace as equal.
   */
  export let ignoreWhitespace = false;

  /**
   * Set to `false` to hide the line numbers.
   */
  export let lineNumbers = true;

  /**
   * Set to `false` to hide the hunk header, the line of line ranges and section
   * name that opens each stretch of lines. A control for folded lines still shows.
   */
  export let hunkHeaders = true;

  /**
   * Set to `true` to wrap long lines. By default they scroll sideways, which
   * keeps every row the same height.
   */
  export let wrap = false;

  /**
   * Specify the size of the rows.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify the height of the viewer, in pixels or as a CSS length. The
   * rows scroll inside it.
   * @type {number | string}
   */
  export let height = 400;

  /**
   * Specify the language of the code, handed to `tokenize`.
   */
  export let language = "";

  /**
   * Specify a function that colors the code, such as `tokenize` from
   * `carbon-components-svelte/syntax`. It gets a whole side of the diff, so
   * a comment that spans lines is colored on every line. Load
   * `css/syntax-tokens.css` and `css/syntax.css` for the colors.
   * @type {((code: string, language: string) => ReadonlyArray<DiffViewerToken> | undefined) | undefined}
   */
  export let tokenize = undefined;

  /**
   * Specify the index of the current change, or -1 for none. Moving it
   * scrolls the change into view.
   * @bindable writable
   */
  export let current = -1;

  /**
   * Set to `false` to hide the toolbar. The keyboard keeps working.
   */
  export let toolbar = true;

  /**
   * Specify the accessible name of the diff. It is not shown.
   */
  export let labelText = "Diff";

  /**
   * Specify the heading over the old side of the split view. Empty hides
   * both headings.
   */
  export let oldLabel = "Original";

  /**
   * Specify the heading over the new side of the split view.
   */
  export let newLabel = "Modified";

  /**
   * Specify the text of the button that shows folded lines.
   * @type {(count: number) => string}
   */
  export let hiddenLinesText = defaultHiddenLinesText;

  /**
   * Specify the text announced after folded lines are shown.
   * @type {(count: number) => string}
   */
  export let shownLinesText = defaultShownLinesText;

  /**
   * Specify the text for lines a patch leaves out and can't show.
   * @type {(count: number) => string}
   */
  export let omittedLinesText = defaultOmittedLinesText;

  /**
   * Specify the text that says which change is current.
   * @type {(index: number, total: number) => string}
   */
  export let changeText = defaultChangeText;

  /**
   * Specify the text read for an added line, ahead of its code.
   * @type {(line: number) => string}
   */
  export let addedLineText = defaultAddedLineText;

  /**
   * Specify the text read for a removed line, ahead of its code.
   * @type {(line: number) => string}
   */
  export let removedLineText = defaultRemovedLineText;

  /**
   * Specify the text that sums up how many lines changed.
   * @type {(added: number, removed: number) => string}
   */
  export let summaryText = defaultSummaryText;

  /**
   * Specify the note shown when the diff has more rows than a list can scroll.
   * @type {(shown: number, total: number) => string}
   */
  export let truncatedText = defaultTruncatedText;

  /** Specify the text shown when the two sides match. */
  export let noChangesText = "No changes";

  /** Specify the label of the previous change button. */
  export let previousChangeLabel = "Previous change";

  /** Specify the label of the next change button. */
  export let nextChangeLabel = "Next change";

  /** Specify the name of the group of view buttons. */
  export let viewLabelText = "Diff view";

  /** Specify the label of the split view button. */
  export let splitText = "Split";

  /** Specify the label of the unified view button. */
  export let unifiedText = "Unified";

  /** Specify the label of the copy button. */
  export let copyLabel = "Copy diff";

  /**
   * Specify the old and new file names written in the copied patch.
   * @type {{ old?: string; new?: string }}
   */
  export let paths = {};

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import ToggleButton from "../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../ToggleButtonGroup/ToggleButtonGroup.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { copyText } from "../utils/copy-text.js";
  import {
    buildRows,
    diffLines,
    formatUnifiedDiff,
    highlightLines,
    inlineRanges,
    lineSegments,
    patchLines,
  } from "../utils/diff-model.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { parseUnifiedDiff } from "../utils/unified-diff.js";

  const dispatch = createEventDispatcher();

  /**
   * Firefox drops a spacer taller than about 17.9M px, and then the list
   * stops scrolling. Show fewer rows than that.
   */
  const MAX_SCROLL_HEIGHT = 15_000_000;
  /** Characters a row can hold before sideways scroll stops growing. */
  const MAX_CHARS = 100_000;
  const TAB_WIDTH = 4;

  /** @param {number} count */
  function defaultHiddenLinesText(count) {
    return count === 1 ? "Show 1 hidden line" : `Show ${count} hidden lines`;
  }

  /** @param {number} count */
  function defaultShownLinesText(count) {
    return count === 1 ? "1 line shown" : `${count} lines shown`;
  }

  /** @param {number} count */
  function defaultOmittedLinesText(count) {
    return count === 1
      ? "1 line is not in the patch"
      : `${count} lines are not in the patch`;
  }

  /**
   * @param {number} index
   * @param {number} total
   */
  function defaultChangeText(index, total) {
    if (total === 0) return "No changes";
    if (index < 0) return total === 1 ? "1 change" : `${total} changes`;
    return `Change ${index + 1} of ${total}`;
  }

  /**
   * @param {number} shown
   * @param {number} total
   */
  function defaultTruncatedText(shown, total) {
    return `Showing the first ${shown} of ${total} rows.`;
  }

  /** @param {number} line */
  function defaultAddedLineText(line) {
    return `Added line ${line}`;
  }

  /** @param {number} line */
  function defaultRemovedLineText(line) {
    return `Removed line ${line}`;
  }

  /**
   * @param {number} added
   * @param {number} removed
   */
  function defaultSummaryText(added, removed) {
    return `${added} ${added === 1 ? "line" : "lines"} added, ${removed} ${removed === 1 ? "line" : "lines"} removed`;
  }

  /**
   * @typedef {import("../utils/diff-model.js").DiffLine} DiffLine
   * @typedef {import("../utils/diff-model.js").DiffRow} DiffRow
   * @typedef {import("../utils/diff-model.js").DiffStats} DiffStats
   * @typedef {{ lines: DiffLine[]; stats: DiffStats; chars: number; digits: number }} DiffData
   */

  /**
   * @param {string} oldValue
   * @param {string} newValue
   * @param {string | undefined} patchValue
   * @param {boolean} ignoreSpace
   * @returns {DiffData}
   */
  function computeDiff(oldValue, newValue, patchValue, ignoreSpace) {
    const [file] = patchValue === undefined ? [] : parseUnifiedDiff(patchValue);
    const result =
      patchValue === undefined
        ? diffLines(oldValue, newValue, { ignoreWhitespace: ignoreSpace })
        : file
          ? patchLines(file)
          : { lines: [], stats: { added: 0, removed: 0, changes: 0 } };
    // The widest line sets how far a row scrolls sideways. A tab is wider
    // than one character.
    let chars = 0;
    let lastNo = 1;
    for (const line of result.lines) {
      lastNo = Math.max(lastNo, line.oldNo, line.newNo);
      if (line.type === "gap") continue;
      let width = line.text.length;
      if (line.text.includes("\t")) {
        width += (line.text.split("\t").length - 1) * (TAB_WIDTH - 1);
      }
      if (width > chars) chars = width;
    }
    return {
      ...result,
      chars: Math.min(chars, MAX_CHARS),
      digits: String(lastNo).length,
    };
  }

  /** @type {{ lines: DiffLine[] | null; tokenize: unknown; language: string; result: DiffData | null }} */
  let highlighted = {
    lines: null,
    tokenize: undefined,
    language: "",
    result: null,
  };

  /**
   * Color the lines of `data`. Gives back the same object when nothing that
   * colors them has changed, so a parent that rebuilds `tokenize` on every
   * render does not tokenize again.
   *
   * @param {DiffData} data
   * @param {typeof tokenize} tokenizer
   * @param {string} lang
   * @returns {DiffData}
   */
  function applyTokens(data, tokenizer, lang) {
    if (
      highlighted.result &&
      highlighted.lines === data.lines &&
      highlighted.tokenize === tokenizer &&
      highlighted.language === lang
    ) {
      return highlighted.result;
    }
    for (const line of data.lines) line.tokens = null;
    if (tokenizer) {
      highlightLines(data.lines, (code) => tokenizer(code, lang));
    }
    const result = { ...data };
    highlighted = {
      lines: data.lines,
      tokenize: tokenizer,
      language: lang,
      result,
    };
    return result;
  }

  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  /** @type {null | HTMLDivElement} */
  let listRef = null;
  /** @type {null | HTMLDivElement} */
  let probeRef = null;
  let mounted = false;
  let viewportHeight = typeof height === "number" ? height : 400;
  let measuredRowHeight = 0;
  /** @type {Set<number>} */
  let expanded = new Set();
  /** @type {DiffLine[] | null} */
  let prevLines = null;
  let prevCurrent = current;
  let announcement = "";

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));

  $: diff = computeDiff(oldText, newText, patch, ignoreWhitespace);
  $: data = applyTokens(diff, tokenize, language);

  // A new diff forgets which folds were open and which change was current.
  $: if (diff.lines !== prevLines) {
    if (prevLines !== null) {
      expanded = new Set();
      current = -1;
      prevCurrent = -1;
    }
    prevLines = diff.lines;
  }

  $: built = buildRows(data.lines, {
    view,
    context: collapseUnchanged
      ? Math.max(0, context)
      : Number.POSITIVE_INFINITY,
    expanded,
    hunkHeaders,
  });
  $: rowHeight = measuredRowHeight || (size === "sm" ? 16 : 20);
  $: maxRows = Math.floor(MAX_SCROLL_HEIGHT / rowHeight);
  $: truncated = built.rows.length > maxRows;
  $: items = truncated ? built.rows.slice(0, maxRows) : built.rows;
  $: changeCount = built.changes.length;
  $: stats = data.stats;
  $: heightStyle = typeof height === "number" ? `${height}px` : height;

  $: if (current !== prevCurrent) {
    prevCurrent = current;
    if (mounted) tick().then(() => scrollToChange(current));
  }

  /**
   * @param {number} id
   * @param {number} hidden
   */
  function expand(id, hidden) {
    // The button leaves with its row, and focus would fall to the page.
    const refocus =
      scrollerRef?.contains(document.activeElement) &&
      document.activeElement !== scrollerRef;
    expanded = new Set(expanded).add(id);
    announcement = shownLinesText(hidden);
    if (refocus) tick().then(() => scrollerRef?.focus({ preventScroll: true }));
  }

  /** Show every folded line. */
  export function expandAll() {
    const next = new Set(expanded);
    for (const row of built.rows) {
      if (row.type === "hunk" && row.id >= 0) next.add(row.id);
    }
    expanded = next;
  }

  /**
   * Move to a change, wrapping past either end, and scroll it into view.
   * @param {number} index
   */
  export function goTo(index) {
    if (changeCount === 0) return;
    current = ((index % changeCount) + changeCount) % changeCount;
    announcement = changeText(current, changeCount);
    dispatch("navigate", { index: current, total: changeCount });
  }

  /** Move to the next change. */
  export function next() {
    goTo(current + 1);
  }

  /** Move to the previous change. */
  export function previous() {
    goTo(current < 0 ? -1 : current - 1);
  }

  /**
   * The diff as a unified patch.
   * @returns {string}
   */
  export function getPatch() {
    return formatUnifiedDiff(data.lines, {
      context: collapseUnchanged ? Math.max(0, context) : 3,
      oldPath: paths.old,
      newPath: paths.new,
    });
  }

  function copyPatch() {
    return copyText(getPatch());
  }

  let scrollRun = 0;

  /** Wait for the list to react to a scroll and render its new window. */
  function nextWindow() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  /** @param {number} index */
  async function scrollToChange(index) {
    const scroller = scrollerRef;
    const row = built.changes[index];
    if (!scroller || row === undefined) return;
    const run = ++scrollRun;
    const offset = listRef?.offsetTop ?? 0;
    const room = Math.max(0, scroller.clientHeight - rowHeight) / 3;
    scroller.scrollTop = Math.max(0, offset + row * rowHeight - room);
    if (!wrap) return;

    // Wrapped rows have no known height until they render, so the guess
    // above lands short or long. Walk toward the row by the average height
    // until it renders, then put it in place.
    for (let attempt = 0; attempt < 12 && run === scrollRun; attempt++) {
      // biome-ignore lint/performance/noAwaitInLoops: each step waits for the window it moved
      await nextWindow();
      const target = scroller.querySelector(`[data-row="${row}"]`);
      if (target instanceof HTMLElement) {
        scroller.scrollTop +=
          target.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top -
          room;
        return;
      }
      const shown = [...scroller.querySelectorAll("[data-row]")].map((el) =>
        Number(el.getAttribute("data-row")),
      );
      const edge =
        row > Math.max(...shown) ? Math.max(...shown) : Math.min(...shown);
      const mean = (scroller.scrollHeight - offset) / items.length;
      scroller.scrollTop += (row - edge) * mean;
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const target = /** @type {HTMLElement} */ (event.target);
    if (target.closest("input, textarea, select, [contenteditable]")) return;
    const key = event.key;
    if (key === "F7") {
      event.preventDefault();
      if (event.shiftKey) previous();
      else next();
    } else if (!event.shiftKey && (key === "n" || key === "p")) {
      event.preventDefault();
      if (key === "n") next();
      else previous();
    }
  }

  /**
   * Selecting text in one side of the split view must not take the other
   * side with it.
   * @param {MouseEvent} event
   */
  function handleMousedown(event) {
    const cell = /** @type {HTMLElement} */ (event.target).closest(
      "[data-side]",
    );
    selectSide = cell instanceof HTMLElement ? (cell.dataset.side ?? "") : "";
  }

  let selectSide = "";

  /** @param {CustomEvent<ReadonlyArray<string>>} event */
  function handleViewChange(event) {
    const [next] = event.detail;
    if (next === "split" || next === "unified") view = next;
  }

  /** @param {DiffLine} line */
  function segmentsOf(line) {
    return lineSegments(line.text, line.tokens, inlineRanges(line));
  }

  onMount(() => {
    mounted = true;
    /** @type {Array<() => void>} */
    const stops = [];
    if (scrollerRef) {
      stops.push(
        observeResize(scrollerRef, () => {
          if (scrollerRef && scrollerRef.clientHeight > 0) {
            viewportHeight = scrollerRef.clientHeight;
          }
        }),
      );
    }
    if (probeRef) {
      stops.push(
        observeResize(probeRef, () => {
          if (probeRef)
            measuredRowHeight = probeRef.getBoundingClientRect().height;
        }),
      );
    }
    if (current >= 0) tick().then(() => scrollToChange(current));
    return () => {
      for (const stop of stops) stop();
    };
  });
</script>

<div
  bind:this={ref}
  class:bx--diff-viewer={true}
  class:bx--diff-viewer--split={view === "split"}
  class:bx--diff-viewer--unified={view === "unified"}
  class:bx--diff-viewer--wrap={wrap}
  class:bx--diff-viewer--sm={size === "sm"}
  data-select-side={selectSide || undefined}
  {...rootProps}
  on:keydown={handleKeydown}
  on:keydown
  on:mousedown={handleMousedown}
  on:mousedown
>
  {#if toolbar}
    <div class:bx--diff-viewer__toolbar={true}>
      <div class:bx--diff-viewer__summary={true}>
        <span
          class:bx--diff-viewer__stat={true}
          class:bx--diff-viewer__stat--added={true}
          aria-hidden="true"
          dir="ltr">+{stats.added}</span
        >
        <span
          class:bx--diff-viewer__stat={true}
          class:bx--diff-viewer__stat--removed={true}
          aria-hidden="true"
          dir="ltr">-{stats.removed}</span
        >
        <span class="bx--visually-hidden"
          >{summaryText(stats.added, stats.removed)}</span
        >
      </div>
      <div class:bx--diff-viewer__actions={true}>
        {#if changeCount > 0}
          <span class:bx--diff-viewer__count={true} aria-hidden="true">
            {changeText(current, changeCount)}
          </span>
        {/if}
        <Button
          kind="ghost"
          size="sm"
          icon={ArrowUp}
          iconDescription={previousChangeLabel}
          tooltipAlign="bottom-end"
          disabled={changeCount === 0}
          aria-keyshortcuts="Shift+F7 P"
          on:click={previous}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={ArrowDown}
          iconDescription={nextChangeLabel}
          tooltipAlign="bottom-end"
          disabled={changeCount === 0}
          aria-keyshortcuts="F7 N"
          on:click={next}
        />
        <ToggleButtonGroup
          size="sm"
          selectionMode="single"
          required
          labelText={viewLabelText}
          selected={[view]}
          on:change={handleViewChange}
        >
          <ToggleButton value="split">{splitText}</ToggleButton>
          <ToggleButton value="unified">{unifiedText}</ToggleButton>
        </ToggleButtonGroup>
        <CopyButton
          kind="ghost"
          size="sm"
          iconDescription={copyLabel}
          copy={copyPatch}
        />
      </div>
    </div>
  {/if}

  <!-- A scroll container must take focus, or a keyboard cannot scroll it. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={scrollerRef}
    class:bx--diff-viewer__scroller={true}
    role="group"
    tabindex="0"
    aria-label={ariaLabel || (ariaLabelledBy ? undefined : labelText)}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    style:block-size={heightStyle}
  >
    <div
      bind:this={probeRef}
      class:bx--diff-viewer__probe={true}
      aria-hidden="true"
    ></div>

    {#if view === "split" && (oldLabel || newLabel)}
      <div class:bx--diff-viewer__labels={true}>
        <span class:bx--diff-viewer__label={true}>{oldLabel}</span>
        <span class:bx--diff-viewer__label={true}>{newLabel}</span>
      </div>
    {/if}

    {#if changeCount === 0}
      <p class:bx--diff-viewer__empty={true}>{noChangesText}</p>
    {/if}

    <div
      bind:this={listRef}
      class:bx--diff-viewer__list={true}
      role="list"
      style:--ccs-diff-chars={wrap ? undefined : data.chars}
      style:--ccs-diff-digits={data.digits}
    >
      <VirtualList
        spacerTag="div"
        scrollElement={scrollerRef}
        {items}
        itemHeight={rowHeight}
        containerHeight={viewportHeight}
        overscan={30}
        measured={wrap}
        let:item
        let:index
      >
        {#if item.type === "hunk"}
          <div
            class:bx--diff-viewer__row={true}
            class:bx--diff-viewer__hunk={true}
            role="listitem"
            data-row={index}
          >
            {#if item.hidden > 0 && item.id >= 0}
              <button
                type="button"
                class:bx--diff-viewer__expand={true}
                on:click={() => expand(item.id, item.hidden)}
              >
                {hiddenLinesText(item.hidden)}
              </button>
            {:else if item.hidden > 0}
              <span class:bx--diff-viewer__omitted={true}>
                {omittedLinesText(item.hidden)}
              </span>
            {/if}
            {#if item.header}
              <span class:bx--diff-viewer__header={true}>{item.header}</span>
            {/if}
          </div>
        {:else if item.type === "pair"}
          <div
            class:bx--diff-viewer__row={true}
            class:bx--diff-viewer__row--pair={true}
            class:bx--diff-viewer__row--current={item.change >= 0 &&
              item.change === current}
            role="listitem"
            data-row={index}
          >
            {#each [item.left, item.right] as line, side (side)}
              <div
                class:bx--diff-viewer__cell={true}
                class:bx--diff-viewer__cell--delete={line?.type === "delete"}
                class:bx--diff-viewer__cell--insert={line?.type === "insert"}
                class:bx--diff-viewer__cell--empty={!line}
                data-side={side === 0 ? "old" : "new"}
                aria-hidden={line ? undefined : "true"}
              >
                {#if line}
                  {#if lineNumbers}<span
                      class:bx--diff-viewer__number={true}
                      aria-hidden="true"
                      >{(side === 0 ? line.oldNo : line.newNo) || ""}</span
                    >{/if}
                  <span class:bx--diff-viewer__marker={true} aria-hidden="true"
                    >{line.type === "delete"
                      ? "-"
                      : line.type === "insert"
                        ? "+"
                        : ""}</span
                  >
                  {#if line.type === "delete"}<span
                      class="bx--visually-hidden bx--diff-viewer__sr"
                      >{removedLineText(line.oldNo)}</span
                    >{:else if line.type === "insert"}<span
                      class="bx--visually-hidden bx--diff-viewer__sr"
                      >{addedLineText(line.newNo)}</span
                    >{/if}<span class:bx--diff-viewer__code={true}
                    >{#each segmentsOf(line) as segment, k (k)}<span
                        class:bx--diff-viewer__word={segment.mark}
                        class={segment.type ? `tok-${segment.type}` : null}
                        >{segment.text}</span
                      >{/each}</span
                  >
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div
            class:bx--diff-viewer__row={true}
            class:bx--diff-viewer__row--delete={item.type === "delete"}
            class:bx--diff-viewer__row--insert={item.type === "insert"}
            class:bx--diff-viewer__row--current={item.change >= 0 &&
              item.change === current}
            role="listitem"
            data-row={index}
          >
            {#if lineNumbers}
              <span class:bx--diff-viewer__number={true} aria-hidden="true"
                >{item.oldNo || ""}</span
              >
              <span class:bx--diff-viewer__number={true} aria-hidden="true"
                >{item.newNo || ""}</span
              >
            {/if}
            <span class:bx--diff-viewer__marker={true} aria-hidden="true"
              >{item.type === "delete"
                ? "-"
                : item.type === "insert"
                  ? "+"
                  : ""}</span
            >
            {#if item.type === "delete"}<span
                class="bx--visually-hidden bx--diff-viewer__sr"
                >{removedLineText(item.oldNo)}</span
              >{:else if item.type === "insert"}<span
                class="bx--visually-hidden bx--diff-viewer__sr"
                >{addedLineText(item.newNo)}</span
              >{/if}<span class:bx--diff-viewer__code={true}
              >{#each segmentsOf(item) as segment, k (k)}<span
                  class:bx--diff-viewer__word={segment.mark}
                  class={segment.type ? `tok-${segment.type}` : null}
                  >{segment.text}</span
                >{/each}</span
            >
          </div>
        {/if}
      </VirtualList>
    </div>
  </div>

  {#if truncated}
    <p class:bx--diff-viewer__empty={true}>
      {truncatedText(items.length, built.rows.length)}
    </p>
  {/if}

  <div class="bx--visually-hidden bx--diff-viewer__status" role="status">
    {announcement}
  </div>
</div>
