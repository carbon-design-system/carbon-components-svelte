<script>
  import {
    DataTable,
    Toolbar,
    ToolbarColumnVisibility,
    ToolbarContent,
  } from "carbon-components-svelte";

  let headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
    { key: "overflow", empty: true },
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
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarColumnVisibility
        bind:headers
        toggleableKeys={["protocol", "port", "rule"]}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>
