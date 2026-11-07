<script>
  import { DataTable } from "carbon-components-svelte";

  let selectedRowIds = ["b"];
</script>

<DataTable
  stacked="always"
  sortable
  batchSelection
  bind:selectedRowIds
  title="Load balancers"
  headers={[
    { key: "name", value: "Name", primary: true },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  rows={[
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ]}
/>
