<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarMenu,
    ToolbarMenuItem,
  } from "carbon-components-svelte";

  let headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule", columnHidden: true },
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
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  function toggleColumn(key) {
    headers = headers.map((header) =>
      header.key === key
        ? { ...header, columnHidden: !header.columnHidden }
        : header,
    );
  }
</script>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarMenu>
        {#each headers as header (header.key)}
          <ToolbarMenuItem on:click={() => toggleColumn(header.key)}>
            {header.columnHidden ? "Show" : "Hide"}
            {header.value}
          </ToolbarMenuItem>
        {/each}
      </ToolbarMenu>
    </ToolbarContent>
  </Toolbar>
</DataTable>
