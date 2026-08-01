<script>
  import { Button, TreeView } from "carbon-components-svelte";

  let nextId = 0;
  const id = () => nextId++;

  /** Leaf at the deepest level, used as a `showNode` target. */
  let deepFile = null;

  function makeFolder(name, depth, fanout) {
    const node = { id: id(), text: name, nodes: [] };
    for (let i = 0; i < fanout.files; i++) {
      const file = { id: id(), text: `${name}/file-${i}` };
      node.nodes.push(file);
      if (depth === fanout.maxDepth) deepFile = file.id;
    }
    if (depth < fanout.maxDepth) {
      for (let i = 0; i < fanout.folders; i++) {
        node.nodes.push(makeFolder(`${name}/sub-${i}`, depth + 1, fanout));
      }
    }
    return node;
  }

  const nodes = Array.from({ length: 40 }, (_, i) =>
    makeFolder(`root-${i}`, 0, { files: 8, folders: 4, maxDepth: 4 }),
  );

  let treeview = null;
  let expandedIds = [];
  let scrollContainerRef = null;
</script>

<Button
  size="small"
  data-testid="jump-deep"
  on:click={() => treeview?.showNode(deepFile)}
>
  Jump to a deep file
</Button>

<TreeView
  bind:this={treeview}
  bind:scrollContainerRef
  data-testid="tree-view-virtualize"
  labelText="Project files"
  {nodes}
  bind:expandedIds
  virtualize={{ containerHeight: 480 }}
  let:node
>
  {node.text}
</TreeView>
