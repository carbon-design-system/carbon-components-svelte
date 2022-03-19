<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    ToolbarMenu,
    ToolbarMenuItem,
    Button,
  } from "carbon-components-svelte";

  let rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: "Load Balancer " + (i + 1),
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  sortable
  title="Load balancers"
  description="Your organization's active load balancers."
  headers="{[
    { key: 'name', value: 'Name' },
    { key: 'protocol', value: 'Protocol' },
    { key: 'port', value: 'Port' },
    { key: 'rule', value: 'Rule' },
  ]}"
  rows="{rows}"
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        value="round"
        shouldFilterRows="{(row, value) => {
          return (
            /(6|8)$/.test(row.name) &&
            row.rule.toLowerCase().includes(value.toLowerCase())
          );
        }}"
      />
      <ToolbarMenu>
        <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
        <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
          API documentation
        </ToolbarMenuItem>
        <ToolbarMenuItem hasDivider danger>Stop all</ToolbarMenuItem>
      </ToolbarMenu>
      <Button>Create balancer</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>
