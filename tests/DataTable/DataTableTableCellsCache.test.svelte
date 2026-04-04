<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type { DataTableHeader } from "carbon-components-svelte/DataTable/DataTable.svelte";

  type Row = {
    id: string;
    name: string;
    protocol?: string;
  };

  export let headers: ReadonlyArray<DataTableHeader<Row>> = [
    { key: "name", value: "Name" },
  ];

  export let rows: ReadonlyArray<Row>;

  export let onCellClick: (cell: { key: string; value: unknown }) => void =
    () => {};
</script>

<DataTable {headers} {rows} on:click:cell={(e) => onCellClick(e.detail.cell)} />
