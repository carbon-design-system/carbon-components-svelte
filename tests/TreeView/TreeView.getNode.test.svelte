<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  let treeview: TreeView;
  let selectedIds: TreeNode["id"][] = [];
  let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "Level 0" },
    {
      id: 1,
      text: "Level 1",
      nodes: [
        {
          id: 2,
          text: "Level 2",
          nodes: [
            { id: 3, text: "Level 3 - Target" },
            { id: 4, text: "Level 3 - Other" },
          ],
        },
      ],
    },
  ];
</script>

<TreeView
  bind:this={treeview}
  labelText="getNode Test"
  {nodes}
  bind:selectedIds
  let:node
>
  {node.text}
</TreeView>

<Button
  data-testid="get-node"
  on:click={() => console.log("getNode", treeview.getNode(3))}
>
  Get node
</Button>
<Button
  data-testid="get-missing-node"
  on:click={() => console.log("getNode", treeview.getNode(999))}
>
  Get missing node
</Button>
<Button
  data-testid="get-nodes"
  on:click={() => console.log("getNodes", treeview.getNodes([3, 999, 0]))}
>
  Get nodes
</Button>
