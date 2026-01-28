<script>
  import { DataTable } from "carbon-components-svelte";

  const rows = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  sortable
  virtualize={{ threshold: 200 }}
  title="Custom threshold (threshold: 200)"
  description="Virtualization activates only when there are 200 or more rows."
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
/>
