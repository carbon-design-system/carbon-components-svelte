<script>
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "value", value: "Value" },
  ];

  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    value: `Value ${i}`,
  }));
</script>

<div data-testid="data-table-virtual"><DataTable {headers} {rows} /></div>
