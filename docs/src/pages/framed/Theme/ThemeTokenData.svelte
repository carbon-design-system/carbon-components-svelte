<script>
  import {
    DataTable,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { colorTokens } from "carbon-components-svelte/tokens";

  const themes = ["white", "g10", "g80", "g90", "g100"];

  const headers = [
    { key: "id", value: "Token" },
    ...themes.map((theme) => ({ key: theme, value: theme })),
  ];

  const rows = Object.entries(colorTokens).map(([id, values]) => ({
    id,
    ...values,
  }));

  let page = 1;
  let filteredRowIds = [];
</script>

<DataTable size="short" {headers} {rows} pageSize={6} {page}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows bind:filteredRowIds />
    </ToolbarContent>
  </Toolbar>
  <svelte:fragment slot="cell" let:cell>
    {#if cell.key === "id"}
      <code>{cell.value}</code>
    {:else}
      <span class="value">
        <span
          class="swatch"
          style:background={cell.value}
          aria-hidden="true"
        ></span>
        {cell.value}
      </span>
    {/if}
  </svelte:fragment>
</DataTable>

<Pagination
  bind:page
  pageSize={6}
  pageSizeInputDisabled
  totalItems={filteredRowIds.length}
/>

<style>
  /* A long rgba() value wraps beside its swatch, not under it. */
  .value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .swatch {
    flex: none;
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--cds-border-subtle-01);
  }
</style>
