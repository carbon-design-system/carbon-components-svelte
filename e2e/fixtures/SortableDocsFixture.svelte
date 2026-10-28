<script>
  import { Stack } from "carbon-components-svelte";
  import ContainedListReorder from "../../docs/src/pages/framed/ContainedList/ContainedListReorder.svelte";
  import ContainedListReorderGroups from "../../docs/src/pages/framed/ContainedList/ContainedListReorderGroups.svelte";
  import ContainedListReorderPinned from "../../docs/src/pages/framed/ContainedList/ContainedListReorderPinned.svelte";
  import ContainedListReorderVirtual from "../../docs/src/pages/framed/ContainedList/ContainedListReorderVirtual.svelte";
  import DataTableSortableRows from "../../docs/src/pages/framed/DataTable/DataTableSortableRows.svelte";
</script>

<Stack gap={7}>
  <div data-testid="basic"><ContainedListReorder /></div>
  <div data-testid="groups"><ContainedListReorderGroups /></div>
  <div data-testid="pinned"><ContainedListReorderPinned /></div>
  <div data-testid="virtual"><ContainedListReorderVirtual /></div>
  <div data-testid="table"><DataTableSortableRows /></div>
</Stack>
