<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { ComponentProps } from "svelte";

  export let headers: ComponentProps<DataTable>["headers"] = [];
  export let rows: ComponentProps<DataTable>["rows"] = [];
  export let selectable = false;
  export let expandable = false;
  export let stickyHeader = false;
  export let virtualize: ComponentProps<DataTable>["virtualize"] = undefined;
</script>

<DataTable
  {headers}
  {rows}
  {selectable}
  {expandable}
  {stickyHeader}
  {virtualize}
/>
