<script>
  import { Box, DataTable, Stack } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name", primary: true },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
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
  ];
</script>

<Stack gap={7}>
  <Box width="20rem">
    <DataTable stacked="auto" title="Narrow box" {headers} {rows} />
  </Box>
  <Box>
    <DataTable stacked="auto" title="Wide box" {headers} {rows} />
  </Box>
</Stack>
