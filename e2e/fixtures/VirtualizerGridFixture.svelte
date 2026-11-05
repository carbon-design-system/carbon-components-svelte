<script>
  import { Button } from "carbon-components-svelte";
  import {
    attachGridScroller,
    syncScroll,
  } from "carbon-components-svelte/utils/virtualizer-dom.js";
  import { createGridVirtualizer } from "carbon-components-svelte/utils/virtualizer.js";
  import { onMount } from "svelte";

  const ROWS = 1000;
  const COLUMNS = 1000;
  const ROW_SIZE = 32;
  const COLUMN_SIZE = 96;

  const grid = createGridVirtualizer({
    rows: { count: ROWS, size: ROW_SIZE, viewportSize: 256, overscan: 2 },
    columns: {
      count: COLUMNS,
      size: COLUMN_SIZE,
      viewportSize: 384,
      overscan: 2,
    },
  });

  /** @type {HTMLElement | undefined} */
  let body;
  /** @type {HTMLElement | undefined} */
  let header;

  $: rows = $grid.rows;
  $: columns = $grid.columns;
  $: rowIndices = Array.from(
    { length: rows.endIndex - rows.startIndex },
    (_, i) => rows.startIndex + i,
  );
  $: columnIndices = Array.from(
    { length: columns.endIndex - columns.startIndex },
    (_, i) => columns.startIndex + i,
  );

  onMount(() => {
    if (!body || !header) return;
    const stopBody = attachGridScroller(grid, body);
    // The header scrolls with the body along the inline axis only.
    const stopSync = syncScroll([body, header], { axis: "x" });
    return () => {
      stopBody();
      stopSync();
    };
  });
</script>

<div class="grid-demo">
  <Button
    data-testid="to-cell"
    size="small"
    on:click={() => grid.scrollToCell(500, 700, { align: "center" })}
  >
    Scroll to row 500, column 700
  </Button>
  <div class="frame">
    <div bind:this={header} class="header" data-testid="header">
      <div class="header-track" style:inline-size="{columns.totalSize}px">
        {#each columnIndices as column (column)}
          <div
            class="column-head"
            style:inset-inline-start="{grid.columns.offsetOf(column)}px"
          >
            Col {column}
          </div>
        {/each}
      </div>
    </div>
    <!-- A scroll container takes the keyboard, so it needs a tab stop. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={body}
      class="body"
      data-testid="body"
      role="region"
      aria-label="Cells"
      tabindex="0"
    >
      <div
        class="body-track"
        style:inline-size="{columns.totalSize}px"
        style:block-size="{rows.totalSize}px"
      >
        {#each rowIndices as row (row)}
          {#each columnIndices as column (column)}
            <div
              class="cell"
              data-cell="{row},{column}"
              style:inset-block-start="{grid.rows.offsetOf(row)}px"
              style:inset-inline-start="{grid.columns.offsetOf(column)}px"
            >
              {row},{column}
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .grid-demo {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
    max-inline-size: 100%;
  }

  .frame {
    inline-size: min(384px, 100%);
  }

  .header {
    overflow: hidden;
    block-size: 32px;
    border-block-end: 1px solid var(--cds-border-strong, #8d8d8d);
  }

  .header-track,
  .body-track {
    position: relative;
  }

  .header-track {
    block-size: 32px;
  }

  .body {
    overflow: auto;
    block-size: 256px;
  }

  .column-head,
  .cell {
    position: absolute;
    box-sizing: border-box;
    inline-size: 96px;
    block-size: 32px;
    padding: 0.5rem;
    overflow: hidden;
    white-space: nowrap;
    font-size: 0.75rem;
    border-inline-end: 1px solid var(--cds-border-subtle, #c6c6c6);
    border-block-end: 1px solid var(--cds-border-subtle, #c6c6c6);
  }

  .column-head {
    inset-block-start: 0;
    font-weight: 600;
  }
</style>
