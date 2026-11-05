<script lang="ts">
  import {
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const headers = [
    { key: "service", value: "Service" },
    { key: "status", value: "Status" },
    { key: "actions", value: "" },
  ] as const;

  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: `row-${i}`,
    service: `payments-api-${i}`,
    status: "Healthy",
  }));

  // `?size=compact` and the like pick the row height.
  const size = (new URLSearchParams(location.search).get("size") ??
    undefined) as ComponentProps<DataTable>["size"];
</script>

<div style="max-width: 600px">
  <DataTable
    {headers}
    {rows}
    {size}
    selectable
    expandable
    stickyHeader
    stickyHeaderMaxHeight={240}
  >
    <svelte:fragment slot="cell" let:cell>
      {#if cell.key === "actions"}
        <OverflowMenu iconDescription="Actions">
          <OverflowMenuItem text="Rename" />
          <OverflowMenuItem text="Delete" />
        </OverflowMenu>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="expandedRow" let:row>{row.service}</svelte:fragment>
  </DataTable>
</div>
