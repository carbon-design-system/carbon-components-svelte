<script>
  import { DataTable } from "carbon-components-svelte";

  const rows = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  sortable
  virtualize={{ overscan: 10 }}
  title="High overscan (10,000 rows, overscan: 10)"
  description="Higher overscan values render more rows above and below the viewport for smoother scrolling."
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
/>
