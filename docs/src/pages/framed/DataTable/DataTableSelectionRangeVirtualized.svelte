<script>
  import { DataTable } from "carbon-components-svelte";

  let selectedRowIds = [];

  const rows = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Row ${i + 1}`,
    score: (i * 7919) % 10007,
  }));
</script>

<DataTable
  batchSelection
  selectionRange
  sortable
  bind:selectedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "score", value: "Score" },
  ]}
  {rows}
  virtualize
/>

<p>{selectedRowIds.length} of {rows.length} selected</p>
