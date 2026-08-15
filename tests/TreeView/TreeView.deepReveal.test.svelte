<svelte:options accessors />

<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let depth = 500;

  export let shape: "chain" | "bushy" = "chain";

  type ChainNode = { id: number; text: string; nodes?: ChainNode[] };

  function buildChain(totalDepth: number): ChainNode[] {
    let node: ChainNode = {
      id: totalDepth - 1,
      text: `Level ${totalDepth - 1}`,
    };
    for (let i = totalDepth - 2; i >= 0; i--) {
      node = { id: i, text: `Level ${i}`, nodes: [node] };
    }
    return [node];
  }

  function buildBushy(): ChainNode[] {
    let id = 0;
    return Array.from({ length: 10 }, () => ({
      id: id++,
      text: "Root",
      nodes: Array.from({ length: 10 }, () => ({
        id: id++,
        text: "Branch",
        nodes: Array.from({ length: 10 }, () => ({
          id: id++,
          text: "Leaf",
        })),
      })),
    }));
  }

  let treeview: TreeView;
  let expandedIds: number[] = [];

  $: nodes = shape === "chain" ? buildChain(depth) : buildBushy();

  export function showDeepest() {
    treeview.showNode(depth - 1);
  }

  export function expandAll() {
    treeview.expandAll();
  }

  export function expandAllViaProp() {
    expandedIds = Array.from({ length: depth - 1 }, (_, i) => i);
  }
</script>

<TreeView
  labelText="Deep chain"
  {nodes}
  bind:this={treeview}
  bind:expandedIds
/>
