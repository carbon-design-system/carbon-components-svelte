<script>
  import { DataTable } from "carbon-components-svelte";
</script>

<DataTable
  headers={[
    { key: "name", value: "Name", width: "50%", minWidth: "200px" },
    { key: "protocol", value: "Protocol", width: "60px" },
    { key: "port", value: "Port", width: "60px" },
    { key: "rule", value: "Rule", width: "10rem" },
  ]}
  rows={Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }))}
/>
