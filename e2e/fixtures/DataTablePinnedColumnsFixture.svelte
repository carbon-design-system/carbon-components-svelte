<script>
  import {
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  // Options come from the query string, so one fixture covers the layouts
  // a pinned table has to survive: `selectable`, `batch`, `expandable`,
  // `stickyHeader`, `zebra`, `size=compact`, `virtualize`, `rtl`, `bare` (no widths).
  const params = new URLSearchParams(location.search);
  const has = (name) => params.has(name);
  const bare = has("bare");

  if (has("rtl")) document.documentElement.setAttribute("dir", "rtl");

  const headers = [
    { key: "name", value: "Name", columnPinned: "start", width: "10rem" },
    { key: "region", value: "Region", width: "12rem" },
    { key: "service", value: "Service", width: "14rem" },
    // Declared after the unpinned columns, rendered beside the first pin.
    { key: "id", value: "ID", columnPinned: "start", width: "6rem" },
    { key: "environment", value: "Environment", width: "12rem" },
    { key: "owner", value: "Owner", width: "12rem" },
    { key: "actions", value: "Actions", columnPinned: "end", width: "6rem" },
  ].map((header) => (bare ? { ...header, width: undefined } : header));

  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: `row-${i}`,
    name: `Load balancer ${i}`,
    region: "us-east-1",
    service: `payments-api-${i}`,
    environment: "production",
    owner: "platform-team",
  }));

  let selectedRowIds = has("selectable") || has("batch") ? ["row-1"] : [];
</script>

<div data-testid="pinned-root" style="width: 480px; max-width: 100%;">
  <DataTable
    {headers}
    {rows}
    zebra={has("zebra")}
    fixedLayout={has("fixed")}
    size={params.get("size") ?? undefined}
    virtualize={has("virtualize")
      ? { itemHeight: 48, maxVisibleRows: 5 }
      : undefined}
    stickyHeader={has("stickyHeader")}
    stickyHeaderMaxHeight={has("stickyHeader") ? 240 : undefined}
    expandable={has("expandable")}
    selectable={has("selectable") || has("batch")}
    batchSelection={has("batch")}
    bind:selectedRowIds
  >
    <svelte:fragment slot="cell" let:cell let:row>
      {#if cell.key === "actions"}
        <OverflowMenu flipped aria-label="Actions for {row.name}">
          <OverflowMenuItem text="Restart" />
          <OverflowMenuItem text="Delete" danger />
        </OverflowMenu>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="expandedRow" let:row>
      Details for {row.name}
    </svelte:fragment>
  </DataTable>
</div>
