<script>
  import { DataTable } from "carbon-components-svelte";

  let expandedRowIds = [];
  let selectedRowIds = [];

  $: {
    console.log("expandedRowIds", expandedRowIds);
    console.log("selectedRowIds", selectedRowIds);
  }
</script>

<DataTable
  batchExpansion
  batchSelection
  bind:expandedRowIds
  bind:selectedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  rows={Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }))}
>
  <svelte:fragment slot="expanded-row" let:row>
    <pre> {JSON.stringify(row, null, 2)}</pre>
  </svelte:fragment>
</DataTable>
