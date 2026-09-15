<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { ComponentProps } from "svelte";

  export let stickyHeaderMaxHeight: ComponentProps<DataTable>["stickyHeaderMaxHeight"] = 240;

  const headers = [
    { key: "name", value: "Name" },
    { key: "value", value: "Value" },
  ] as const;

  const rows = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    value: `Value ${i}`,
  }));
</script>

<DataTable {headers} {rows} stickyHeader {stickyHeaderMaxHeight} virtualize />
