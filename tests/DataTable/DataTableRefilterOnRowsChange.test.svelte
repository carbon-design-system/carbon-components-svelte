<script lang="ts">
  import { Button, DataTable } from "carbon-components-svelte";
  import FilterRowsCaller from "./FilterRowsCaller.svelte";

  const initialRows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  const toggledRows = Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    name: `Server instance ${i + 1}`,
    rule: i % 2 ? "Round!" : "DNS!",
  }));

  let rows: typeof initialRows = initialRows;
</script>

<Button on:click={() => (rows = toggledRows)}>Toggle rows</Button>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
>
  <FilterRowsCaller searchValue="round" />
</DataTable>
