<script>
  import {
    applySort,
    Button,
    ContainedList,
    ContainedListItem,
    sortable,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let services = [
    { id: "auth", name: "auth-service" },
    { id: "billing", name: "billing-worker" },
    { id: "search", name: "search-indexer" },
    { id: "notify", name: "notification-relay" },
    { id: "reports", name: "report-builder" },
  ];

  function handleSort(event) {
    services = applySort(services, event.detail);
  }
</script>

<div
  use:sortable={{
    itemSelector: ".bx--contained-list-item",
    handleSelector: "[data-sortable-handle]",
  }}
  on:sort={handleSort}
>
  <ContainedList labelText="Deployment order">
    {#each services as service (service.id)}
      <ContainedListItem data-sortable-id={service.id}>
        {service.name}
        <Button
          slot="action"
          kind="ghost"
          size="small"
          icon={Draggable}
          iconDescription="Reorder {service.name}"
          tooltipPosition="left"
          data-sortable-handle
        />
      </ContainedListItem>
    {/each}
  </ContainedList>
</div>
