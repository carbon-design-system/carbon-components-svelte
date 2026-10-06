<script lang="ts">
  import type { DataTableHeader } from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let labelText: string | undefined = undefined;

  type Row = { id: string; name: string };

  const rows: Row[] = [{ id: "a", name: "Alpha" }];
  const headers: ReadonlyArray<DataTableHeader<Row>> = [
    { key: "name", value: "Name" },
  ];

  $: labelProps = labelText === undefined ? {} : { labelText };
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch {...labelProps} />
    </ToolbarContent>
  </Toolbar>
</DataTable>
