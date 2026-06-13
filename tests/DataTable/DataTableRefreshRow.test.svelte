<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { ComponentProps } from "svelte";

  type Row = { id: string; name: string };

  let table: DataTable;

  // `upper` uses display(row); its cell value does not change when name does.
  export let headers: ComponentProps<DataTable>["headers"] = [
    { key: "name", value: "Name" },
    {
      key: "upper",
      value: "Upper",
      display: (_value, row) => (row as Row).name.toUpperCase(),
    },
  ];

  export let rows: Row[] = [{ id: "a", name: "alpha" }];

  // In-place edit, then refreshRow.
  export function mutateAndRefreshRow() {
    rows[0].name = "beta";
    table.refreshRow("a");
  }

  // In-place edit, no refresh. Should stay stale.
  export function mutateNoRefresh() {
    rows[0].name = "gamma";
  }

  export function mutateAndRefreshCells() {
    rows[0].name = "delta";
    table.refreshCells();
  }
</script>

<DataTable bind:this={table} {headers} {rows} />
