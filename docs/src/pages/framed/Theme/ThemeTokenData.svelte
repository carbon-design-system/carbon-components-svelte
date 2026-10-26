<script>
  import {
    DataTable,
    Pagination,
    Stack,
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
      <Stack tag="span" orientation="horizontal" align="center" gap={3}>
        <span class="swatch" style:background={cell.value} aria-hidden="true"
        ></span>
        {cell.value}
      </Stack>
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
  /* A swatch, not layout: border-subtle-01 outlines light values on the row. */
  .swatch {
    flex: none;
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--cds-border-subtle-01);
  }
</style>
