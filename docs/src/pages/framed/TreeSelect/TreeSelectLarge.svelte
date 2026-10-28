<script>
  import { TreeSelect } from "carbon-components-svelte";

  // 5,000 nodes: 10 groups of 10 subgroups of 49 leaves, plus their parents.
  const nodes = Array.from({ length: 10 }, (_, a) => ({
    id: `g${a}`,
    text: `Group ${a}`,
    nodes: Array.from({ length: 10 }, (_, b) => ({
      id: `g${a}-${b}`,
      text: `Group ${a}.${b}`,
      nodes: Array.from({ length: 49 }, (_, c) => ({
        id: `g${a}-${b}-${c}`,
        text: `Leaf ${a}.${b}.${c}`,
      })),
    })),
  }));

  let checkedIds = [];
</script>

<TreeSelect
  labelText="Assets"
  placeholder="Search 5,000 nodes"
  helperText="Only the rows in view mount."
  {nodes}
  selectionMode="checkbox"
  selectionDisplay="tags"
  tagOverflow="collapse"
  filterable
  bind:checkedIds
/>
<p>{checkedIds.length} checked</p>
