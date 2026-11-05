<script>
  import {
    applySort,
    Box,
    ContainedList,
    ContainedListItem,
    sortable,
    VirtualList,
  } from "carbon-components-svelte";

  let incidents = Array.from({ length: 1000 }, (_, index) => ({
    id: `inc-${index + 1}`,
    summary: `INC-${String(index + 1).padStart(4, "0")}: elevated 5xx rate in us-south`,
  }));
  let scroller = null;

  function handleSort(event) {
    incidents = applySort(incidents, event.detail);
  }
</script>

<div
  use:sortable={{
    itemSelector: ".bx--contained-list-item",
    getLabel: (item) => item.textContent.trim().split(":")[0],
  }}
  on:sort={handleSort}
>
  <Box height="320px" overflowY="auto" bind:ref={scroller}>
    <ContainedList labelText="Incident queue">
      <VirtualList
        items={incidents}
        itemHeight={47}
        containerHeight={320}
        scrollElement={scroller}
        spacerTag="li"
        getKey={(incident) => incident.id}
        let:item
      >
        <ContainedListItem data-sortable-id={item.id}>
          {item.summary}
        </ContainedListItem>
      </VirtualList>
    </ContainedList>
  </Box>
</div>
