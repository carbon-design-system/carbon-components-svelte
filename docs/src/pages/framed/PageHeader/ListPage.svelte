<script>
  import {
    Button,
    Column,
    DataTable,
    PageHeader,
    Row,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const rows = [
    {
      id: "a",
      name: "db-prod-01",
      engine: "PostgreSQL 16",
      region: "us-south",
    },
    { id: "b", name: "db-prod-02", engine: "PostgreSQL 16", region: "eu-de" },
    { id: "c", name: "analytics", engine: "MySQL 8", region: "us-east" },
    { id: "d", name: "cache-sessions", engine: "Redis 7", region: "us-south" },
    {
      id: "e",
      name: "search-index",
      engine: "Elasticsearch 8",
      region: "jp-tok",
    },
  ];

  let filteredRowIds = rows.map((row) => row.id);
</script>

<PageHeader
  grid
  title="Databases"
  subtitle="{filteredRowIds.length} of {rows.length} instances"
>
  <svelte:fragment slot="actions">
    <Button icon={Add}>Create database</Button>
  </svelte:fragment>
  <Row padding>
    <Column>
      <DataTable
        sortable
        headers={[
          { key: "name", value: "Name" },
          { key: "engine", value: "Engine" },
          { key: "region", value: "Region" },
        ]}
        {rows}
      >
        <Toolbar>
          <ToolbarContent>
            <ToolbarSearch
              persistent
              placeholder="Filter databases"
              shouldFilterRows
              bind:filteredRowIds
            />
          </ToolbarContent>
        </Toolbar>
      </DataTable>
    </Column>
  </Row>
</PageHeader>
