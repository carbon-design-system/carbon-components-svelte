<script>
  import {
    Button,
    DataTable,
    Link,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarMenu,
    ToolbarMenuItem,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
    { id: "d", name: "Load Balancer 6", port: 3000, rule: "Round robin" },
  ];

  const menuHeaders = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port", columnAlign: "end" },
    { key: "link", value: "Link" },
    { key: "menu", empty: true, columnMenu: true },
  ];
</script>

<!--
  Every DataTable variant on one page, for e2e/cascade-snapshot.ts. Tables are
  kept to four rows so the forced-state pass stays within its element budget.
-->
<section data-testid="sizes">
  {#each ["compact", "short", "medium", "tall"] as size}
    <DataTable {size} {headers} rows={rows.slice(0, 2)} />
  {/each}
</section>

<section data-testid="title">
  <DataTable
    title="Load balancers"
    description="Your organization's balancers"
    {headers}
    rows={rows.slice(0, 2)}
  />
</section>

<section data-testid="zebra">
  <DataTable zebra {headers} {rows} />
  <DataTable zebra expandable expandedRowIds={["b"]} {headers} {rows}>
    <svelte:fragment slot="expandedRow" let:row>
      <p>Expanded {row.name}</p>
    </svelte:fragment>
  </DataTable>
</section>

<section data-testid="selectable">
  <DataTable selectable selectedRowIds={["b"]} {headers} {rows} />
  <DataTable radio selectable selectedRowIds={["c"]} {headers} {rows} />
  <DataTable
    selectable
    nonSelectableRowIds={["a"]}
    {headers}
    rows={rows.slice(0, 2)}
  />
</section>

<section data-testid="expandable">
  <DataTable
    expandable
    expandedRowIds={["a"]}
    nonExpandableRowIds={["d"]}
    {headers}
    {rows}
  >
    <svelte:fragment slot="expandedRow" let:row>
      <p>Expanded {row.name}</p>
    </svelte:fragment>
  </DataTable>
  <DataTable
    expandable
    batchSelection
    expandedRowIds={["b"]}
    selectedRowIds={["b", "c"]}
    {headers}
    {rows}
  >
    <svelte:fragment slot="expandedRow" let:row>
      <p>Expanded {row.name}</p>
    </svelte:fragment>
  </DataTable>
  <DataTable
    expandable
    radio
    selectable
    expandedRowIds={["a"]}
    selectedRowIds={["a"]}
    {headers}
    {rows}
  >
    <svelte:fragment slot="expandedRow" let:row>
      <p>Expanded {row.name}</p>
    </svelte:fragment>
  </DataTable>
</section>

<section data-testid="highlighted">
  <DataTable highlightedRowIds={["b"]} {headers} {rows} />
  <DataTable
    zebra
    selectable
    selectedRowIds={["b"]}
    highlightedRowIds={["b", "c"]}
    {headers}
    {rows}
  />
</section>

<section data-testid="sortable">
  <DataTable
    sortable
    sortKey="port"
    sortDirection="ascending"
    headers={menuHeaders}
    {rows}
  >
    <svelte:fragment slot="cell" let:cell let:row>
      {#if cell.key === "link"}
        <Link href="#">{row.name}</Link>
      {:else if cell.key === "menu"}
        <span>…</span>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</section>

<section data-testid="sticky">
  <DataTable
    stickyHeader
    expandable
    selectable
    expandedRowIds={["a"]}
    selectedRowIds={["b"]}
    {headers}
    {rows}
  >
    <svelte:fragment slot="expandedRow" let:row>
      <p>Expanded {row.name}</p>
    </svelte:fragment>
  </DataTable>
  <DataTable
    stickyHeader
    size="compact"
    headers={menuHeaders}
    rows={rows.slice(0, 2)}
  />
</section>

<section data-testid="static">
  <DataTable useStaticWidth {headers} rows={rows.slice(0, 2)} />
</section>

<section data-testid="toolbar">
  <DataTable batchSelection selectedRowIds={["a"]} {headers} {rows}>
    <Toolbar>
      <ToolbarBatchActions>
        <Button>Save</Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch />
        <ToolbarMenu>
          <ToolbarMenuItem>Restart all</ToolbarMenuItem>
        </ToolbarMenu>
        <Button>Create</Button>
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <DataTable size="short" {headers} rows={rows.slice(0, 2)}>
    <Toolbar size="sm">
      <ToolbarContent>
        <ToolbarSearch persistent value="Load" />
        <ToolbarSearch disabled />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
</section>

<section data-testid="footer">
  <DataTable {headers} rows={rows.slice(0, 2)}>
    <svelte:fragment slot="footerCell" let:header let:index>
      {#if index === 0}
        Total
      {:else if header.key === "port"}
        3443
      {/if}
    </svelte:fragment>
  </DataTable>
  <DataTable selectable {headers} rows={rows.slice(0, 2)}>
    <svelte:fragment slot="footerCell" let:index>
      {#if index === 0}
        Total
      {/if}
    </svelte:fragment>
  </DataTable>
  <DataTable
    stickyHeader
    size="tall"
    selectable
    {headers}
    rows={rows.slice(0, 2)}
  >
    <svelte:fragment slot="footerCell" let:index>
      {#if index === 0}
        Total
      {/if}
    </svelte:fragment>
  </DataTable>
</section>
