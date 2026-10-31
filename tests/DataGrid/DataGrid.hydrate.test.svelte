<script lang="ts">
  import DataGrid from "carbon-components-svelte/DataGrid/DataGrid.svelte";

  const columns = Array.from({ length: 20 }, (_, c) => ({
    key: `c${c}`,
    title: `Column ${c}`,
    width: 110,
    align: c === 0 ? ("start" as const) : ("end" as const),
  }));
  const rows = Array.from({ length: 500 }, (_, r) =>
    Object.fromEntries(columns.map((column, c) => [column.key, `r${r}c${c}`])),
  );
</script>

<DataGrid labelText="Sales" {columns} {rows} frozenRows={1} frozenColumns={2} />
