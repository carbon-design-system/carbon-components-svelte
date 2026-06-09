<script>
  import {
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  const ROW_COUNT = 50;

  const headers = [
    { key: "name", value: "Name" },
    { key: "overflow", empty: true, width: "72px" },
  ];

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => ({
    id: `row-${i}`,
    name: `Row ${i}`,
  }));

  /** @type {boolean[]} */
  let openStates = rows.map(() => false);

  async function setAllOpen(open) {
    for (let i = 0; i < ROW_COUNT; i++) openStates[i] = open;
    openStates = openStates;
    await tick();
  }
</script>

<div class="controls">
  <button
    type="button"
    data-testid="open-all-menus"
    on:click={(event) => {
      event.stopPropagation();
      setAllOpen(true);
    }}
  >
    Open all menus
  </button>
  <button
    type="button"
    data-testid="close-all-menus"
    on:click={(event) => {
      event.stopPropagation();
      setAllOpen(false);
    }}
  >
    Close all menus
  </button>
</div>

<div data-testid="data-table-overflow">
  <DataTable {headers} {rows}>
    <svelte:fragment slot="cell" let:cell let:rowIndex>
      {#if cell.key === "overflow"}
        <OverflowMenu bind:open={openStates[rowIndex]} portalMenu flipped>
          <OverflowMenuItem text="Edit" />
          <OverflowMenuItem text="Delete" danger />
        </OverflowMenu>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</div>

<style>
  .controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
</style>
