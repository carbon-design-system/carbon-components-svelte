<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";

  const nodes: TreeNode[] = [
    {
      id: 0,
      text: "Parent",
      nodes: [
        { id: 1, text: "Child A" },
        { id: 2, text: "Child B" },
      ],
    },
  ];
</script>

<TreeView labelText="First" {nodes} expandedIds={[0]} let:node>
  {node.text}
</TreeView>
<TreeView labelText="Second" {nodes} expandedIds={[0]} let:node>
  {node.text}
</TreeView>
