<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarExport from "carbon-components-svelte/DataTable/ToolbarExport.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import type { ComponentProps } from "svelte";

  type Row = { id: string; [key: string]: string | number };

  export let rows: Row[] = [
    { id: "a", name: "Cherry", port: 3 },
    { id: "b", name: "Apple", port: 1 },
    { id: "c", name: "Banana", port: 2 },
    { id: "d", name: "Date", port: 4 },
  ];
  export let rowScope: ComponentProps<ToolbarExport>["rowScope"] = "filtered";
  export let formats: ComponentProps<ToolbarExport>["formats"] = [
    "csv",
    "json",
  ];
  export let standalone = false;
  export let selectedRowIds: string[] = [];
  export let sortKey: ComponentProps<DataTable>["sortKey"] = "name";
  export let sortDirection: ComponentProps<DataTable>["sortDirection"] =
    "ascending";
  export let pageSize = 0;
  export let page = 1;
  export let filterMode: ComponentProps<DataTable>["filterMode"] = "remove";
  export let onexport: ((event: CustomEvent) => void) | undefined = undefined;

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "hidden", value: "Hidden", columnHidden: true },
  ];
</script>

{#if standalone}
  <ToolbarExport
    {rows}
    {headers}
    {formats}
    filename="people"
    on:export={(event) => onexport?.(event)}
  />
{:else}
  <DataTable
    {headers}
    {rows}
    sortable
    selectable
    {sortKey}
    {sortDirection}
    {pageSize}
    {page}
    {filterMode}
    bind:selectedRowIds
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
        <ToolbarExport
          {rowScope}
          {formats}
          filename="fruit"
          on:export={(event) => onexport?.(event)}
        />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
{/if}
