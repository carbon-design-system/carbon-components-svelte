<script lang="ts">
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
    { id: "d", name: "Load Balancer 6", port: 3000, rule: "Round robin" },
    { id: "e", name: "Load Balancer 4", port: 443, rule: "Round robin" },
    { id: "f", name: "Load Balancer 5", port: 80, rule: "DNS delegation" },
  ];

  export let selectedRowIds: string[] = [];
  export let active: boolean | undefined = undefined;
  export let controlled = false;
</script>

<div data-testid="selected-ids">{JSON.stringify(selectedRowIds)}</div>

<DataTable batchSelection {headers} {rows} {selectedRowIds}>
  <Toolbar>
    <ToolbarBatchActions
      {active}
      on:cancel={() => {
        if (!controlled) {
          selectedRowIds = [];
        }
      }}
    >
      <Button
        kind="danger"
        on:click={() => {
          console.log("delete", selectedRowIds);
        }}
      >
        Delete
      </Button>
      <Button
        on:click={() => {
          console.log("restart", selectedRowIds);
        }}
      >
        Restart
      </Button>
    </ToolbarBatchActions>
    <ToolbarContent>
      <Button>Create balancer</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>
