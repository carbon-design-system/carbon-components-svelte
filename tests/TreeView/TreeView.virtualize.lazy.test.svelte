<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type LazyNode = TreeNode & { hasChildren?: boolean };

  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    { id: "root-a", text: "Folder A", hasChildren: true },
    { id: "root-b", text: "Folder B", hasChildren: true },
    ...Array.from({ length: 80 }, (_, i) => ({
      id: `pad-${i}`,
      text: `Padding ${i}`,
      hasChildren: true,
    })),
  ];

  let resolveFetch: (() => void) | undefined;

  export function resolveLoad() {
    resolveFetch?.();
  }

  function updateNode(
    list: LazyNode[],
    id: LazyNode["id"],
    updater: (n: LazyNode) => LazyNode,
  ): LazyNode[] {
    return list.map((n) => {
      if (n.id === id) return updater(n);
      if (n.nodes) {
        return {
          ...n,
          nodes: updateNode(n.nodes as LazyNode[], id, updater),
        };
      }
      return n;
    });
  }

  function handleToggle(event: CustomEvent<LazyNode>) {
    const node = event.detail;
    if (!node.hasChildren || node.nodes) return;

    nodes = updateNode(nodes as LazyNode[], node.id, (n) => ({
      ...n,
      nodes: [{ id: `${n.id}__loading`, text: "Loading…", disabled: true }],
    }));

    new Promise<void>((resolve) => {
      resolveFetch = resolve;
    }).then(() => {
      nodes = updateNode(nodes as LazyNode[], node.id, (n) => ({
        ...n,
        nodes: [
          { id: `${n.id}-child-1`, text: `${n.text} child 1` },
          { id: `${n.id}-child-2`, text: `${n.text} child 2` },
        ],
      }));
    });
  }
</script>

<TreeView
  {nodes}
  labelText="Lazy virtual tree"
  virtualize={{ maxVisibleRows: 10 }}
  on:toggle={handleToggle}
/>
