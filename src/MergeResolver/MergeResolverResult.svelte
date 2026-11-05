<script>
  /**
   * Internal. The editable result of a `MergeResolver`: a native textarea
   * with a window of highlighted rows painted around it. The browser keeps
   * the caret, the selection, composition and the clipboard; the rows only
   * draw. Text goes in a layer above the textarea so a selection never
   * hides it, and tint and gutter go in layers around it.
   */

  /** The text to start the textarea with. Changing it resets the textarea. */
  export let seed = "";

  /**
   * The result's lines, to paint.
   * @type {string[]}
   */
  export let lines = [];

  /** @type {null | Array<Array<[string | null, string]>>} */
  export let tokenLines = null;

  /**
   * The first line of each chunk, with the line count last.
   * @type {number[]}
   */
  export let lineStarts = [0];

  /**
   * How each chunk stands, by chunk index.
   * @type {ReadonlyArray<string>}
   */
  export let statuses = [];

  /** The chunk index of the current conflict. */
  export let currentChunk = -1;

  /** Row height in pixels, as measured. */
  export let rowHeight = 20;

  /** @type {string} */
  export let title = "";

  /** @type {string} */
  export let titleId = "";

  /** @type {string | undefined} */
  export let describedBy = undefined;

  /** Set to `true` to leave the pane out of the layout. */
  export let hidden = false;

  /** Set to `true` to make the text read-only. */
  export let readonly = false;

  /** @type {null | HTMLTextAreaElement} */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { paintedRows } from "../utils/merge-view.js";
  import { observeResize } from "../utils/shared-observer.js";

  const dispatch = createEventDispatcher();
  const MAX_TOKENIZED_LINE = 4000;
  const MARKER = /^(<{7}|={7}|>{7})( |$)/;

  let scrollTop = 0;
  let scrollLeft = 0;
  let viewport = 640;

  $: range = paintedRows(scrollTop, viewport, rowHeight, lines.length);
  $: indexes = Array.from(
    { length: range.to - range.from },
    (_, i) => range.from + i,
  );

  /**
   * The chunk whose text a line starts in.
   * @param {number} line
   * @param {number[]} starts
   */
  function chunkOfLine(line, starts) {
    let low = 0;
    let high = Math.max(0, starts.length - 2);
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid] <= line) low = mid;
      else high = mid - 1;
    }
    return low;
  }

  /**
   * @param {string} text
   * @param {string | undefined} state
   */
  function isMarker(text, state) {
    return state === "unresolved" && MARKER.test(text);
  }

  /** @param {string | undefined} state */
  function tintOf(state) {
    if (state === "unresolved") return "conflict";
    if (state === "merged") return "changed";
    if (state === "unchanged" || state === undefined) return "";
    return "resolved";
  }

  /**
   * @param {number} line
   * @param {number[]} starts
   * @param {ReadonlyArray<string>} status
   */
  function signOf(line, starts, status) {
    const chunk = chunkOfLine(line, starts);
    if (starts[chunk] !== line) return "";
    const state = status[chunk];
    if (state === "unresolved") return "!";
    if (state === "merged") return "~";
    if (state === "unchanged" || state === undefined) return "";
    return "✓";
  }

  /**
   * @param {number} line
   * @param {null | Array<Array<[string | null, string]>>} tokens
   * @param {boolean} marker A marker line is left out of the tokens, so it
   * reads as plain text.
   */
  function runsOf(line, tokens, marker) {
    const text = lines[line] ?? "";
    if (!tokens || marker || text.length > MAX_TOKENIZED_LINE) {
      return [[null, text]];
    }
    return tokens[line] ?? [[null, text]];
  }

  function handleScroll() {
    if (ref) {
      scrollTop = ref.scrollTop;
      scrollLeft = ref.scrollLeft;
    }
    dispatch("scroll");
  }

  onMount(() => {
    if (!ref) return;
    scrollTop = ref.scrollTop;
    return observeResize(ref, () => {
      if (ref) viewport = ref.clientHeight;
      dispatch("resize");
    });
  });
</script>

<div
  class:bx--merge-resolver__pane={true}
  class:bx--merge-resolver__pane--result={true}
  class:bx--merge-resolver__pane--hidden={hidden}
>
  <div class:bx--merge-resolver__title={true} id={titleId}>{title}</div>
  <div class:bx--merge-resolver__editor={true}>
    <div class:bx--merge-resolver__layer={true} aria-hidden="true">
      <div
        class:bx--merge-resolver__window={true}
        style:transform="translateY(calc({range.from} * var(--ccs-merge-row-height)
        - {scrollTop}px))"
      >
        {#each indexes as index (index)}
          {@const chunk = chunkOfLine(index, lineStarts)}
          {@const state = statuses[chunk]}
          {@const tint = tintOf(state)}
          <div
            class:bx--merge-resolver__row={true}
            class:bx--merge-resolver__row--conflict={tint === "conflict"}
            class:bx--merge-resolver__row--resolved={tint === "resolved"}
            class:bx--merge-resolver__row--changed={tint === "changed"}
            class:bx--merge-resolver__row--current={chunk === currentChunk}
          ></div>
        {/each}
      </div>
    </div>
    <textarea
      bind:this={ref}
      class:bx--merge-resolver__textarea={true}
      value={seed}
      {readonly}
      wrap="off"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      on:scroll={handleScroll}
      on:beforeinput
      on:input
      on:click
      on:keyup
      on:focus
      on:blur></textarea>
    <div
      class:bx--merge-resolver__layer={true}
      class:bx--merge-resolver__layer--gutter={true}
      aria-hidden="true"
    >
      <div
        class:bx--merge-resolver__window={true}
        style:transform="translateY(calc({range.from} * var(--ccs-merge-row-height)
        - {scrollTop}px))"
      >
        {#each indexes as index (index)}
          <div class:bx--merge-resolver__row={true}>
            <span class:bx--merge-resolver__gutter={true}
              ><span class:bx--merge-resolver__sign={true}
                >{signOf(index, lineStarts, statuses)}</span
              ><span class:bx--merge-resolver__no={true}>{index + 1}</span
              ></span
            >
          </div>
        {/each}
      </div>
    </div>
    <div
      class:bx--merge-resolver__layer={true}
      class:bx--merge-resolver__layer--code={true}
      aria-hidden="true"
    >
      <div
        class:bx--merge-resolver__window={true}
        style:transform="translate(-{scrollLeft}px, calc({range.from} * var(--ccs-merge-row-height)
        - {scrollTop}px))"
      >
        {#each indexes as index (index)}
          {@const state = statuses[chunkOfLine(index, lineStarts)]}
          {@const marker = isMarker(lines[index] ?? "", state)}
          <div
            class:bx--merge-resolver__row={true}
            class:bx--merge-resolver__row--marker={marker}
          >
            <span class:bx--merge-resolver__code={true}
              >{#each runsOf(index, tokenLines, marker) as seg, at (at)}{#if seg[0]}<span
                    class="tok-{seg[0]}">{seg[1]}</span
                  >{:else}{seg[1]}{/if}{/each}</span
            >
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
