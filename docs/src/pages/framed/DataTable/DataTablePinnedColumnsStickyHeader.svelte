<script>
  import { Box, DataTable } from "carbon-components-svelte";
</script>

<Box maxWidth="40rem">
  <DataTable
    fixedLayout
    stickyHeader
    stickyHeaderMaxHeight={240}
    headers={[
      { key: "name", value: "Name", columnPinned: "start", width: "12rem" },
      { key: "region", value: "Region", width: "10rem" },
      { key: "protocol", value: "Protocol", width: "8rem" },
      { key: "port", value: "Port", width: "6rem" },
      { key: "rule", value: "Rule", width: "12rem" },
      { key: "owner", value: "Owner", width: "10rem" },
      { key: "status", value: "Status", columnPinned: "end", width: "8rem" },
    ]}
    rows={Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      name: `Load Balancer ${i + 1}`,
      region: i % 2 ? "eu-de" : "us-east",
      protocol: "HTTP",
      port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
      rule: i % 3 ? "Round robin" : "DNS delegation",
      owner: "Platform team",
      status: i % 4 ? "Healthy" : "Degraded",
    }))}
  />
</Box>
