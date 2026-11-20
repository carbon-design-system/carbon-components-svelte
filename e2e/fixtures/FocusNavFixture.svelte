<script>
  import { Stack } from "carbon-components-svelte";
  import {
    createFocusNav,
    focusNav,
    mountedIndexes,
  } from "carbon-components-svelte/utils/focus-nav.js";
  import { resolveLayoutDirection } from "carbon-components-svelte/utils/layout-direction.js";
  import { tick } from "svelte";

  const isRtl = (/** @type {Element | null} */ node) =>
    resolveLayoutDirection(undefined, node) === "rtl";

  // A. Toolbar: roving tabindex, one line, a cluster of disabled buttons.
  const tools = [
    "Bold",
    "Italic",
    "Underline",
    "Strike",
    "Code",
    "Link",
    "Quote",
    "Clear",
  ];
  const disabledTools = new Set(["Strike", "Code", "Link"]);
  /** @type {HTMLElement | undefined} */
  let toolbar;
  const toolbarNav = createFocusNav({
    selector: "button",
    skipDisabled: true,
    rtl: () => isRtl(toolbar ?? null),
  });

  // B. Ten thousand options, windowed, with roving tabindex. Moving to an
  // option that is not mounted renders it first, then focuses it.
  const LIST_COUNT = 10_000;
  const ROW = 32;
  const VIEW = 256;
  const OVERSCAN = 4;
  const listLabel = (/** @type {number} */ i) =>
    `${String.fromCharCode(65 + Math.floor(i / 385))} option ${i + 1}`;
  /** @type {HTMLElement | undefined} */
  let listEl;
  let listScroll = 0;
  const listNav = createFocusNav({
    count: LIST_COUNT,
    orientation: "vertical",
    pageSize: VIEW / ROW,
    typeahead: { label: listLabel },
    getItem: (i) => listEl?.querySelector(`[data-i="${i}"]`),
    getIndex: (element) =>
      Number(element.closest("[data-i]")?.getAttribute("data-i") ?? -1),
    reveal: (i) => revealRow(listEl, i, ROW, (top) => (listScroll = top)),
  });
  $: listStart = Math.max(0, Math.floor(listScroll / ROW) - OVERSCAN);
  $: listEnd = Math.min(
    LIST_COUNT,
    Math.ceil((listScroll + VIEW) / ROW) + OVERSCAN,
  );
  $: listRows = mountedIndexes(listStart, listEnd, $listNav.index);

  // C. Ten thousand cells in a grid, windowed by row. Focus stays on the grid
  // and aria-activedescendant names the cell.
  const GRID_COLS = 10;
  const GRID_COUNT = 10_000;
  const GRID_ROWS = GRID_COUNT / GRID_COLS;
  /** @type {HTMLElement | undefined} */
  let gridEl;
  let gridScroll = 0;
  const gridNav = createFocusNav({
    mode: "activedescendant",
    orientation: "grid",
    columns: GRID_COLS,
    count: GRID_COUNT,
    pageSize: VIEW / ROW - 1,
    ctrlArrows: true,
    rtl: () => isRtl(gridEl ?? null),
    getItem: (i) => gridEl?.querySelector(`#g-${i}`),
    getId: (i) => `g-${i}`,
    reveal: (i) =>
      revealRow(gridEl, Math.floor(i / GRID_COLS), ROW, (top) => {
        gridScroll = top;
      }),
  });
  $: gridStart = Math.max(0, Math.floor(gridScroll / ROW) - OVERSCAN);
  $: gridEnd = Math.min(
    GRID_ROWS,
    Math.ceil((gridScroll + VIEW) / ROW) + OVERSCAN,
  );
  $: gridRows = mountedIndexes(
    gridStart,
    gridEnd,
    $gridNav.index < 0 ? -1 : Math.floor($gridNav.index / GRID_COLS),
  );

  // D. A small grid with disabled clusters, roving tabindex.
  const SMALL_COLS = 6;
  const SMALL_COUNT = 30;
  const smallDisabled = new Set([8, 9, 10, 14, 20, 26]);
  /** @type {HTMLElement | undefined} */
  let smallEl;
  const smallNav = createFocusNav({
    selector: "[data-cell]",
    orientation: "grid",
    columns: SMALL_COLS,
    count: SMALL_COUNT,
    pageSize: 2,
    ctrlArrows: true,
    skip: (i) => smallDisabled.has(i),
    rtl: () => isRtl(smallEl ?? null),
  });

  // E. Native radios. Moving the cursor also checks the radio, and one
  // handler gives every engine the same answer in RTL (WebKit moves the
  // wrong way on its own).
  const scores = [1, 2, 3, 4, 5];
  /** @type {HTMLElement | undefined} */
  let radiogroup;
  const radioNav = createFocusNav({
    selector: "input[type=radio]",
    skipDisabled: true,
    rtl: () => isRtl(radiogroup ?? null),
    onMove: (index) => {
      const radios = radiogroup?.querySelectorAll("input[type=radio]");
      radios?.[index]?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    },
  });

  /**
   * Scroll row `row` into `el` and, when that changes the window, wait for
   * the render that mounts it.
   * @param {HTMLElement | undefined} el
   * @param {number} row
   * @param {number} size
   * @param {(top: number) => void} write
   */
  function revealRow(el, row, size, write) {
    if (!el) return undefined;
    const top = row * size;
    let next = el.scrollTop;
    if (top < next) next = top;
    else if (top + size > next + VIEW) next = top + size - VIEW;
    if (next === el.scrollTop && el.querySelector(`[data-row="${row}"]`)) {
      return undefined;
    }
    el.scrollTop = next;
    write(next);
    return tick();
  }
</script>

<Stack gap={7}>
  <section data-testid="toolbar">
    <h2 id="toolbar-label">Toolbar</h2>
    <div
      bind:this={toolbar}
      role="toolbar"
      aria-labelledby="toolbar-label"
      class="tools"
      use:focusNav={toolbarNav}
    >
      {#each tools as tool, i (tool)}
        <button
          type="button"
          class="bx--btn bx--btn--ghost bx--btn--sm"
          disabled={disabledTools.has(tool)}
          tabindex={i === $toolbarNav.tabStop ? 0 : -1}
        >
          {tool}
        </button>
      {/each}
    </div>
    <!-- Safari skips a native button in the tab order unless it has a tabindex. -->
    <button type="button" tabindex="0" data-testid="after-toolbar"
      >After toolbar</button
    >
  </section>

  <section data-testid="list">
    <h2 id="list-label">Ten thousand options, roving tabindex</h2>
    <div
      bind:this={listEl}
      role="listbox"
      aria-labelledby="list-label"
      class="scroller"
      on:scroll={() => (listScroll = listEl?.scrollTop ?? 0)}
      use:focusNav={listNav}
    >
      <div class="spacer" style:height="{LIST_COUNT * ROW}px">
        {#each listRows as i (i)}
          <div
            role="option"
            data-i={i}
            data-row={i}
            id="o-{i}"
            class="option"
            class:active={i === $listNav.index}
            aria-selected={i === $listNav.index}
            aria-setsize={LIST_COUNT}
            aria-posinset={i + 1}
            tabindex={i === $listNav.tabStop ? 0 : -1}
            style:top="{i * ROW}px"
          >
            {listLabel(i)}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section data-testid="grid">
    <h2 id="grid-label">Ten thousand cells, aria-activedescendant</h2>
    <div
      bind:this={gridEl}
      role="grid"
      aria-labelledby="grid-label"
      aria-rowcount={GRID_ROWS}
      aria-colcount={GRID_COLS}
      aria-activedescendant={$gridNav.activeId}
      tabindex="0"
      class="scroller"
      on:scroll={() => (gridScroll = gridEl?.scrollTop ?? 0)}
      use:focusNav={gridNav}
    >
      <div class="spacer" style:height="{GRID_ROWS * ROW}px">
        {#each gridRows as row (row)}
          <div
            role="row"
            data-row={row}
            aria-rowindex={row + 1}
            class="row"
            style:top="{row * ROW}px"
          >
            {#each Array.from({ length: GRID_COLS }, (_, c) => row * GRID_COLS + c) as i (i)}
              <div
                role="gridcell"
                id="g-{i}"
                aria-colindex={(i % GRID_COLS) + 1}
                class="cell"
                class:active={i === $gridNav.index}
              >
                {i}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section data-testid="radios">
    <h2 id="radios-label">Radio group</h2>
    <div
      bind:this={radiogroup}
      role="radiogroup"
      aria-labelledby="radios-label"
      class="tools"
      use:focusNav={radioNav}
    >
      {#each scores as score (score)}
        <label>
          <input
            type="radio"
            name="score"
            value={score}
            disabled={score === 3}
          />
          {score}
        </label>
      {/each}
    </div>
  </section>

  <section data-testid="small">
    <h2 id="small-label">Small grid with disabled clusters</h2>
    <div
      bind:this={smallEl}
      role="grid"
      aria-labelledby="small-label"
      class="small"
      use:focusNav={smallNav}
    >
      {#each Array.from({ length: SMALL_COUNT / SMALL_COLS }, (_, r) => r) as row (row)}
        <div role="row" class="small-row">
          {#each Array.from({ length: SMALL_COLS }, (_, c) => row * SMALL_COLS + c) as i (i)}
            <div
              role="gridcell"
              data-cell
              aria-disabled={smallDisabled.has(i) ? "true" : undefined}
              tabindex={i === $smallNav.tabStop ? 0 : -1}
              class="cell"
            >
              {i}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </section>
</Stack>

<style>
  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-block-end: 0.5rem;
  }

  .scroller {
    block-size: 256px;
    inline-size: 28rem;
    max-inline-size: 100%;
    overflow: auto;
    border: 1px solid var(--cds-border-strong-01);
    background: var(--cds-layer-01);
    color: var(--cds-text-primary);
  }

  .scroller:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .spacer {
    position: relative;
  }

  .option,
  .row {
    position: absolute;
    inset-inline: 0;
    block-size: 32px;
    box-sizing: border-box;
  }

  .option {
    padding: 0 1rem;
    line-height: 32px;
  }

  .row {
    display: flex;
    gap: 1px;
  }

  .cell {
    flex: 1;
    box-sizing: border-box;
    min-inline-size: 3rem;
    padding: 0 0.5rem;
    line-height: 32px;
    text-align: center;
    background: var(--cds-layer-02);
  }

  .option:focus-visible,
  .cell:focus-visible,
  .option.active,
  .cell.active {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .cell[aria-disabled="true"] {
    color: var(--cds-text-disabled);
  }

  .small {
    inline-size: 28rem;
    max-inline-size: 100%;
  }

  .small-row {
    display: flex;
    gap: 1px;
    margin-block-end: 1px;
  }
</style>
