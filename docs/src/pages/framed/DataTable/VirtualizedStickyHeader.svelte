<script>
  import { DataTable } from "carbon-components-svelte";

  const rows = Array.from({ length: 500 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  title="Load balancers"
  description="500 rows, capped at 240px via stickyHeaderMaxHeight."
  stickyHeader
  stickyHeaderMaxHeight={240}
  virtualize
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
/>
