<script>
  import { applySort, sortable, Stack } from "carbon-components-svelte";
  import ContainedListReorderBoard from "../../docs/src/pages/framed/ContainedList/ContainedListReorderBoard.svelte";
  import ContainedListReorderGap from "../../docs/src/pages/framed/ContainedList/ContainedListReorderGap.svelte";
  import ContainedListReorderGrid from "../../docs/src/pages/framed/ContainedList/ContainedListReorderGrid.svelte";
  import TreeViewReorder from "../../docs/src/pages/framed/TreeView/TreeViewReorder.svelte";

  // A list inside two nested scroll boxes, to see the drag scroll the inner
  // box first and the outer one when the inner one has run out.
  let rows = Array.from({ length: 60 }, (_, i) => ({
    id: `r${i + 1}`,
    text: `Row ${i + 1}`,
  }));

  function onSort(event) {
    rows = applySort(rows, event.detail);
  }

  // Neighbors step aside: every row between the old and new place is
  // transformed, so the longer the list, the more a move costs.
  let many = Array.from({ length: 300 }, (_, i) => ({
    id: `m${i + 1}`,
    text: `Many ${i + 1}`,
  }));

  function onManySort(event) {
    many = applySort(many, event.detail);
  }
</script>

<Stack gap={7}>
  <div data-testid="tree"><TreeViewReorder /></div>
  <div data-testid="board"><ContainedListReorderBoard /></div>
  <div data-testid="grid"><ContainedListReorderGrid /></div>
  <div data-testid="gap"><ContainedListReorderGap /></div>
  <div class="many" data-testid="many">
    <ul use:sortable={{ label: "Many", feedback: "gap" }} on:sort={onManySort}>
      {#each many as row (row.id)}
        <li class="nested-row" data-sortable-id={row.id}>{row.text}</li>
      {/each}
    </ul>
  </div>
  <div class="outer" data-testid="outer">
    <p>Above the inner box</p>
    <div class="inner" data-testid="inner">
      <ul use:sortable={{ label: "Rows" }} on:sort={onSort}>
        {#each rows as row (row.id)}
          <li class="nested-row" data-sortable-id={row.id}>{row.text}</li>
        {/each}
      </ul>
    </div>
    <p>Below the inner box</p>
    <div class="tail">Tail</div>
  </div>
</Stack>

<style>
  .outer {
    block-size: 360px;
    overflow: auto;
    border: 1px solid;
  }

  .inner {
    block-size: 200px;
    overflow: auto;
    background: #f4f4f4;
  }

  .many {
    block-size: 400px;
    overflow: auto;
    background: #f4f4f4;
  }

  .nested-row {
    padding: 0.5rem 1rem;
  }

  .tail {
    block-size: 600px;
  }
</style>
