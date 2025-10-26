<script>
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarMenu,
    ToolbarMenuItem,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
    { id: "d", name: "Load Balancer 6", port: 3000, rule: "Round robin" },
    { id: "e", name: "Load Balancer 4", port: 443, rule: "Round robin" },
    { id: "f", name: "Load Balancer 5", port: 80, rule: "DNS delegation" },
  ];

  let selectedRowIds = [rows[0].id, rows[1].id];

  $: console.log("selectedRowIds", selectedRowIds);
</script>

<DataTable batchSelection bind:selectedRowIds {headers} {rows}>
  <Toolbar>
    <ToolbarBatchActions>
      <Button icon={Save}>Save</Button>
    </ToolbarBatchActions>
    <ToolbarContent>
      <ToolbarSearch />
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
