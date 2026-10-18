<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";
  import { cloudProducts } from "./fixtures";

  type Id = TreeNode["id"];

  export let autoCollapse = false;
  export let multiselect: ComponentProps<TreeView>["multiselect"] = false;
  export let multiselectMode: ComponentProps<TreeView>["multiselectMode"] =
    "node";
  export let selectedIds: Id[] = [];
  export let expandedIds: Id[] = [];
  export let nodes: ComponentProps<TreeView>["nodes"] = cloudProducts();

  /** Spy for the aggregate `select:change` event. */
  export let onSelectChange: (detail: {
    selectedIds: ReadonlyArray<Id>;
    added: Id[];
    removed: Id[];
  }) => void = () => {};
  /** Spy for the aggregate `toggle:change` event. */
  export let onToggleChange: (detail: {
    expandedIds: ReadonlyArray<Id>;
    added: Id[];
    removed: Id[];
  }) => void = () => {};
  /** Spy for the per-node `toggle` event. */
  export let onToggle: (detail: unknown) => void = () => {};

  let treeview: TreeView;
  let activeId: ComponentProps<TreeView>["activeId"] = "";
</script>

<TreeView
  bind:this={treeview}
  {autoCollapse}
  labelText="Change events"
  {multiselect}
  {multiselectMode}
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:toggle={({ detail }) => onToggle(detail)}
  on:select:change={({ detail }) => onSelectChange(detail)}
  on:toggle:change={({ detail }) => onToggleChange(detail)}
/>

<Button data-testid="expand-all" on:click={() => treeview.expandAll()}>
  Expand all
</Button>
<Button data-testid="collapse-all" on:click={() => treeview.collapseAll()}>
  Collapse all
</Button>
<Button
  data-testid="expand-nodes"
  on:click={() => treeview.expandNodes((node) => node.id === 1)}
>
  Expand Analytics
</Button>
<Button
  data-testid="collapse-nodes"
  on:click={() => treeview.collapseNodes((node) => node.id === 1)}
>
  Collapse Analytics
</Button>
<Button
  data-testid="show-node"
  on:click={() => treeview.showNode(3, { focus: false })}
>
  Show Apache Spark
</Button>
<Button
  data-testid="show-node-select"
  on:click={() => treeview.showNode(8, { select: true })}
>
  Show node select
</Button>
<Button data-testid="set-prop" on:click={() => (expandedIds = [1])}>
  Set expanded via prop
</Button>
<Button
  data-testid="noop-set"
  on:click={() => (expandedIds = (expandedIds ?? []).slice())}
>
  No-op set
</Button>
<Button data-testid="select-only" on:click={() => (activeId = 0)}>
  Select only
</Button>
<Button data-testid="auto-collapse" on:click={() => (activeId = 2)}>
  Activate nested node
</Button>
<Button data-testid="set-selected" on:click={() => (selectedIds = [0, 7])}>
  Set selected
</Button>
<Button
  data-testid="set-same"
  on:click={() => (selectedIds = [...selectedIds])}
>
  Set same
</Button>
