<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let headers: ComponentProps<DataTable>["headers"] = [
    { key: "name", value: "Name" },
  ];

  export let rows: ComponentProps<DataTable>["rows"];

  export let onCellClick: (cell: { key: string; value: unknown }) => void =
    () => {};
</script>

<DataTable {headers} {rows} on:click:cell={(e) => onCellClick(e.detail.cell)} />
