<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import {
    createTableState,
    tableStateToSearchParams,
  } from "carbon-components-svelte/DataTable/table-state.js";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import type { ComponentProps } from "svelte";

  export let onrequest: (query: string) => void = () => {};

  const table = createTableState({ pageSize: 5 });

  const headers: ComponentProps<DataTable>["headers"] = [
    { key: "name", value: "Name" },
  ];
  const rows: Array<{ id: string; [key: string]: string }> = [
    { id: "a", name: "Apple" },
  ];

  // The request a server table makes: it runs once per flush.
  $: onrequest(tableStateToSearchParams($table).toString());
</script>

<DataTable
  {headers}
  {rows}
  sortable
  externalSort
  bind:sortKey={$table.sortKey}
  bind:sortDirection={$table.sortDirection}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent bind:value={$table.search} />
    </ToolbarContent>
  </Toolbar>
</DataTable>
<Pagination
  bind:page={$table.page}
  bind:pageSize={$table.pageSize}
  totalItems={100}
  pageSizes={[5, 10]}
/>
