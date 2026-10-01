<script>
  import { DataTable } from "carbon-components-svelte";

  const headers = Array.from({ length: 10 }, (_, i) => ({
    key: `col${i}`,
    value: `Column ${i}`,
    minWidth: "140px",
    sticky: i < 2 ? "start" : i === 9 ? "end" : undefined,
  }));

  const rows = Array.from({ length: 4 }, (_, r) => ({
    id: String(r),
    ...Object.fromEntries(headers.map((h, c) => [h.key, `R${r}C${c}`])),
  }));

  let selectedRowIds = ["1"];
</script>

<div style="width: 480px" data-testid="container">
  <DataTable selectable bind:selectedRowIds {headers} {rows} />
</div>
