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
  import Deployment from "carbon-pictograms-svelte/lib/Deployment.svelte";
  import Magnify from "carbon-pictograms-svelte/lib/Magnify.svelte";

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
  <EmptyState
    slot="empty"
    size="sm"
    titleText="Start by adding a deployment"
    subtitleText="Deployments you create show up here."
  >
    <Deployment slot="illustration" />
    <Button size="small" icon={Add} on:click={createDeployment}>
      Create deployment
    </Button>
  </EmptyState>
  <EmptyState
    slot="noResults"
    size="sm"
    titleText="No results for “{value}”"
    subtitleText="Check the spelling, or search by region or status."
  >
    <Magnify slot="illustration" />
    <Button size="small" kind="tertiary" on:click={() => (value = "")}>
      Clear search
    </Button>
  </EmptyState>
</DataTable>
