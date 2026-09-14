<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarDensity,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let size = "medium";

  const headers = [
    { key: "name", value: "Name" },
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
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];
</script>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  {size}
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch />
      <ToolbarDensity bind:size intrinsicAlign="end" />
    </ToolbarContent>
  </Toolbar>
</DataTable>
