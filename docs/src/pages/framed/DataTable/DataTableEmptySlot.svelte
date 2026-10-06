<script>
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let rows = [];
  let value = "";

  function createDeployment() {
    rows = [
      {
        id: "a",
        name: "payments-api",
        region: "us-east-1",
        status: "Running",
      },
      {
        id: "b",
        name: "billing-worker",
        region: "eu-west-1",
        status: "Running",
      },
      {
        id: "c",
        name: "audit-exporter",
        region: "ap-southeast-2",
        status: "Stopped",
      },
    ];
  }
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        shouldFilterRows
        bind:value
        placeholder="Search deployments"
      />
    </ToolbarContent>
  </Toolbar>
  <div slot="empty" let:filtered>
    {#if filtered}
      <p>No results for "{value}"</p>
      <Button size="small" kind="tertiary" on:click={() => (value = "")}>
        Clear search
      </Button>
    {:else}
      <p>Start by adding a deployment</p>
      <Button size="small" on:click={createDeployment}>
        Create deployment
      </Button>
    {/if}
  </div>
</DataTable>
