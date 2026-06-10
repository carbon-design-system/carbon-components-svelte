<script>
  import {
    DataTable,
    SearchMenu,
    SearchMenuGroup,
    SearchMenuItem,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";

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

  let value = "";

  // SearchMenu has no DataTable context, so filter the rows in the consumer.
  $: query = value.trim().toLowerCase();
  $: filteredRows = query
    ? rows.filter((row) =>
        [row.name, row.protocol, row.rule].some((cell) =>
          String(cell).toLowerCase().includes(query),
        ),
      )
    : rows;
</script>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  {headers}
  rows={filteredRows}
>
  <Toolbar>
    <ToolbarContent>
      <SearchMenu bind:value placeholder="Search load balancers...">
        <SearchMenuGroup label="Suggestions">
          {#each rows as row (row.id)}
            <SearchMenuItem text={row.name} />
          {/each}
        </SearchMenuGroup>
      </SearchMenu>
    </ToolbarContent>
  </Toolbar>
</DataTable>
