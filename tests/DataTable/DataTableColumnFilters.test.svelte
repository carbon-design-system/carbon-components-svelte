<script lang="ts">
  import type { DataTableHeader } from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let filters: Record<string, unknown> = {};
  export let filterMode: "remove" | "hide" = "remove";
  export let batchSelection = false;
  export let selectedRowIds: string[] = [];
  export let sortable = false;
  export let search = false;
  export let showControls = false;
  /** Match `status` exactly instead of the default case-insensitive substring. */
  export let exactStatus = false;
  export let filteredRowIds: readonly string[] = [];

  type Row = { id: string; name: string; protocol: string; status: string };

  const initialRows: Row[] = [
    { id: "a", name: "Zebra", protocol: "HTTP", status: "active" },
    { id: "b", name: "Alpha", protocol: "HTTP", status: "inactive" },
    { id: "c", name: "Mango", protocol: "FTP", status: "active" },
    { id: "d", name: "Bravo", protocol: "HTTP", status: "disabled" },
  ];

  const toggledRows: Row[] = [
    { id: "e", name: "Kilo", protocol: "HTTP", status: "active" },
    { id: "f", name: "Lima", protocol: "FTP", status: "active" },
  ];

  let rows = initialRows;

  const headers: DataTableHeader<Row>[] = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    {
      key: "status",
      value: "Status",
      filter: exactStatus
        ? (value, filterValue) => value === filterValue
        : undefined,
    },
  ];
</script>

<button type="button" on:click={() => (rows = toggledRows)}>Toggle rows</button>

{#if showControls}
  <select aria-label="Protocol filter" bind:value={filters.protocol}>
    <option value="">All</option>
    <option value="HTTP">HTTP</option>
    <option value="FTP">FTP</option>
  </select>
{/if}

<DataTable
  {headers}
  {rows}
  {filterMode}
  {batchSelection}
  {sortable}
  bind:filters
  bind:filteredRowIds
  bind:selectedRowIds
>
  {#if search}
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
      </ToolbarContent>
    </Toolbar>
  {/if}
</DataTable>

<span data-testid="filtered-row-ids">{filteredRowIds.join(",")}</span>
<span data-testid="selected-count">{selectedRowIds.length}</span>
