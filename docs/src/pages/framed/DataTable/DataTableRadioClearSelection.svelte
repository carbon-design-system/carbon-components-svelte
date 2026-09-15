<script>
  import { Button, DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
  ];

  let selectedRowIds = [rows[1].id];
</script>

<Button
  kind="ghost"
  size="small"
  disabled={selectedRowIds.length === 0}
  on:click={() => {
    selectedRowIds = [];
  }}
>
  Clear selection
</Button>

<DataTable radio allowDeselect bind:selectedRowIds {headers} {rows} />
