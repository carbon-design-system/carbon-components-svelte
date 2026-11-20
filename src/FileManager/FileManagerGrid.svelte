<script>
  /**
   * The grid view of `FileManager`: tiles in a list box, windowed by line.
   * Internal: it holds no state of its own. The parent owns the selection and
   * the cursor and handles keys, drags and clicks for both views.
   */

  /** @type {ReadonlyArray<import("./file-manager-types.js").FileRow>} */
  export let entries = [];

  /** @type {ReadonlyArray<string>} */
  export let selectedIds = [];

  /** The tile that holds the cursor. `aria-activedescendant` names it. */
  export let cursorId = "";

  /** The tile whose name is being edited. */
  export let renamingId = "";

  export let labelText = "";

  /** Height of the scrolling area in pixels. */
  export let height = 400;

  /** The narrowest a tile gets, in pixels. */
  export let minTileWidth = 144;

  /** The height of a line of tiles, in pixels. */
  export let tileHeight = 136;

  /** How many tiles fit a line. Read-only. */
  export let columns = 1;

  /** @type {(entry: import("./file-manager-types.js").FileRow) => any} */
  export let iconFor;

  /** @type {(entry: import("./file-manager-types.js").FileRow) => string | Promise<string> | undefined} */
  export let resolveUrl;

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  /** @type {(name: string, entry: import("./file-manager-types.js").FileRow) => "empty" | "slash" | "dots" | "exists" | null} */
  export let validate;

  export let idPrefix = "file-manager";

  /**
   * The list box element.
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * The scrolling element inside it.
   * @type {null | HTMLDivElement}
   */
  export let scroller = null;

  import { createEventDispatcher, onMount } from "svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import { observeResize } from "../utils/shared-observer.js";
  import FileManagerRename from "./FileManagerRename.svelte";
  import FileManagerThumb from "./FileManagerThumb.svelte";

  const dispatch = createEventDispatcher();

  let width = 0;
  /** @type {Map<string, number>} */
  let indexById = new Map();

  /**
   * @param {ReadonlyArray<import("./file-manager-types.js").FileRow>} list
   * @param {number} count
   */
  function buildLines(list, count) {
    const lines = [];
    for (let start = 0; start < list.length; start += count) {
      lines.push({
        key: start,
        start,
        items: list.slice(start, start + count),
      });
    }
    return lines;
  }

  /** @param {{ key: number }} line */
  function lineKey(line) {
    return line.key;
  }

  onMount(() => {
    if (!ref) return;
    return observeResize(ref, () => {
      width = ref?.clientWidth ?? 0;
    });
  });

  /**
   * @param {ReadonlyArray<import("./file-manager-types.js").FileRow>} list
   */
  function indexEntries(list) {
    const map = new Map();
    for (let i = 0; i < list.length; i++) map.set(list[i].id, i);
    return map;
  }

  /**
   * Scroll so the tile at `index` is in view. Tiles outside the window are not
   * in the DOM, so this works from the line's offset, not from an element.
   * @param {number} index
   */
  export function scrollToIndex(index) {
    if (!scroller || index < 0) return;
    const top = Math.floor(index / columns) * tileHeight;
    const bottom = top + tileHeight;
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (bottom > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = bottom - scroller.clientHeight;
    }
  }

  /** @param {number} index */
  export function optionId(index) {
    return `${idPrefix}-option-${index}`;
  }

  $: columns = Math.max(1, Math.floor(width / minTileWidth));
  $: lines = buildLines(entries, columns);
  $: indexById = indexEntries(entries);
  $: selectedSet = new Set(selectedIds);
  $: cursorIndex = indexById.get(cursorId) ?? -1;
  $: activeDescendant = cursorIndex >= 0 ? optionId(cursorIndex) : undefined;
  $: itemCount = entries.length;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={ref}
  class:bx--file-manager__grid={true}
  role="listbox"
  tabindex="0"
  aria-label={labelText}
  aria-multiselectable="true"
  aria-activedescendant={activeDescendant}
  data-file-host="grid"
>
  <VirtualList
    items={lines}
    itemHeight={tileHeight}
    containerHeight={height}
    overscan={2}
    getKey={lineKey}
    bind:ref={scroller}
    let:item
  >
    <div
      class:bx--file-manager__grid-line={true}
      role="presentation"
      style:--ccs-file-manager-columns={columns}
    >
      {#each item.items as entry, offset (entry.id)}
        {@const index = item.start + offset}
        {@const selected = selectedSet.has(entry.id)}
        {@const renaming = renamingId === entry.id}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          id={optionId(index)}
          role="option"
          aria-selected={selected ? "true" : "false"}
          aria-posinset={index + 1}
          aria-setsize={itemCount}
          class:bx--file-manager__tile={true}
          class:bx--file-manager__tile--selected={selected}
          data-file-path={entry.id}
          data-kind={entry.kind}
          data-cursor={entry.id === cursorId ? "" : undefined}
          draggable={renaming ? undefined : "true"}
        >
          <span class:bx--file-manager__tile-picture={true}>
            <FileManagerThumb {entry} {resolveUrl} icon={iconFor(entry)} />
          </span>
          {#if renaming}
            <FileManagerRename
              {entry}
              {texts}
              {validate}
              on:save={(event) =>
                dispatch("rename:save", { entry, name: event.detail.name })}
              on:cancel={() => dispatch("rename:cancel", { entry })}
            />
          {:else}
            <span class:bx--file-manager__tile-name={true}>{entry.name}</span>
          {/if}
        </div>
      {/each}
    </div>
  </VirtualList>
</div>
