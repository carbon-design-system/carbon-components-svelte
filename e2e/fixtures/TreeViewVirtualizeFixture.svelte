<script lang="ts">
  import { Button, TreeView } from "carbon-components-svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";

  let nextId = 0;
  const id = () => nextId++;

  /**
   * Leaf at the deepest level, used as a `showNode` target. Building
   * `nodes` sets it, so it is a number by the time anything renders.
   */
  let deepFile: number | null = null;

  function makeFolder(
    name: string,
    depth: number,
    fanout: { files: number; folders: number; maxDepth: number },
  ): TreeNode<number> {
    const node: { id: number; text: string; nodes: TreeNode<number>[] } = {
      id: id(),
      text: name,
      nodes: [],
    };
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

  let treeview: TreeView<TreeNode<number>> | null = null;
  let expandedIds: number[] = [];
  let scrollContainerRef: HTMLUListElement | null = null;
</script>

<Button
  size="small"
  data-testid="jump-deep"
  on:click={() => treeview?.showNode(deepFile!)}
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
