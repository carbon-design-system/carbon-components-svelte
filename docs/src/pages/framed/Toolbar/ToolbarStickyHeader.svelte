<script>
  import {
    Button,
    Content,
    DataTable,
    Header,
    SkipToContent,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let rows = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  let selectedRowIds = [];
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<Content>
  <DataTable
    batchSelection
    bind:selectedRowIds
    headers={[
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
      { key: "port", value: "Port" },
      { key: "rule", value: "Rule" },
    ]}
    {rows}
  >
    <Toolbar sticky>
      <ToolbarBatchActions>
        <Button
          icon={TrashCan}
          on:click={() => {
            rows = rows.filter((row) => !selectedRowIds.includes(row.id));
          }}
        >
          Delete
        </Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
</Content>
