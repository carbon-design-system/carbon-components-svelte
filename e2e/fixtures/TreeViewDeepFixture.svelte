<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const DEPTH = 100;

  function buildDeepTree(depth: number) {
    let lastId = 0;
    let idCounter = 0;
    function make(level: number): any {
      const node: any = { id: idCounter++, text: `Level ${level}` };
      lastId = node.id;
      if (level < depth) node.nodes = [make(level + 1)];
      return node;
    }
    return { nodes: [make(0)], lastId };
  }

  const { nodes, lastId } = buildDeepTree(DEPTH);
  const deepest = lastId;

  let treeview: TreeView;
</script>

<TreeView
  bind:this={treeview}
  data-testid="deep-tree"
  labelText="Deep tree"
  nodes={nodes as ComponentProps<TreeView>["nodes"]}
  let:node
>
  {node.text}
</TreeView>

<button data-testid="show-deepest" on:click={() => treeview.showNode(deepest)}>
  Show deepest
</button>
<button data-testid="expand-all" on:click={() => treeview.expandAll()}>
  Expand all
</button>
<button data-testid="expand-nodes" on:click={() => treeview.expandNodes()}>
  Expand nodes
</button>
