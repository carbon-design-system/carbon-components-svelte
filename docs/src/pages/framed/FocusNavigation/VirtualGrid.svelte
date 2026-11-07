<script>
  import {
    createFocusNav,
    focusNav,
    mountedIndexes,
    Stack,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  const COLUMNS = 10;
  const ROW_HEIGHT = 32;
  const VIEWPORT = 256;
  const OVERSCAN = 4;
  const COUNT = 10_000;
  const ROWS = COUNT / COLUMNS;

  let grid;
  let scrollTop = 0;

  // Only the visible rows are in the DOM, and the row holding the cursor
  // stays mounted, so `aria-activedescendant` never names a cell that is gone.
  $: first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  $: last = Math.min(
    ROWS,
    Math.ceil((scrollTop + VIEWPORT) / ROW_HEIGHT) + OVERSCAN,
  );
  $: activeRow = $nav.index < 0 ? -1 : Math.floor($nav.index / COLUMNS);
  $: rows = mountedIndexes(first, last, activeRow);

  const nav = createFocusNav({
    mode: "activedescendant",
    orientation: "grid",
    columns: COLUMNS,
    count: COUNT,
    pageSize: VIEWPORT / ROW_HEIGHT - 1,
    ctrlArrows: true,
    rtl: () => grid && getComputedStyle(grid).direction === "rtl",
    getItem: (i) => grid?.querySelector(`#cell-${i}`),
    getId: (i) => `cell-${i}`,
    // Called before every move. Scroll the target into view, and wait for the
    // render when that mounts it.
    reveal: (i) => {
      if (!grid) return undefined;
      const top = Math.floor(i / COLUMNS) * ROW_HEIGHT;
      let next = grid.scrollTop;
      if (top < next) next = top;
      else if (top + ROW_HEIGHT > next + VIEWPORT)
        next = top + ROW_HEIGHT - VIEWPORT;
      if (next === grid.scrollTop) return undefined;
      grid.scrollTop = next;
      scrollTop = next;
      return tick();
    },
  });
</script>

<Stack gap={3}>
  <div
    bind:this={grid}
    role="grid"
    tabindex="0"
    aria-label="10,000 cells"
    aria-rowcount={ROWS}
    aria-colcount={COLUMNS}
    aria-activedescendant={$nav.activeId}
    class="grid"
    on:scroll={() => (scrollTop = grid.scrollTop)}
    use:focusNav={nav}
  >
    <div class="spacer" style:height="{ROWS * ROW_HEIGHT}px">
      {#each rows as row (row)}
        <div
          role="row"
          aria-rowindex={row + 1}
          class="row"
          style:top="{row * ROW_HEIGHT}px"
        >
          {#each Array.from({ length: COLUMNS }, (_, column) => row * COLUMNS + column) as i (i)}
            <div
              role="gridcell"
              id="cell-{i}"
              aria-colindex={(i % COLUMNS) + 1}
              class="cell"
              class:cursor={i === $nav.index}
            >
              {i}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <p>
    Cursor: {$nav.index < 0 ? "none" : $nav.index}. {rows.length * COLUMNS} cells
    are in the DOM.
  </p>
</Stack>

<style>
  .grid {
    block-size: 256px;
    max-inline-size: 36rem;
    overflow: auto;
    border: 1px solid var(--cds-border-strong-01);
    background: var(--cds-layer-01);
    color: var(--cds-text-primary);
  }

  .grid:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .spacer {
    position: relative;
  }

  .row {
    position: absolute;
    inset-inline: 0;
    display: flex;
    gap: 1px;
    block-size: 32px;
  }

  .cell {
    flex: 1;
    min-inline-size: 0;
    box-sizing: border-box;
    padding: 0 0.5rem;
    line-height: 32px;
    text-align: center;
    background: var(--cds-layer-02);
  }

  .cursor {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }
</style>
