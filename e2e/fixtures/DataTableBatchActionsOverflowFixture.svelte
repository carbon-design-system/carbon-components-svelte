<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarBatchActions from "carbon-components-svelte/DataTable/ToolbarBatchActions.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 1", rule: "Round robin" },
    { id: "b", name: "Load Balancer 2", rule: "DNS delegation" },
    { id: "c", name: "Load Balancer 3", rule: "Round robin" },
  ];

  export let selectedRowIds: string[] = [];
</script>

<div style:width="360px">
  <DataTable batchSelection {headers} {rows} bind:selectedRowIds>
    <Toolbar>
      <ToolbarBatchActions>
        <Button kind="danger">Delete</Button>
        <Button>Restart</Button>
        <Button>Archive</Button>
      </ToolbarBatchActions>
      <ToolbarContent> <Button>Create balancer</Button> </ToolbarContent>
    </Toolbar>
  </DataTable>
</div>
