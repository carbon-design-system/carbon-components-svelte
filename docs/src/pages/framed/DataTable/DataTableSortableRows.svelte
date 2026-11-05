<script>
  import {
    applySort,
    Button,
    DataTable,
    sortable,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let rows = [
    { id: "a", rule: "Allow HTTPS", source: "0.0.0.0/0", action: "Allow" },
    {
      id: "b",
      rule: "Block known scanners",
      source: "198.51.100.0/24",
      action: "Deny",
    },
    {
      id: "c",
      rule: "Allow office VPN",
      source: "203.0.113.0/28",
      action: "Allow",
    },
    {
      id: "d",
      rule: "Rate limit API",
      source: "0.0.0.0/0",
      action: "Throttle",
    },
    { id: "e", rule: "Deny all", source: "0.0.0.0/0", action: "Deny" },
  ];

  function handleSort(event) {
    rows = applySort(rows, event.detail);
  }
</script>

<div
  use:sortable={{
    itemSelector: "tbody tr[data-row]",
    handleSelector: "[data-sortable-handle]",
    getId: (row) => row.dataset.row,
    // The second cell holds the name; the whole row would be read aloud.
    getLabel: (row) => row.children[1].textContent.trim(),
  }}
  on:sort={handleSort}
>
  <DataTable
    title="Firewall rules"
    description="Rules run from the top. Drag the handle, or press Space on it, to change the order."
    headers={[
      { key: "handle", value: "Reorder", empty: true },
      { key: "rule", value: "Rule" },
      { key: "source", value: "Source" },
      { key: "action", value: "Action" },
    ]}
    {rows}
  >
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "handle"}
        <Button
          kind="ghost"
          size="small"
          icon={Draggable}
          iconDescription="Reorder {row.rule}"
          tooltipPosition="right"
          data-sortable-handle
        />
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</div>
