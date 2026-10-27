<script>
  import {
    Button,
    DataTable,
    EmptyState,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Deploy from "carbon-icons-svelte/lib/Deploy.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";

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
  <svelte:fragment slot="empty" let:filtered>
    {#if filtered}
      <EmptyState
        size="sm"
        title="No results for “{value}”"
        subtitle="Check the spelling, or search by region or status."
      >
        <Search slot="illustration" />
        <Button size="small" kind="tertiary" on:click={() => (value = "")}>
          Clear search
        </Button>
      </EmptyState>
    {:else}
      <EmptyState
        size="sm"
        title="Start by adding a deployment"
        subtitle="Deployments you create show up here."
      >
        <Deploy slot="illustration" />
        <Button size="small" icon={Add} on:click={createDeployment}>
          Create deployment
        </Button>
      </EmptyState>
    {/if}
  </svelte:fragment>
</DataTable>
