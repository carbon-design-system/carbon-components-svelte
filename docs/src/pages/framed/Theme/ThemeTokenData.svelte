<script>
  import {
    DataTable,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import {
    colorTokenDescriptions,
    colorTokens,
  } from "carbon-components-svelte/tokens";

  const themes = ["white", "g10", "g80", "g90", "g100"];

  const headers = [
    { key: "id", value: "Token" },
    ...themes.map((theme) => ({ key: theme, value: theme })),
  ];

  const rows = Object.entries(colorTokens).map(([id, values]) => ({
    id,
    description: colorTokenDescriptions[id] ?? "",
    ...values,
  }));

  let page = 1;
  let filteredRowIds = [];
</script>

<DataTable size="short" {headers} {rows} pageSize={6} {page} expandable>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows bind:filteredRowIds />
    </ToolbarContent>
  </Toolbar>
  <svelte:fragment slot="cell" let:cell>
    {#if cell.key === "id"}
      <code>{cell.value}</code>
    {:else}
      <span
        class="swatch"
        style:background={cell.value}
        aria-hidden="true"
      ></span>
      {cell.value}
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="expandedRow" let:row>
    {row.description || "No description"}
  </svelte:fragment>
</DataTable>

<Pagination
  bind:page
  pageSize={6}
  pageSizeInputDisabled
  totalItems={filteredRowIds.length}
/>

<style>
  .swatch {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-inline-end: 0.5rem;
    vertical-align: middle;
    border: 1px solid var(--cds-ui-03);
  }
</style>
