<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type LazyNode = TreeNode & { hasChildren?: boolean };

  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    { id: "root", text: "Root", hasChildren: true },
  ];

  let resolveFetch: (() => void) | undefined;

  // Simulates resolving the consumer's async fetch (e.g. after an API call).
  export function resolveLoad() {
    resolveFetch?.();
  }

  function handleToggle(event: CustomEvent<LazyNode>) {
    const node = event.detail;
    if (node.hasChildren && !node.nodes) {
      new Promise<void>((resolve) => {
        resolveFetch = resolve;
      }).then(() => {
        nodes = nodes.map((n) =>
          n.id === node.id
            ? { ...n, nodes: [{ id: "child", text: "Child" }] }
            : n,
        );
      });
    }
  }
</script>

<TreeView {nodes} labelText="Lazy Load Test" on:toggle={handleToggle} let:node>
  {node.text}
  <svelte:fragment slot="childNodes" let:node>
    <InlineLoading status="active" description="Loading {node.text}…" />
  </svelte:fragment>
</TreeView>
