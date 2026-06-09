<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let filterMode: "remove" | "hide" = "hide";
  export let pageSize = 0;
  export let batchSelection = false;
  export let selectedRowIds: number[] = [];

  const rows = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    rule: i % 2 ? "Round robin" : "DNS delegation",
    note: "",
  }));
</script>

<DataTable
  {filterMode}
  {pageSize}
  {batchSelection}
  bind:selectedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
    { key: "note", value: "Note" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
  <svelte:fragment slot="cell" let:cell let:row>
    {#if cell.key === "note"}
      <input data-testid="note-{row.id}">
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>

<span data-testid="selected-count">{selectedRowIds.length}</span>
