<script>
  import { TreeView } from "carbon-components-svelte";

  let activeId = "";
  let selectedIds = [];
  let expandedIds = [];

  const nodes = [
    { id: "1", text: "Parent 1", nodes: [{ id: "1-1", text: "Child 1-1" }] },
    { id: "2", text: "Parent 2", nodes: [{ id: "2-1", text: "Child 2-1" }] },
  ];
</script>

<TreeView
  data-testid="tree-view"
  labelText="Tree"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
/>
