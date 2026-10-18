<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import type { ComponentProps } from "svelte";
  import { cloudProducts } from "./fixtures";

  /** Spies for the per-node `select`, `toggle` and `focus` events. */
  export let onSelect: (detail: unknown) => void = () => {};
  export let onToggle: (detail: unknown) => void = () => {};
  export let onFocus: (detail: unknown) => void = () => {};
  /** Spy for every `selectedIds` value, including the initial one. */
  export let onSelectedIds: (ids: ReadonlyArray<string | number>) => void =
    () => {};

  let treeview: TreeView;
  let activeId: string | number = "";
  let selectedIds: (string | number)[] = [];
  let expandedIds: (string | number)[] = [];
  const [first, ...rest] = cloudProducts();
  const nodes: ComponentProps<TreeView>["nodes"] = [
    { ...first, icon: Analytics },
    ...rest,
  ];

  $: onSelectedIds(selectedIds);
</script>

<TreeView
  bind:this={treeview}
  size="compact"
  labelText="Cloud Products"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:select={({ detail }) => onSelect(detail)}
  on:toggle={({ detail }) => onToggle(detail)}
  on:focus={({ detail }) => onFocus(detail)}
  let:node
>
  {node.text}
</TreeView>

<Button on:click={() => treeview.expandNodes()}>
  Expand nodes (no filter)
</Button>
<Button on:click={treeview.expandAll}>Expand all</Button>
<Button on:click={treeview.collapseAll}>Collapse all</Button>
<Button
  on:click={() => {
    treeview.expandNodes((node) => {
      return /^IBM/.test(node.text);
    });
  }}
>
  Expand some nodes
</Button>
<Button
  on:click={() => {
    treeview.collapseNodes((node) => {
      return /^IBM/.test(node.text);
    });
  }}
>
  Collapse some nodes
</Button>
