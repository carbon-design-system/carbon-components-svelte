<script lang="ts">
  import {
    Box,
    Button,
    Column,
    DataTable,
    Grid,
    Pagination,
    Row,
    Tag,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const resourceHeaders = [
    { key: "name", value: "Service" },
    { key: "status", value: "Status" },
    { key: "region", value: "Region" },
    { key: "requests", value: "Requests (24h)" },
    { key: "updated", value: "Last updated" },
  ];
  const resourceRows = [
    {
      id: "1",
      name: "checkout-api",
      status: "Running",
      region: "us-south",
      requests: "1.2M",
      updated: "2 min ago",
    },
    {
      id: "2",
      name: "payments-gateway",
      status: "Running",
      region: "eu-de",
      requests: "842K",
      updated: "5 min ago",
    },
    {
      id: "3",
      name: "search-indexer",
      status: "Degraded",
      region: "jp-tok",
      requests: "318K",
      updated: "1 min ago",
    },
    {
      id: "4",
      name: "identity-provider",
      status: "Running",
      region: "us-east",
      requests: "967K",
      updated: "12 min ago",
    },
    {
      id: "5",
      name: "media-transcoder",
      status: "Stopped",
      region: "au-syd",
      requests: "0",
      updated: "3 hr ago",
    },
    {
      id: "6",
      name: "recommendation",
      status: "Running",
      region: "us-south",
      requests: "540K",
      updated: "8 min ago",
    },
    {
      id: "7",
      name: "notifications",
      status: "Running",
      region: "eu-gb",
      requests: "233K",
      updated: "20 min ago",
    },
    {
      id: "8",
      name: "analytics-stream",
      status: "Running",
      region: "us-east",
      requests: "1.8M",
      updated: "1 min ago",
    },
    {
      id: "9",
      name: "billing-worker",
      status: "Degraded",
      region: "ca-tor",
      requests: "76K",
      updated: "30 min ago",
    },
    {
      id: "10",
      name: "edge-cache",
      status: "Running",
      region: "br-sao",
      requests: "4.1M",
      updated: "just now",
    },
  ];
  const statusTag: Record<string, string> = {
    Running: "green",
    Degraded: "purple",
    Stopped: "red",
  };

  let tableSearch = "";
  let tablePage = 1;
  let tablePageSize = 5;
  let selectedRowIds: string[] = [];
  $: filteredRows = resourceRows.filter((row) =>
    `${row.name} ${row.region} ${row.status}`
      .toLowerCase()
      .includes(tableSearch.toLowerCase()),
  );
  $: if (tableSearch !== undefined) tablePage = 1;
</script>

<Box tag="div" class="band example-band example-row">
  <Grid>
    <Row>
      <Column class="code-col">
        <div class="table-scroll">
          <DataTable
            sortable
            batchSelection
            bind:selectedRowIds
            size="medium"
            title="Cloud resources"
            description="10 services across 8 regions"
            headers={resourceHeaders}
            rows={filteredRows}
            page={tablePage}
            pageSize={tablePageSize}
          >
            <svelte:fragment slot="cell" let:cell>
              {#if cell.key === "status"}
                <Tag type={statusTag[cell.value]} size="sm" style="margin: 0">
                  {cell.value}
                </Tag>
              {:else}
                {cell.value}
              {/if}
            </svelte:fragment>

            <Toolbar>
              <ToolbarContent>
                <ToolbarSearch persistent bind:value={tableSearch} />
                <Button>Provision</Button>
              </ToolbarContent>
            </Toolbar>
          </DataTable>
          <Pagination
            bind:page={tablePage}
            bind:pageSize={tablePageSize}
            totalItems={filteredRows.length}
            pageSizes={[5, 10]}
          />
        </div>
      </Column>
    </Row>
  </Grid>
</Box>

<style>
  .table-scroll {
    overflow-x: auto;
    max-width: 100%;
  }
</style>
