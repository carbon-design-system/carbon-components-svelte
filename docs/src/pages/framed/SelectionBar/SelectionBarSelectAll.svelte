<script>
  import {
    Button,
    DataTable,
    Pagination,
    SelectionBar,
    Text,
  } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import UserFollow from "carbon-icons-svelte/lib/UserFollow.svelte";

  const headers = [
    { key: "id", value: "ID" },
    { key: "summary", value: "Summary" },
    { key: "service", value: "Service" },
  ];

  const summaries = [
    "Elevated 5xx responses",
    "Slow queries on the primary database",
    "TLS certificate expires in 7 days",
    "Disk usage above 90%",
    "Webhook deliveries failing",
  ];
  const services = ["API gateway", "Billing", "Search index", "Audit log"];

  const totalItems = 250;
  const pageSize = 10;

  // In an app, the server returns one page of the results at a time.
  function fetchPage(page) {
    return Array.from({ length: pageSize }, (_, index) => {
      const n = (page - 1) * pageSize + index;
      return {
        id: `INC-${4100 + n}`,
        summary: summaries[n % summaries.length],
        service: services[n % services.length],
      };
    });
  }

  let page = 1;
  let selectedRowIds = fetchPage(1).map((row) => row.id);
  let allSelected = false;

  $: rows = fetchPage(page);
  $: pageSelected = rows.every((row) => selectedRowIds.includes(row.id));
  $: if (!pageSelected) allSelected = false;
  $: count = allSelected ? totalItems : selectedRowIds.length;

  function clear() {
    selectedRowIds = [];
    allSelected = false;
  }
</script>

<SelectionBar {count} on:clear={clear}>
  <svelte:fragment slot="actions">
    <Button icon={UserFollow}>Assign</Button>
    <Button icon={Checkmark}>Resolve</Button>
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#if allSelected}
      <Text>All {totalItems} incidents are selected.</Text>
    {:else if pageSelected}
      <Text>All {rows.length} incidents on this page are selected.</Text>
      <Button kind="ghost" size="small" on:click={() => (allSelected = true)}>
        Select all {totalItems} incidents
      </Button>
    {/if}
  </svelte:fragment>
</SelectionBar>
<DataTable batchSelection bind:selectedRowIds {headers} {rows} />
<Pagination bind:page {pageSize} {totalItems} pageSizes={[pageSize]} />
