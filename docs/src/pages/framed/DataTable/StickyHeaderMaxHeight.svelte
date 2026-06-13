<script>
  import { DataTable } from "carbon-components-svelte";

  const rows = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  stickyHeader
  stickyHeaderMaxHeight={500}
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
/>
