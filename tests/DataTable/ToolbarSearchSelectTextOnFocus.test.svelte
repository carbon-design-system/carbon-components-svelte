<script lang="ts">
  import type { DataTableHeader } from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  type Row = { id: string; name: string };

  const rows: Row[] = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Bravo" },
  ];

  const headers: ReadonlyArray<DataTableHeader<Row>> = [
    { key: "name", value: "Name" },
  ];
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent selectTextOnFocus value="Alpha" />
    </ToolbarContent>
  </Toolbar>
</DataTable>
