<script lang="ts">
  import { Button, TreeView } from "carbon-components-svelte";
  import type { TreeNodeId } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  let treeview: TreeView;
  let activeId: TreeNodeId = "";
  let selectedIds: TreeNodeId[] = [];
  let expandedIds: TreeNodeId[] = [];
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

  $: console.log("activeId", activeId);
  $: console.log("selectedIds", selectedIds);
  $: console.log("expandedIds", expandedIds);
</script>

<TreeView
  bind:this={treeview}
  labelText="showNode Test"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  let:node
>
  {node.text}
</TreeView>

<Button data-testid="show-default" on:click={() => treeview.showNode(3)}>
  Show node (default)
</Button>
<Button data-testid="expand-only" on:click={() => treeview.showNode(3, { select: false, focus: false })}>
  Expand only
</Button>
<Button data-testid="select-only" on:click={() => treeview.showNode(3, { expand: false, focus: false })}>
  Select only
</Button>
<Button data-testid="focus-only" on:click={() => treeview.showNode(3, { expand: false, select: false })}>
  Focus only
</Button>
<Button data-testid="reset" on:click={() => { expandedIds = []; selectedIds = []; activeId = ""; }}>
  Reset
</Button>
