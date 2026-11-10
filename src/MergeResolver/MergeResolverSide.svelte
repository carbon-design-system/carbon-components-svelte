<script>
  /**
   * Internal. One read-only side of a `MergeResolver`: its file's lines in a
   * window of fixed-height rows, with an action row ahead of each conflict.
   */

  /** @type {"ours" | "theirs"} */
  export let side = "ours";

  /** @type {import("../utils/merge-view.js").SideRow[]} */
  export let rows = [];

  /** The length of the longest line, to size the scroll width. */
  export let longest = 0;

  /** @type {ReadonlyArray<{ type: string, ours: string[], theirs: string[] }>} */
  export let chunks = [];

  /** @type {string} */
  export let title = "";

  /** @type {string} */
  export let titleId = "";

  /** @type {null | Array<Array<[string | null, string]>>} */
  export let tokenLines = null;

  /**
   * How each chunk stands, by chunk index.
   * @type {ReadonlyArray<string>}
   */
  export let statuses = [];

  /**
   * The text of each conflict's action row, by chunk index.
   * @type {ReadonlyArray<undefined | { label: string, statusText: string, number: number }>}
   */
  export let heads = [];

  /** The chunk index of the current conflict. */
  export let currentChunk = -1;

  /** Row height in pixels, as measured. */
  export let rowHeight = 20;

  /** Text of the action button in a conflict's row. */
  export let acceptText = "";

  /** Text shown when the side has no lines in a conflict. */
  export let emptyText = "";

  /** Set to `true` to mark the changed words in conflicts. */
  export let wordMarks = true;

  /** Set to `true` to leave the pane out of the layout. */
  export let hidden = false;

  /** @type {null | HTMLDivElement} */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import { markSegments, paintedRows } from "../utils/merge-view.js";
  import { wordDiff } from "../utils/merge3.js";
  import { observeResize } from "../utils/shared-observer.js";

  const dispatch = createEventDispatcher();
  const MAX_TOKENIZED_LINE = 4000;

  let scrollTop = 0;
  let viewport = 640;
  let viewportWidth = 0;

  $: range = paintedRows(scrollTop, viewport, rowHeight, rows.length);
  // A conflict's action row is two rows tall and the row after it paints
  // nothing, so a window may not begin on that second row.
  $: first = rows[range.from]?.kind === "pad" ? range.from - 1 : range.from;
  $: indexes = Array.from({ length: range.to - first }, (_, i) => first + i);

  /** @type {Map<string, ReturnType<typeof wordDiff>>} */
  let markCache = new Map();
  $: if (chunks) markCache = new Map();

  /**
   * @param {number} chunk
   * @param {number} at
   */
  function markRanges(chunk, at) {
    if (!wordMarks) return [];
    const key = `${chunk}:${at}`;
    let pair = markCache.get(key);
    if (pair === undefined) {
      const { ours, theirs } = chunks[chunk];
      pair =
        ours[at] !== undefined && theirs[at] !== undefined
          ? wordDiff(ours[at], theirs[at])
          : null;
      markCache.set(key, pair);
    }
    return pair ? pair[side === "ours" ? "a" : "b"] : [];
  }

  /**
   * @param {import("../utils/merge-view.js").SideRow} row
   * @param {null | Array<Array<[string | null, string]>>} tokens
   * @param {ReadonlyArray<string>} status
   */
  function segmentsOf(row, tokens, status) {
    const runs =
      tokens && row.text.length <= MAX_TOKENIZED_LINE
        ? (tokens[row.no - 1] ?? [[null, row.text]])
        : [[null, row.text]];
    const ranges =
      status[row.chunk] !== undefined && chunks[row.chunk].type === "conflict"
        ? markRanges(row.chunk, row.at)
        : [];
    return markSegments(
      /** @type {Array<[string | null, string]>} */ (runs),
      ranges,
    );
  }

  /**
   * What the gutter shows on a chunk's first line: a mark that doesn't rely
   * on color.
   * @param {import("../utils/merge-view.js").SideRow} row
   * @param {ReadonlyArray<string>} status
   */
  function signOf(row, status) {
    if (row.at !== 0) return "";
    const kind = chunks[row.chunk].type;
    if (kind === "conflict") {
      return status[row.chunk] === "unresolved" ? "!" : "✓";
    }
    if (kind === "unchanged") return "";
    return kind === "both" || kind === side ? "~" : "";
  }

  /**
   * @param {string} kind
   * @param {string} state
   */
  function tintOf(kind, state) {
    if (kind === "conflict") {
      return state === "unresolved" ? "conflict" : "resolved";
    }
    if (kind === "both" || kind === side) return "changed";
    return "";
  }

  function handleScroll() {
    if (ref) scrollTop = ref.scrollTop;
    dispatch("scroll");
  }

  onMount(() => {
    if (!ref) return;
    scrollTop = ref.scrollTop;
    return observeResize(ref, () => {
      if (ref) {
        viewport = ref.clientHeight;
        viewportWidth = ref.clientWidth;
      }
      dispatch("resize");
    });
  });
</script>

<div
  class:bx--merge-resolver__pane={true}
  class:bx--merge-resolver__pane--ours={side === "ours"}
  class:bx--merge-resolver__pane--theirs={side === "theirs"}
  class:bx--merge-resolver__pane--hidden={hidden}
>
  <div class:bx--merge-resolver__title={true} id={titleId}>{title}</div>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={ref}
    class:bx--merge-resolver__scroller={true}
    role="group"
    aria-labelledby={titleId}
    tabindex="0"
    style:--ccs-merge-viewport={viewportWidth
      ? `${viewportWidth}px`
      : undefined}
    on:scroll={handleScroll}
  >
    <div
      class:bx--merge-resolver__sizer={true}
      style:height="calc({rows.length} * var(--ccs-merge-row-height))"
      style:min-width="calc(var(--ccs-merge-gutter) + {longest + 2}ch)"
    >
      <div
        class:bx--merge-resolver__window={true}
        style:transform="translateY(calc({first} * var(--ccs-merge-row-height)))"
      >
        {#each indexes as index (index)}
          {@const row = rows[index]}
          {@const chunk = chunks[row.chunk]}
          {@const state = statuses[row.chunk]}
          {@const current = row.chunk === currentChunk}
          {#if row.kind === "head"}
            {@const head = heads[row.chunk]}
            <div
              class:bx--merge-resolver__head={true}
              class:bx--merge-resolver__head--current={current}
              class:bx--merge-resolver__head--resolved={state !== "unresolved"}
              role="group"
              aria-label={head
                ? `${head.label}: ${head.statusText}`
                : undefined}
              aria-current={current ? "true" : undefined}
            >
              <span class:bx--merge-resolver__head-label={true}
                >{head?.label}<span class:bx--merge-resolver__badge={true}
                  >{head?.statusText}</span
                >{#if (side === "ours" ? chunk.ours : chunk.theirs).length === 0}<span
                    class:bx--merge-resolver__badge={true}>{emptyText}</span
                  >{/if}</span
              >
              <Button
                kind="tertiary"
                size="sm"
                aria-label={head ? `${acceptText}, ${head.label}` : acceptText}
                on:click={() => dispatch("accept", { chunk: row.chunk, side })}
                >{acceptText}</Button
              >
            </div>
          {:else if row.kind === "line"}
            {@const tint = tintOf(chunk.type, state)}
            <div
              class:bx--merge-resolver__row={true}
              class:bx--merge-resolver__row--conflict={tint === "conflict"}
              class:bx--merge-resolver__row--resolved={tint === "resolved"}
              class:bx--merge-resolver__row--changed={tint === "changed"}
              class:bx--merge-resolver__row--current={current}
            >
              <span class:bx--merge-resolver__gutter={true} aria-hidden="true"
                ><span class:bx--merge-resolver__sign={true}
                  >{signOf(row, statuses)}</span
                ><span class:bx--merge-resolver__no={true}>{row.no}</span></span
              ><span class:bx--merge-resolver__code={true}
                >{#each segmentsOf(row, tokenLines, statuses) as seg, at (at)}{#if seg[0] || seg[2]}<span
                      class:bx--merge-resolver__mark={seg[2]}
                      class={seg[0] ? `tok-${seg[0]}` : undefined}
                      >{seg[1]}</span
                    >{:else}{seg[1]}{/if}{/each}</span
              >
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>
