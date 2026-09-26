<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { ComponentProps } from "svelte";

  export let rows: ComponentProps<DataTable>["rows"] = [];
  export let virtualize: ComponentProps<DataTable>["virtualize"] = {
    containerHeight: 200,
    threshold: 1,
  };
  export let stickyHeader: ComponentProps<DataTable>["stickyHeader"] = false;
  export let onScrollend: (
    e: CustomEvent<{
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
    }>,
  ) => void = () => {};

  const headers = [{ key: "name", value: "Name" }] as const;
</script>

<DataTable
  {headers}
  {rows}
  {virtualize}
  {stickyHeader}
  on:scrollend={onScrollend}
/>
