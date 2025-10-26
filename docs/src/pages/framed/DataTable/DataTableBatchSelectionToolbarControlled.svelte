<script>
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  let rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
    { id: "d", name: "Load Balancer 6", port: 3000, rule: "Round robin" },
    { id: "e", name: "Load Balancer 4", port: 443, rule: "Round robin" },
    { id: "f", name: "Load Balancer 5", port: 80, rule: "DNS delegation" },
  ];

  let active = false;
  let selectedRowIds = [];

  $: console.log("active", active);
  $: console.log("selectedRowIds", selectedRowIds);
</script>

<DataTable
  selectable
  batchSelection={active}
  bind:selectedRowIds
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarBatchActions
      bind:active
      on:cancel={(e) => {
        e.preventDefault();
        active = false;
      }}
    >
      <Button
        icon={TrashCan}
        disabled={selectedRowIds.length === 0}
        on:click={() => {
          rows = rows.filter((row) => !selectedRowIds.includes(row.id));
          selectedRowIds = [];
        }}
      >
        Delete
      </Button>
    </ToolbarBatchActions>
    <ToolbarContent>
      <Button on:click={() => (active = true)}>Edit rows</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>
