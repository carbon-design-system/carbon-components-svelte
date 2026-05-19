<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let persistent = false;
  export let shouldFilterRows: ComponentProps<ToolbarSearch>["shouldFilterRows"] = true;

  const initialRows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  let rows = initialRows;
  let pageSize = 5;
  let page = 1;
  let filteredRowIds: number[] = [];
  let toggleRows = false;
</script>

<Button
  on:click={() => {
    toggleRows = !toggleRows;
    if (toggleRows) {
      rows = Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        name: `Server instance ${i + 1}`,
        protocol: "HTTP",
        port: 3000 + i * 10,
        rule: i % 2 ? "Round!" : "DNS!",
      }));
    } else {
      rows = initialRows;
    }
  }}
>
  Toggle rows
</Button>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
  {pageSize}
  {page}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        {persistent}
        {value}
        {shouldFilterRows}
        bind:filteredRowIds
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<Pagination
  bind:pageSize
  bind:page
  totalItems={filteredRowIds.length}
  pageSizeInputDisabled
/>
