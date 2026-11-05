<script>
  import {
    applySort,
    Button,
    ContainedList,
    ContainedListItem,
    sortable,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let regions = [
    { id: "us-south", name: "us-south (primary)" },
    { id: "eu-de", name: "eu-de" },
    { id: "jp-tok", name: "jp-tok" },
    { id: "au-syd", name: "au-syd" },
  ];

  function handleSort(event) {
    const { oldIndex, newIndex } = event.detail;
    // The primary region stays first. Preventing the event leaves the order
    // as it was, and the drop is announced as cancelled.
    if (oldIndex === 0 || newIndex === 0) {
      event.preventDefault();
      return;
    }
    regions = applySort(regions, event.detail);
  }
</script>

<div
  use:sortable={{
    itemSelector: ".bx--contained-list-item",
    handleSelector: "[data-sortable-handle]",
  }}
  on:sort={handleSort}
>
  <ContainedList labelText="Failover order">
    {#each regions as region (region.id)}
      <ContainedListItem data-sortable-id={region.id}>
        {region.name}
        <Button
          slot="action"
          kind="ghost"
          size="small"
          icon={Draggable}
          iconDescription="Reorder {region.name}"
          tooltipPosition="left"
          data-sortable-handle
        />
      </ContainedListItem>
    {/each}
  </ContainedList>
</div>
